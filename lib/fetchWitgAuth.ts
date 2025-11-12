// lib/fetchWithAuth.ts
import { getSession } from "next-auth/react";

type AnyBody =
  | undefined
  | null
  | string
  | FormData
  | Blob
  | ArrayBufferView
  | ArrayBuffer
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | Record<string, any>;

function isPlainObject(v: unknown): v is Record<string, any> {
  return v !== null && typeof v === "object" && v.constructor === Object;
}

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = await getSession();
  const token = (session as any)?.accessToken;

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method || "GET").toUpperCase();
  let body = init.body as AnyBody;

  // 1) GET/HEAD인데 Content-Type만 덜렁 붙는 문제 방지
  if ((method === "GET" || method === "HEAD")) {
    // GET/HEAD에선 body 사용하지 않음
    body = undefined;
    // Content-Type도 굳이 설정하지 않음
    headers.delete("Content-Type");
  } else {
    // 2) FormData면 Content-Type 자동으로 브라우저가 설정 => 수동설정 절대 금지
    if (body instanceof FormData) {
      headers.delete("Content-Type");
    }
    // 3) 문자열/Blob/Buffer/URLSearchParams 등은 있는 그대로 전송
    else if (
      typeof body === "string" ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body as any) ||
      body instanceof URLSearchParams ||
      (typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
    ) {
      // Content-Type은 호출자가 이미 정했으면 유지, 아니면 굳이 강제 X
      if (!headers.has("Content-Type")) {
        // 아무 것도 안 함 (서버가 유연하게 처리)
      }
    }
    // 4) 평범한 객체면 JSON 직렬화 + Content-Type 지정
    else if (isPlainObject(body)) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(body);
    }
    // 5) body가 undefined/null이면 Content-Type 필요 없음
    else if (body == null) {
      headers.delete("Content-Type");
    }
  }

  return fetch(input, {
    ...init,
    body: body as BodyInit | undefined,
    headers,
    credentials: "include",
  });
}
