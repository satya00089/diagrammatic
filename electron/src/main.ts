import {
  app,
  BrowserWindow,
  protocol,
  shell,
  ipcMain,
  session,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import { autoUpdater } from "electron-updater";

// ─── Constants ───────────────────────────────────────────────────────────────

const IS_DEV = !app.isPackaged;
const DEV_URL = "http://localhost:5173";

// Path to the compiled Vite web app.
// Both dev and prod compile to electron/dist/main.js, so ../../dist always
// resolves to diagrammatic/dist/ — the Vite build output.
const WEB_DIST = path.join(__dirname, "../../dist");

// ─── Deep-link / OAuth scheme ─────────────────────────────────────────────
// Registers diagrammatic:// with the OS so Google OAuth can redirect back.
const DEEP_LINK_SCHEME = "diagrammatic";

if (process.defaultApp) {
  // dev: argv[2] holds the URL when launched via `electron . diagrammatic://...`
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME);
}

// ─── Register custom protocol BEFORE app.whenReady (Electron requirement) ─
// Must be called synchronously before the app is ready.
if (!IS_DEV) {
  protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
}

// ─── Single instance lock (required for deep-link on Windows/Linux) ───────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ─── Main window ─────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Diagrammatic",
    // Use the icon from the assets folder next to this compiled file
    icon: path.join(__dirname, "../assets/icon.png"),
    webPreferences: {
      nodeIntegration: false,         // keep renderer sandboxed
      contextIsolation: true,         // required for safe preload bridge
      preload: path.join(__dirname, "preload.js"),
      devTools: IS_DEV,
    },
  });

  // ── Content Security Policy ──────────────────────────────────────────────
  session.defaultSession.webRequest.onHeadersReceived(
    (details: Electron.OnHeadersReceivedListenerDetails, callback: (response: Electron.HeadersReceivedResponse) => void) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          [
            "default-src 'self' app: https:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",  // Vite HMR needs unsafe-eval in dev
            "style-src 'self' 'unsafe-inline' https:",
            "img-src 'self' data: blob: https: app:",
            "connect-src 'self' https: wss: ws:",   // API + Yjs WebSocket
            "font-src 'self' data: https:",
          ].join("; "),
        ],
      },
    });
  }
  );

  // ── Load app ──────────────────────────────────────────────────────────────
  if (IS_DEV) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL("app://./index.html");
  }

  // Open anchor links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (url.startsWith("http") || url.startsWith("https")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── Custom app:// protocol (production file serving) ─────────────────────
// Serves the Vite dist folder under app:// avoiding file:// path quirks.
function registerAppProtocol() {
  protocol.handle("app", (request: Request) => {
    // Strip "app://./" prefix → relative path inside dist
    let relativePath = request.url.replace(/^app:\/\/\.\//, "");

    // Strip any query string / hash
    relativePath = relativePath.split("?")[0].split("#")[0];

    // Decode URI components (spaces, special chars)
    relativePath = decodeURIComponent(relativePath);

    const filePath = path.join(WEB_DIST, relativePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return new Response(fs.readFileSync(filePath), {
        headers: { "Content-Type": getMimeType(filePath) },
      });
    }

    // SPA fallback — serve index.html for any unknown path
    const indexPath = path.join(WEB_DIST, "index.html");
    return new Response(fs.readFileSync(indexPath), {
      headers: { "Content-Type": "text/html" },
    });
  });
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mime: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
  };
  return mime[ext] ?? "application/octet-stream";
}

// ─── Deep link handler ────────────────────────────────────────────────────
// When Google OAuth redirects to diagrammatic://auth?token=..., we extract
// the token and send it to the renderer via IPC so AuthContext can store it.
function handleDeepLink(url: string) {
  if (!mainWindow) return;
  if (url.startsWith(`${DEEP_LINK_SCHEME}://`)) {
    mainWindow.webContents.send("deep-link", url);
    // Bring the window to the foreground
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-floating-promises
app.whenReady().then(() => {
  if (!IS_DEV) {
    registerAppProtocol();
  }

  createWindow();

  // macOS: deep link callback
  app.on("open-url", (_event: Electron.Event, url: string) => {
    handleDeepLink(url);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Auto-updater (only in production)
  if (!IS_DEV) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// Windows / Linux: deep link arrives via second-instance argv
app.on("second-instance", (_event: Electron.Event, argv: string[]) => {
  const deepLinkUrl = argv.find((arg: string) =>
    arg.startsWith(`${DEEP_LINK_SCHEME}://`)
  );
  if (deepLinkUrl) handleDeepLink(deepLinkUrl);

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── IPC: open OAuth in system browser ───────────────────────────────────
// Renderer calls window.electronAPI.openExternal(url) to trigger Google login
ipcMain.handle("open-external", (_event: Electron.IpcMainInvokeEvent, url: string) => {
  shell.openExternal(url);
});
