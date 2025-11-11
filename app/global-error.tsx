// app/global-error.tsx
'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; cause?: unknown };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      const extras: Record<string, unknown> = {};
      // error 객체의 모든 own property를 긁어봄
      Object.getOwnPropertyNames(error).forEach((k) => {
        (extras as any)[k] = (error as any)[k];
      });
      // stack, cause, message, name 등 전부 로깅
      console.error('[Global RSC Error] extras:', extras);
      console.error('[Global RSC Error] cause:', (error as any)?.cause);
      console.error('[Global RSC Error] stack:', error.stack);
    } catch {}
  }, [error]);

  return (
    <html>
      <body>
        <h2>문제가 발생했습니다.</h2>
        <button onClick={() => reset()}>다시 시도</button>
      </body>
    </html>
  );
}
