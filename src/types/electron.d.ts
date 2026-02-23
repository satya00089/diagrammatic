/**
 * Type declarations for the Electron preload bridge.
 * Exposed via contextBridge in electron/src/preload.ts.
 * Available only when running inside Electron.
 */
interface ElectronAPI {
  /** Opens a URL in the system default browser (e.g. for Google OAuth). */
  openExternal: (url: string) => Promise<void>;

  /**
   * Subscribe to deep-link events (e.g. diagrammatic://auth?token=...).
   * Returns a cleanup function to unsubscribe.
   */
  onDeepLink: (callback: (url: string) => void) => () => void;

  /** Always true — use to conditionally enable desktop-only features. */
  isElectron: true;
}

interface Window {
  electronAPI?: ElectronAPI;
}
