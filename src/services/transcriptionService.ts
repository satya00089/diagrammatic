const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:8000";

export interface TranscriptionJob {
  job_id: string;
  status: "processing" | "done" | "error";
  text?: string;
  detail?: string;
}

async function errorDetail(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => undefined);
  return (body && typeof body.detail === "string" && body.detail) || fallback;
}

export async function submitTranscription(
  audio: Blob,
  filename: string,
): Promise<TranscriptionJob> {
  const formData = new FormData();
  formData.append("audio", audio, filename);

  const res = await fetch(`${API_BASE}/api/v1/transcriptions`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res, "Failed to submit recording."));
  }
  return res.json() as Promise<TranscriptionJob>;
}

export async function getTranscriptionJob(
  jobId: string,
): Promise<TranscriptionJob> {
  const res = await fetch(
    `${API_BASE}/api/v1/transcriptions/${encodeURIComponent(jobId)}`,
  );
  if (!res.ok) {
    throw new Error(
      await errorDetail(res, "Failed to check transcription status."),
    );
  }
  return res.json() as Promise<TranscriptionJob>;
}
