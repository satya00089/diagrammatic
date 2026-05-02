import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { MdClose } from "react-icons/md";

const roles = ["Student", "Engineer", "Senior Engineer", "Tech Lead", "Architect", "Manager", "Teacher", "Professor", "Other"];
const experienceLevels = ["Beginner", "Intermediate", "Advanced"];
const clouds = ["AWS", "GCP", "Azure", "Other"];
const contentTypes = ["Articles", "Videos", "Interactive", "Projects"];

export const QuickSetupModal: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [role, setRole] = useState<string>("Student");
  const [experience, setExperience] = useState<string>("Beginner");
  const [primaryInterest, setPrimaryInterest] = useState<string>("");
  const [preferredCloud, setPreferredCloud] = useState<string>("AWS");
  const [preferredContent, setPreferredContent] = useState<string>("Articles");

  const prefillFromPreferences = (prefs?: Record<string, unknown> | null) => {
    if (!prefs) return;

    const toStringSafe = (val: unknown): string | undefined => {
      if (val == null) return undefined;
      if (typeof val === "string") return val;
      if (typeof val === "number" || typeof val === "boolean") return String(val);
      if (Array.isArray(val)) return val.map((v) => String(v)).join(", ");
      if (typeof val === "object") {
        const anyVal = val as Record<string, unknown>;
        if (typeof anyVal.value === "string") return anyVal.value;
        if (typeof anyVal.label === "string") return anyVal.label;
        if (typeof anyVal.id === "string") return anyVal.id;
        try {
          return JSON.stringify(anyVal);
        } catch {
          return String(anyVal);
        }
      }
      return String(val);
    };

    const r = toStringSafe(prefs.role);
    if (r) setRole(r);

    const ex = toStringSafe(prefs.experience_level);
    if (ex) setExperience(ex);

    const pi = prefs.primary_interest;
    if (Array.isArray(pi)) {
      setPrimaryInterest(pi.map((v) => String(v)).join(", "));
    } else {
      const parsed = toStringSafe(pi);
      if (parsed) setPrimaryInterest(parsed);
    }

    const pc = toStringSafe(prefs.preferred_cloud);
    if (pc) setPreferredCloud(pc);

    const pct = toStringSafe(prefs.preferred_content_type);
    if (pct) setPreferredContent(pct);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.preferences) {
      prefillFromPreferences(user.preferences);
    } else {
      setVisible(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handler = () => {
      if (!isAuthenticated || !user) return;
      prefillFromPreferences(user.preferences);
      setVisible(true);
    };

    globalThis.addEventListener("open-quick-setup", handler as EventListener);
    return () => globalThis.removeEventListener("open-quick-setup", handler as EventListener);
  }, [isAuthenticated, user]);

  // Close modal on Escape for keyboard users
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    if (visible) globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  const isEditing = Boolean(user?.preferences);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      const prefs = {
        role,
        experience_level: experience,
        primary_interest: primaryInterest,
        preferred_cloud: preferredCloud,
        preferred_content_type: preferredContent,
      } as Record<string, unknown>;

      await apiService.updatePreferences(prefs);
      await refreshUser();
      setVisible(false);
    } catch (err) {
      console.error("Failed to save preferences", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await apiService.updatePreferences({});
      await refreshUser();
      setVisible(false);
    } catch (err) {
      console.error("Failed to skip onboarding", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close quick setup"
        className="absolute inset-0 bg-black/50 focus:outline-none"
        onClick={() => setVisible(false)}
      />

      <div className="relative w-full max-w-3xl bg-[var(--surface)] border border-theme rounded-2xl shadow-2xl overflow-hidden">
        <button
          aria-label="Close quick setup"
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-muted hover:text-theme p-2 rounded"
        >
          <MdClose className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="flex flex-col items-center text-center md:items-start md:text-left md:col-span-1">
            <h3 className="text-lg font-semibold text-theme">
              {isEditing ? "Edit your preferences" : "Quick setup"}
            </h3>
            <p className="text-sm text-muted mt-2 max-w-xs">
              Tell us a bit about you so we can surface the most relevant content and problems.
            </p>
            {isEditing && (
              <p className="text-xs text-muted mt-3">Your choices are private and used to personalize recommendations.</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-sm font-medium text-theme">Role</div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full border border-theme/40 rounded p-2 bg-[transparent]"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="text-sm font-medium text-theme">Experience</div>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-1 block w-full border border-theme/40 rounded p-2 bg-[transparent]"
                >
                  {experienceLevels.map((lev) => (
                    <option key={lev} value={lev}>{lev}</option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <div className="text-sm font-medium text-theme">Primary interest</div>
                <input
                  value={primaryInterest}
                  onChange={(e) => setPrimaryInterest(e.target.value)}
                  placeholder="e.g., distributed systems, ML"
                  className="mt-1 block w-full border border-theme/40 rounded p-2 bg-[transparent]"
                />
                <div className="text-xs text-muted mt-1">This helps prioritize problem recommendations and learning materials.</div>
              </label>

              <label className="block">
                <div className="text-sm font-medium text-theme">Preferred cloud</div>
                <select
                  value={preferredCloud}
                  onChange={(e) => setPreferredCloud(e.target.value)}
                  className="mt-1 block w-full border border-theme/40 rounded p-2 bg-[transparent]"
                >
                  {clouds.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="text-sm font-medium text-theme">Preferred content</div>
                <select
                  value={preferredContent}
                  onChange={(e) => setPreferredContent(e.target.value)}
                  className="mt-1 block w-full border border-theme/40 rounded p-2 bg-[transparent]"
                >
                  {contentTypes.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSkip}
                disabled={submitting}
                className="px-4 py-2 rounded border text-sm text-muted hover:text-theme cursor-pointer"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-[var(--brand)] text-white text-sm shadow-sm cursor-pointer"
              >
                {submitting ? "Saving..." : isEditing ? "Save changes" : "Get started"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickSetupModal;
