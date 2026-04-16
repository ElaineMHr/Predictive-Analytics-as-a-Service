import { useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

/**
 * Polls GET /jobs/{jobId}/status every 2s until the job reaches
 * "complete" or "error". Only active when jobId is non-null.
 *
 * onComplete and onError should be stable references (useCallback)
 * to avoid restarting the polling interval unnecessarily.
 */
export function useJobPolling(
  jobId: string | null,
  onComplete: () => void,
  onError: () => void,
) {
  useEffect(() => {
    if (!jobId) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/${jobId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "complete") {
          clearInterval(id);
          onComplete();
        } else if (data.status === "error") {
          clearInterval(id);
          onError();
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 2000);

    return () => clearInterval(id);
  }, [jobId, onComplete, onError]);
}
