import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Enable CORS and disable caching for all API endpoints
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Persistent settings storage
const DATA_DIR = path.join(__dirname, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'admin_settings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface AdminSettings {
  linkingCode: string;
  isActive: boolean;
  allowConnection: boolean;
  adminUsername?: string;
  adminPassword?: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  linkingCode: 'G5KPWFAA',
  isActive: true,
  allowConnection: false,
  adminUsername: 'admin',
  adminPassword: 'admin',
  updatedAt: new Date().toISOString(),
};

let currentSettings: AdminSettings = DEFAULT_SETTINGS;

try {
  if (fs.existsSync(SETTINGS_FILE)) {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } else {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('Using default admin settings:', e);
}

// Connected SSE clients (desktop browsers, mobile phones, etc.)
const sseClients: Response[] = [];

// Helper to set aggressive no-cache headers for mobile devices
function setNoCacheHeaders(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

// GET /api/admin/settings - Read latest settings from server with cache disabled
app.get('/api/admin/settings', (_req: Request, res: Response) => {
  setNoCacheHeaders(res);
  res.json({
    success: true,
    data: currentSettings,
  });
});

// POST /api/admin/login - Authenticate admin credentials against persistent server settings
app.post('/api/admin/login', (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  const { username, password } = req.body || {};
  const currentAdminUser = (currentSettings.adminUsername || 'admin').trim();
  const currentAdminPass = (currentSettings.adminPassword || 'admin').trim();

  const inputUser = (username || '').trim();
  const inputPass = (password || '').trim();

  // Case-insensitive comparison for username to avoid mobile keyboard auto-capitalization issues
  if (
    inputUser &&
    inputPass &&
    inputUser.toLowerCase() === currentAdminUser.toLowerCase() &&
    inputPass === currentAdminPass
  ) {
    return res.json({
      success: true,
      message: 'Admin authenticated successfully',
      data: currentSettings,
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password. Please try again.',
  });
});

// POST /api/admin/settings - Save settings and broadcast to all connected devices (mobile & desktop)
app.post('/api/admin/settings', (req: Request, res: Response) => {
  setNoCacheHeaders(res);
  try {
    const updates = req.body || {};
    currentSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save to persistent file
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to write admin_settings.json:', err);
    }

    // Broadcast to all connected clients (mobile, desktop, tablet)
    const payload = JSON.stringify({
      type: 'settings_update',
      data: currentSettings,
    });

    for (let i = sseClients.length - 1; i >= 0; i--) {
      const client = sseClients[i];
      try {
        client.write(`data: ${payload}\n\n`);
        (client as any).flush?.();
      } catch (err) {
        sseClients.splice(i, 1);
      }
    }

    res.json({
      success: true,
      data: currentSettings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/admin/events - Server-Sent Events stream for instant cross-device synchronization
app.get('/api/admin/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  // Send current state immediately on connect
  res.write(
    `data: ${JSON.stringify({
      type: 'initial_state',
      data: currentSettings,
    })}\n\n`
  );
  (res as any).flush?.();

  sseClients.push(res);

  // Keepalive heartbeat every 15s to prevent mobile browsers and cellular networks from dropping the SSE stream
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
      (res as any).flush?.();
    } catch (err) {
      clearInterval(keepAliveInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

function getLocalIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  return 'localhost';
}

// Mount Vite in development or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`--------------------------------------------------`);
    console.log(`WhatsBackup full-stack server running:`);
    console.log(`- Laptop / Local:  http://localhost:${PORT}`);
    console.log(`- Mobile / Network: http://${localIp}:${PORT}`);
    console.log(`--------------------------------------------------`);
  });
}

startServer();
