"use client";

import { useCallback, useState } from "react";

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchReports = useCallback(async (type = "all") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load reports");
      setData(json);
      return json;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, fetchReports };
}
