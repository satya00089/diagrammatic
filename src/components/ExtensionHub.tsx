import React, { useMemo, useState } from "react";
import { MdAccountTree, MdClose, MdCode, MdStorage, MdUpload } from "react-icons/md";
import type { ExtensionImportResult } from "../types/extensions";
import { parseExtensionSource } from "../utils/extensionImport";

type ExtensionHubProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: ExtensionImportResult, sourceName: string) => void;
};

const examples = {
  mermaid: `flowchart LR\n  client[Web Client] --> api[API Gateway]\n  api --> service[Order Service]\n  service --> db[(Orders DB)]`,
  "database-schema": `CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) NOT NULL\n);\n\nCREATE TABLE orders (\n  id UUID PRIMARY KEY,\n  user_id UUID NOT NULL REFERENCES users(id),\n  created_at TIMESTAMP NOT NULL\n);`,
};

const ExtensionHub: React.FC<ExtensionHubProps> = ({ isOpen, onClose, onImport }) => {
  const [kind, setKind] = useState<"mermaid" | "database-schema">("mermaid");
  const [source, setSource] = useState(examples.mermaid);
  const [sourceName, setSourceName] = useState("Pasted source");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      setError(null);
      return parseExtensionSource(kind, source);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Unable to parse this source.");
      return null;
    }
  }, [kind, source]);

  if (!isOpen) return null;

  const selectKind = (nextKind: "mermaid" | "database-schema") => {
    setKind(nextKind);
    setSource(examples[nextKind]);
    setSourceName(nextKind === "mermaid" ? "Pasted Mermaid" : "Pasted schema");
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSource(await file.text());
    setSourceName(file.name);
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" role="presentation">
      <section className="flex max-h-[min(760px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-theme/10 bg-surface shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="extension-hub-title">
        <header className="flex items-start justify-between border-b border-theme/10 px-6 py-5">
          <div>
            <h2 id="extension-hub-title" className="text-xl font-bold text-theme">Bring an architecture to life</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">Import a source format, review what Diagrammatic recognized, then add an editable architecture to your canvas.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted transition-colors hover:bg-[var(--bg-hover)] hover:text-theme" aria-label="Close extensions">
            <MdClose className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Architecture extensions" className="space-y-2">
            <button type="button" onClick={() => selectKind("mermaid")} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${kind === "mermaid" ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]" : "border-theme/10 hover:bg-[var(--bg-hover)]"}`}>
              <MdAccountTree className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
              <span><span className="block text-sm font-semibold text-theme">Mermaid</span><span className="mt-1 block text-xs text-muted">Flowcharts and service maps</span></span>
            </button>
            <button type="button" onClick={() => selectKind("database-schema")} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${kind === "database-schema" ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]" : "border-theme/10 hover:bg-[var(--bg-hover)]"}`}>
              <MdStorage className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
              <span><span className="block text-sm font-semibold text-theme">Database schema</span><span className="mt-1 block text-xs text-muted">SQL tables and relationships</span></span>
            </button>
            <div className="mt-5 rounded-xl border border-dashed border-theme/15 p-3 text-xs text-muted"><MdCode className="mb-2 h-5 w-5" />More source adapters will plug into this same review flow.</div>
          </nav>

          <div className="grid min-h-0 gap-4 lg:grid-cols-2">
            <div className="flex min-h-[320px] flex-col">
              <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="extension-source" className="text-sm font-semibold text-theme">Source</label><label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--brand)]"><MdUpload className="h-4 w-4" />Upload file<input type="file" accept={kind === "mermaid" ? ".mmd,.mermaid,.txt" : ".sql,.txt"} onChange={handleFile} className="hidden" /></label></div>
              <textarea id="extension-source" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} className="min-h-0 flex-1 resize-none rounded-xl border border-theme/15 bg-[var(--bg)] p-4 font-mono text-xs leading-5 text-theme outline-none transition-colors focus:border-[var(--brand)]" aria-describedby="extension-source-help" />
              <p id="extension-source-help" className="mt-2 text-xs text-muted">{sourceName} · Your current canvas will not change until you confirm the import.</p>
            </div>

            <div className="flex min-h-[320px] flex-col rounded-xl border border-theme/10 bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-theme">Import report</h3>{parsed && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">Ready to import</span>}</div>
              {error ? <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300" role="alert">{error}</div> : parsed ? <><p className="mt-4 text-lg font-semibold text-theme">{parsed.summary}</p>{typeof parsed.catalogMatches === "number" && <p className="mt-2 text-sm text-muted">{parsed.catalogMatches} component{parsed.catalogMatches === 1 ? "" : "s"} matched from the Diagrammatic catalog; {parsed.fallbackNodes ?? 0} kept as generic editable node{parsed.fallbackNodes === 1 ? "" : "s"}.</p>}<p className="mt-2 text-sm text-muted">Imported elements retain source metadata so future linting can explain where they came from.</p>{parsed.warnings.length > 0 && <div className="mt-4 space-y-2" role="status">{parsed.warnings.map((warning) => <p key={warning} className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">{warning}</p>)}</div>}</> : <p className="mt-4 text-sm text-muted">Add source to see a recognition report.</p>}
              <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-[var(--bg-hover)] hover:text-theme">Cancel</button><button type="button" disabled={!parsed} onClick={() => parsed && onImport(parsed, sourceName)} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Replace canvas with import</button></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExtensionHub;
