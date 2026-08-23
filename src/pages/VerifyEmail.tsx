import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiService } from "../services/api";
import Seo from "../components/SEO";

const STATUS_HEADING = {
  loading: "Activating account",
  success: "Account activated",
  error: "Activation link unavailable",
} as const;

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Activating your account…");

  useEffect(() => {
    const userId = params.get("uid");
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (!userId || !token) {
      setStatus("error");
      setMessage("This activation link is incomplete.");
      return;
    }
    apiService
      .verifyEmail(userId, token)
      .then((response) => {
        setStatus("success");
        setMessage(response.message);
      })
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to activate your account.",
        );
      });
  }, [params]);

  return (
    <>
      <Seo
        title="Verify Email | Diagrammatic"
        description="Activate your Diagrammatic account."
        url="https://diagrammatic.next-zen.dev/verify-email"
        noIndex
      />
      <main className="min-h-screen bg-theme flex items-center justify-center p-6">
        <section className="w-full max-w-md rounded-2xl border border-theme/10 bg-surface p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-theme">
            {STATUS_HEADING[status]}
          </h1>
          <p className="mt-4 text-muted">{message}</p>
          {status !== "loading" && (
            <Link
              className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white"
              to="/"
            >
              Go to Diagrammatic
            </Link>
          )}
        </section>
      </main>
    </>
  );
};

export default VerifyEmail;
