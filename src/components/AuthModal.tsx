import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  // Initialize Google Sign-In
  useEffect(() => {
    if (!isOpen || !onGoogleLogin) return;

    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            width: 400,
            text: mode === "login" ? "signin_with" : "signup_with",
          },
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, mode, onGoogleLogin, handleGoogleResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, name || undefined);
      }
      onClose();
      // Reset form
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full border border-theme/10"
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-muted mb-6">
              {mode === "login"
                ? "Sign in to save and manage your diagrams"
                : "Create an account to start saving your work"}
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            )}

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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-theme/5 border border-theme/20 rounded-lg text-theme placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  placeholder="••••••••"
                />
                {mode === "signup" && (
                  <p className="mt-1 text-xs text-muted">
                    Minimum 6 characters
                  </p>
                )}
              </div>

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

            {/* Switch mode */}
            <div className="mt-6 text-center">
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
            </div>

            {/* Optional note */}
            <div className="mt-6 p-3 bg-theme/5 rounded-lg">
              <p className="text-xs text-muted text-center">
                🔒 Your diagrams are securely stored and only accessible to you
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
