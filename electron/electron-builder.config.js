/** @type {import('electron-builder').Configuration} */
const config = {
  appId: "com.satya.diagrammatic",
  productName: "Diagrammatic",
  copyright: `Copyright © ${new Date().getFullYear()} Satya`,

  directories: {
    buildResources: "assets",
    output: "release",
  },

  // Files to include in the packaged app.
  // electron/dist/ = compiled main.ts + preload.ts
  // ../dist/       = Vite web build output
  files: [
    "dist/**/*",          // compiled electron main process (tsc output)
    "assets/**/*",        // app icons
    // Place the renderer (Vite) build into a separate folder to avoid
    // colliding with the electron main `dist/` files.
    {
      from: "../dist",    // Vite web build
      to: "renderer",     // maps to app/renderer inside the package
      filter: ["**/*"],
    },
  ],

  // Register diagrammatic:// URI scheme with the OS for OAuth deep links
  protocols: [
    {
      name: "Diagrammatic",
      schemes: ["diagrammatic"],
      role: "Viewer",
    },
  ],

  // ── Windows ──────────────────────────────────────────────────────────────
  win: {
    target: [
      { target: "nsis", arch: ["x64"] },
      { target: "portable", arch: ["x64"] },
    ],
    icon: "assets/icon.ico",
  },
  nsis: {
    oneClick: false,
    allowDirChange: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Diagrammatic",
  },

  // ── macOS ─────────────────────────────────────────────────────────────────
  mac: {
    target: [{ target: "dmg", arch: ["x64", "arm64"] }],
    icon: "assets/icon.icns",
    category: "public.app-category.developer-tools",
    hardenedRuntime: true,
    entitlements: "assets/entitlements.mac.plist",
    entitlementsInherit: "assets/entitlements.mac.plist",
  },
  dmg: {
    sign: false,
  },

  // ── Linux ─────────────────────────────────────────────────────────────────
  linux: {
    target: [{ target: "AppImage", arch: ["x64"] }],
    icon: "assets/icon.png",
    category: "Development",
  },

  // ── Auto-update (GitHub Releases) ────────────────────────────────────────
  publish: [
    {
      provider: "github",
      owner: "satya00089",
      repo: "diagrammatic",
      releaseType: "release",
    },
  ],
};

module.exports = config;
