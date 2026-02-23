import { contextBridge, ipcRenderer } from "electron";

/**
 * Exposes a minimal, typed API to the renderer process.
 * contextIsolation: true ensures this is the ONLY bridge — no raw Node APIs leak.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Opens a URL in the system default browser.
   * Used for Google OAuth: renderer calls this with the Google auth URL,
   * the user logs in, and Google redirects to diagrammatic://auth?token=...
   * which Electron catches and forwards via onDeepLink.
   */
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  /**
   * Subscribe to deep-link events (e.g. diagrammatic://auth?token=...).
   * AuthContext listens to this to receive the OAuth token.
   */
  onDeepLink: (callback: (url: string) => void) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (_event: any, url: string) =>
      callback(url);
    ipcRenderer.on("deep-link", handler);
    // Return a cleanup function so React effects can unsubscribe
    return () => ipcRenderer.removeListener("deep-link", handler);
  },

  /** True when running inside Electron — can also be used as a feature flag. */
  isElectron: true,
});
