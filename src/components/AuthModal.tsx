import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useTheme } from "../hooks/useTheme";
import { apiService } from "../services/api";

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
let googleIdentityScriptPromise: Promise<void> | null = null;
let googleIdentityInitialized = false;

const loadGoogleIdentityScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise;
  }

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_IDENTITY_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Google Identity Services"));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.body.appendChild(script);
  });

  return googleIdentityScriptPromise;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name?: string) => Promise<void>;
  onGoogleLogin?: (credential: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSignup,
  onGoogleLogin,
}) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const { theme } = useTheme();
  const googleResponseRef = useRef<(response: GoogleCredentialResponse) => void>(
    () => {},
  );

  const resolvedDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleGoogleResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!onGoogleLogin) return;

      setIsLoading(true);
      setError("");

      try {
        await onGoogleLogin(response.credential);
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Google authentication failed",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onGoogleLogin, onClose],
  );

  useEffect(() => {
    googleResponseRef.current = handleGoogleResponse;
  }, [handleGoogleResponse]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!isOpen || !onGoogleLogin) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      const container = document.getElementById("google-signin-button");
      if (!container || !window.google) return;

      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, {
        theme: resolvedDarkMode ? "filled_black" : "outline",
        size: "large",
        width: 400,
        text: mode === "login" ? "signin_with" : "signup_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    };

    const initializeGoogle = async () => {
      await loadGoogleIdentityScript();
      if (cancelled || !window.google) return;

      if (!googleIdentityInitialized) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: (response: GoogleCredentialResponse) => {
            googleResponseRef.current(response);
          },
        });
        googleIdentityInitialized = true;
      }

      renderGoogleButton();
    };

    initializeGoogle().catch((err) => {
      console.error("Failed to initialize Google Sign-In", err);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, onGoogleLogin, resolvedDarkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await onLogin(email, password);
        onClose();
      } else {
        await onSignup(email, password, name || undefined);
        setVerificationEmail(email);
      }
      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        if (mode === "login" && message.toLowerCase().includes("activate your account")) {
          setVerificationEmail(email);
        } else {
          setError(message);
        }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
    setVerificationEmail("");
    setResendMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-theme/10 bg-surface p-6 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-theme">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                aria-label="Close"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted mb-6">
              {mode === "login"
                ? "Sign in to save, sync, and share your diagrams across devices"
                : "Create an account to save your work, sync it across devices, and unlock sharing"}
            </p>

            <div className="mb-6 rounded-xl border border-theme/10 bg-[var(--bg-hover)]/60 px-4 py-3 text-sm text-muted">
              Signing in enables cloud saves, shared diagrams, and collaboration-ready workflows.
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
                  resolvedDarkMode
                    ? "border-red-700 bg-red-950/40 text-red-100"
                    : "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-200"
                }`}
              >
                {error}
              </div>
            )}

            {verificationEmail ? (
              <div className="space-y-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/10 p-5 text-center">
                <h3 className="text-lg font-bold text-theme">Check your inbox</h3>
                <p className="text-sm text-muted">
                  We sent an activation link to <strong className="text-theme">{verificationEmail}</strong>.
                  Open it within 20 minutes, then sign in.
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    setError("");
                    try {
                      const response = await apiService.resendVerification(verificationEmail);
                      setResendMessage(response.message);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unable to resend activation email");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="text-sm font-medium text-[var(--brand)] hover:underline disabled:opacity-50"
                >
                  Resend activation email
                </button>
                {resendMessage && <p className="text-xs text-muted">{resendMessage}</p>}
              </div>
            ) : <>
            {/* Google Sign-In Button */}
            {onGoogleLogin && (
              <>
                <div
                  id="google-signin-button"
                  className="flex justify-center mb-4"
                ></div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-theme/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface text-muted">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-theme mb-2"
                  >
                    Name (optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-theme/5 border border-theme/20 rounded-lg text-theme placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-theme mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-theme/5 border border-theme/20 rounded-lg text-theme placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-theme mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 pr-12 bg-theme/5 border border-theme/20 rounded-lg text-theme placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-theme focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-r-lg"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <MdVisibilityOff className="h-5 w-5" /> : <MdVisibility className="h-5 w-5" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="mt-1 text-xs text-muted">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-theme mb-2"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                      aria-describedby="confirm-password-help"
                      className="w-full px-4 py-2 pr-12 bg-theme/5 border border-theme/20 rounded-lg text-theme placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-theme focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-r-lg"
                      aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                      title={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    >
                      {showConfirmPassword ? <MdVisibilityOff className="h-5 w-5" /> : <MdVisibility className="h-5 w-5" />}
                    </button>
                  </div>
                  <p id="confirm-password-help" className="mt-1 text-xs text-muted">
                    {confirmPassword.length > 0 && password !== confirmPassword
                      ? "Passwords do not match"
                      : "Re-enter your password to confirm it"}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-[var(--brand)] text-white font-bold rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>
            </>}

            {/* Switch mode */}
            {!verificationEmail && <div className="mt-6 text-center">
              <p className="text-muted text-sm">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-[var(--brand)] font-medium hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>}

            {/* Optional note */}
            {!verificationEmail && <div className="mt-6 p-3 bg-theme/5 rounded-lg">
              <p className="text-xs text-muted text-center">
                🔒 Your designs are securely stored and only accessible to you
              </p>
            </div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
