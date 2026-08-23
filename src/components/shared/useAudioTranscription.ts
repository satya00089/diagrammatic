import { useEffect, useRef, useState } from "react";
import {
  submitTranscription,
  getTranscriptionJob,
} from "../../services/transcriptionService";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class TranscriptionJobFailedError extends Error {}

export interface UseAudioTranscriptionOptions {
  onTranscript: (text: string) => void;
}

export const useAudioTranscription = ({
  onTranscript,
}: UseAudioTranscriptionOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const skipTranscriptionRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const clearAudioResources = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    setMicAnalyser(null);
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => undefined);
    }
    audioContextRef.current = null;
  };

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      analyserRef.current?.disconnect();
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  const transcribeBlob = async (audioBlob: Blob) => {
    if (!audioBlob.size) {
      throw new Error("Recorded audio was empty.");
    }

    const filename = `voice-${Date.now()}.webm`;
    const job = await submitTranscription(audioBlob, filename);

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const jobStatus = await getTranscriptionJob(job.job_id);

      if (jobStatus.status === "done") {
        onTranscript(jobStatus.text ?? "");
        return;
      }

      if (jobStatus.status === "error") {
        throw new TranscriptionJobFailedError(
          jobStatus.detail ||
            "We couldn't transcribe that recording. Please try again.",
        );
      }

      await sleep(POLL_INTERVAL_MS);
    }

    throw new TranscriptionJobFailedError(
      "Transcription is taking longer than expected. Please try again.",
    );
  };

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message.trim()) return err.message;
    return "We couldn't transcribe that recording. Please try again.";
  };

  const startRecording = async () => {
    if (isRecording || isTranscribing) return;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Build the analyser graph here, still within the click handler's async
      // chain, so the AudioContext starts "running" rather than "suspended".
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      if (audioContext.state === "suspended") {
        await audioContext.resume().catch(() => undefined);
      }
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setMicAnalyser(analyser);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Audio recording failed.");
        setIsRecording(false);
        clearAudioResources();
      };

      recorder.onstop = async () => {
        setIsRecording(false);

        if (skipTranscriptionRef.current) {
          skipTranscriptionRef.current = false;
          clearAudioResources();
          return;
        }

        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        try {
          await transcribeBlob(audioBlob);
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setIsTranscribing(false);
          clearAudioResources();
        }
      };

      recorder.start();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start recording.";
      setError(message);
      clearAudioResources();
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    skipTranscriptionRef.current = true;
    mediaRecorderRef.current?.stop();
  };

  return {
    isRecording,
    isTranscribing,
    error,
    micAnalyser,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
