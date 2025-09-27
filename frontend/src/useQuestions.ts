import { useEffect, useState } from 'react';

export type QA = { sentence: string; answer: string; options: string[] };
export type Questions = { beginner: QA[]; intermediate: QA[]; advanced: QA[] };

export function useQuestions(level?: 'beginner' | 'intermediate' | 'advanced') {
  const [data, setData] = useState<Questions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = level
      ? `http://localhost:4000/api/questions?level=${level}`
      : `http://localhost:4000/api/questions`;

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
