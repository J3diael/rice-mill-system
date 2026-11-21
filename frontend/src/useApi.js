import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "./api.js";

/** Loads data from a GET endpoint and gives back { data, error, loading, reload }. */
export function useApi(path, initial = null) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await api.get(path);
      setData(res.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
