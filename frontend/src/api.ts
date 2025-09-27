// src/hooks/useQuestions.ts
import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

export type QA = { sentence: string; answer: string; options: string[] };
export type Questions = { beginner: QA[]; intermediate: QA[]; advanced: QA[] };

export function useQuestions(level?: 'beginner' | 'intermediate' | 'advanced') {
  const [data, setData] = useState<Questions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = level
      ? `${API_BASE}/api/questions?level=${level}`
      : `${API_BASE}/api/questions`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch questions');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [level]);

  return { data, loading, error };
}
