"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UploadedFile = {
  id?: string | number;
  url?: string;
  name: string;
  size: number;
  type?: string;
  previewUrl?: string;
};

type LocalFile = {
  key: string;
  file?: File;
  name: string;
  size: number;
  type?: string;
  previewUrl?: string;
  progress: number;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
  server?: UploadedFile;
};

export interface FileUploadProps {
  uploadEndpoint: string;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  isFinish?:boolean;
  setIsFinish?:()=>void
}

async function uploadWithProgress(
  endpoint: string,
  file: File,
  onProgress: (p: number) => void
): Promise<UploadedFile[]> {
  const fd = new FormData();
  fd.append("files", file);

  const res: UploadedFile[] = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const p = Math.round((evt.loaded / evt.total) * 100);
        onProgress(p);
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText);
            resolve(Array.isArray(json) ? json : json?.items ?? []);
          } else {
            reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
          }
        } catch (e) {
          reject(e);
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
  return res;
}

export default function FileUpload({
  uploadEndpoint,
  value = [],
  onChange,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  maxFiles = 10,
  maxSizeMB = 20,
  multiple = true,
  label = "파일 업로드",
  isFinish,
  setIsFinish,
}: FileUploadProps) {
  
  const [items, setItems] = useState<LocalFile[]>(
    (value || []).map((v, i) => ({
      key: `server-${i}`,
      name: v.name,
      size: v.size,
      type: v.type,
      previewUrl: v.url,
      progress: 100,
      status: "done",
      server: v,
    }))
  );

  const dragRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // ✅ 숨긴 input 참조

  const emit = useCallback(
    (list: LocalFile[]) => {
      const done = list
        .filter((it) => it.status === "done" && it.server)
        .map((it) => it.server!) as UploadedFile[];
      onChange?.(done);
    },
    [onChange]
  );

  const remainCount = useMemo(
    () => Math.max(0, maxFiles - items.length),
    [maxFiles, items.length]
  );

  const addLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!files || files.length === 0) return;
      const arr = Array.from(files);
      if (arr.length > remainCount) {
        alert(`최대 ${maxFiles}개까지 업로드할 수 있습니다. (남은 수: ${remainCount}개)`);
      }
      const take = arr.slice(0, remainCount);

      const next: LocalFile[] = [];
      for (const f of take) {
        if (f.size > maxSizeMB * 1024 * 1024) {
          next.push({
            key: crypto.randomUUID(),
            file: f,
            name: f.name,
            size: f.size,
            type: f.type,
            progress: 0,
            status: "error",
            errorMsg: `파일이 너무 큽니다. 최대 ${maxSizeMB}MB`,
          });
          continue;
        }
        const isImage = f.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(f) : undefined;

        next.push({
          key: crypto.randomUUID(),
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          previewUrl,
          progress: 0,
          status: "idle",
        });
      }

      setItems((prev) => [...prev, ...next]);

      for (const it of next) {
        if (!it.file || it.status === "error") continue;
        setItems((prev) =>
          prev.map((p) => (p.key === it.key ? { ...p, status: "uploading", progress: 1 } : p))
        );
        try {
          const result = await uploadWithProgress(uploadEndpoint, it.file, (p) => {
            setItems((prev) => prev.map((p2) => (p2.key === it.key ? { ...p2, progress: p } : p2)));
          });
          const first = result?.[0];
          setItems((prev) =>
            prev.map((p2) =>
              p2.key === it.key
                ? {
                    ...p2,
                    status: "done",
                    progress: 100,
                    server:
                      first ??
                      ({
                        name: it.name,
                        size: it.size,
                        type: it.type,
                        url: it.previewUrl,
                      } as UploadedFile),
                  }
                : p2
            )
          );
        } catch (e: any) {
          setItems((prev) =>
            prev.map((p2) =>
              p2.key === it.key
                ? { ...p2, status: "error", errorMsg: e?.message ?? "업로드 실패" }
                : p2
            )
          );
        } finally {
          setItems((prev) => {
            const cloned = [...prev];
            emit(cloned);
            return cloned;
          });
        }
      }
    },
    [emit, maxFiles, maxSizeMB, remainCount, uploadEndpoint]
  );

  const handleInput = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (e.target.files) addLocalFiles(e.target.files);
      e.currentTarget.value = ""; // 같은 파일 재선택 허용
    },
    [addLocalFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current?.classList.remove("ring-2", "ring-blue-400");
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length) {
        addLocalFiles(dt.files);
      }
    },
    [addLocalFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.add("ring-2", "ring-blue-400");
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current?.classList.remove("ring-2", "ring-blue-400");
  }, []);

  const removeItem = useCallback(
    (key: string) => {
      setItems((prev) => {
        const next = prev.filter((p) => p.key !== key);
        const done = next
          .filter((n) => n.status === "done" && n.server)
          .map((n) => n.server!) as UploadedFile[];
        onChange?.(done);
        return next;
      });
    },
    [onChange]
  );

  const prettySize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ✅ 드롭존 클릭/키보드로 파일선택 열기
  const openFileDialog = () => fileInputRef.current?.click();
  const onKeyDownDropzone = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  };
 
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>

      {/* 드롭존 */}
      <div
        ref={dragRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={openFileDialog}                // ✅ 클릭으로 열기
        onKeyDown={onKeyDownDropzone}           // ✅ Enter/Space 접근성
        role="button"                            // 접근성
        tabIndex={0}                             // 포커스 가능
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center cursor-pointer select-none"
        aria-label="파일 업로드 드롭존"
      >
        <p className="text-sm text-neutral-700">클릭하거나 파일을 끌어다 놓으세요.</p>
        <p className="text-xs text-neutral-500">
          허용: {accept.replaceAll(",", ", ")} / 파일당 최대 {maxSizeMB}MB / 최대 {maxFiles}개
        </p>

        {/* 숨긴 input */}
        <input
          ref={fileInputRef}                     // ✅ ref 연결
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInput}
          className="hidden"
        />
      </div>

      {/* 파일 리스트 */}
      {items.length > 0 && (
        <div className="mt-3 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between border-b p-3 text-sm">
            <div className="font-medium">업로드 파일</div>
            <div className="text-neutral-500">{items.length}개</div>
          </div>

          <ul className="max-h-72 overflow-auto divide-y">
            {items.map((it) => (
              <li key={it.key} className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-lg border bg-white">
                  {it.previewUrl && (it.type?.startsWith("image/") ?? false) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.previewUrl} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-neutral-500">FILE</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-neutral-500">({prettySize(it.size)})</div>
                  </div>

                  {it.status === "uploading" && (
                    <div className="mt-1 h-2 w-full overflow-hidden rounded bg-neutral-200">
                      <div
                        className="h-2 rounded bg-blue-500 transition-all"
                        style={{ width: `${it.progress}%` }}
                      />
                    </div>
                  )}

                  {it.status === "error" && (
                    <div className="mt-1 text-xs text-rose-600">
                      {it.errorMsg ?? "업로드 실패"}
                    </div>
                  )}

                  {it.status === "done" && it.server?.url && (
                    <a
                      href={it.server.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-blue-600 underline"
                    >
                      파일 열기
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      it.status === "done"
                        ? "text-emerald-600"
                        : it.status === "error"
                        ? "text-rose-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {it.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(it.key)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
                    aria-label={`${it.name} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
