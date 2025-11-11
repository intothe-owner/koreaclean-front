// hooks/notice.ts
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

/* ================== 타입/상수 ================== */
export type PriorityCode = "EMERGENCY" | "IMPORTANT" | "NORMAL";

export type AttachmentMeta = {
  id?: string | number;
  name: string;
  url?: string;
  size?: number;
  // 서버 상대경로 등을 쓰려면 path/mime 등 추가 가능
};

export type NoticeItem = {
  id: number;
  title: string;
  priority: PriorityCode;
  is_pinned: boolean;
  views: number;
  createdAt: string;
  updatedAt?: string;
};

export type NoticeDetail = {
  id?: number;
  title: string;
  content: string; // HTML 또는 텍스트
  priority: PriorityCode;
  is_pinned?: boolean;
  attachments?: AttachmentMeta[];
  createdAt?: string;
  updatedAt?: string;
};

export type DetailResponse = { is_success: boolean; item?: NoticeDetail };
export type SaveResponse = { is_success: boolean; id?: number; message?: string };
export type DeleteResponse = { is_success: boolean; message?: string };

export type ListResponse = {
  is_success: boolean;
  items: NoticeItem[];
  total: number;
  page: number;
  page_size: number;
};

export const PRIORITY_OPTIONS: { label: string; value: PriorityCode }[] = [
  { label: "긴급", value: "EMERGENCY" },
  { label: "중요", value: "IMPORTANT" },
  { label: "일반", value: "NORMAL" },
];

export const queryKeys = {
  detail: (id?: string | number) => ["notice-detail", id] as const,
  list: (params: Record<string, any>) => ["notice-list", params] as const,
};

const required = (v?: string) => (v ?? "").trim().length > 0;

/* ================== API 함수 ================== */
export async function fetchNoticeDetail(id: string | number): Promise<DetailResponse> {
  const res = await fetchWithAuth(`/backend/notice/detail?id=${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("상세를 불러오지 못했습니다.");
  return res.json();
}

export async function fetchNoticeList(params: {
  q?: string;
  priority?: PriorityCode;
  page?: number;
  page_size?: number;
  order_by?: "createdAt" | "title" | "views" | "priority" | "is_pinned";
  order_dir?: "ASC" | "DESC";
}): Promise<ListResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.priority) sp.set("priority", params.priority);
  sp.set("page", String(params.page ?? 1));
  sp.set("page_size", String(params.page_size ?? 10));
  sp.set("order_by", params.order_by ?? "createdAt");
  sp.set("order_dir", params.order_dir ?? "DESC");

  const res = await fetchWithAuth(`/backend/notice/list?${sp.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
  return res.json();
}

export async function saveNotice(payload: {
  form: NoticeDetail;
  files: File[];
}): Promise<SaveResponse> {
  const { form, files } = payload;
  const fd = new FormData();
  if (form.id) fd.append("id", String(form.id));
  fd.append("title", form.title);
  fd.append("content", form.content);
  fd.append("priority", form.priority);
  fd.append("is_pinned", form.is_pinned ? "Y" : "N");
  if (form.attachments?.length) {
    fd.append("attachments_meta", JSON.stringify(form.attachments));
  }
  files.forEach((f) => fd.append("files", f));

  const res = await fetchWithAuth(`/backend/notice/save`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error("저장에 실패했습니다.");
  return res.json();
}

export async function deleteNotice(id: string | number): Promise<DeleteResponse> {
  const res = await fetchWithAuth(`/backend/notice/delete?id=${id}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
  return res.json();
}

/* ================== React Query 훅 ================== */
export function useNoticeDetailQuery(
  id?: string | number
): UseQueryResult<DetailResponse, Error> {
  return useQuery({
    queryKey: queryKeys.detail(id),
    enabled: !!id,
    queryFn: () => fetchNoticeDetail(id!),
  });
}

export function useNoticeListQuery(params: {
  q?: string;
  priority?: PriorityCode;
  page?: number;
  page_size?: number;
  order_by?: "createdAt" | "title" | "views" | "priority" | "is_pinned";
  order_dir?: "ASC" | "DESC";
}): UseQueryResult<ListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => fetchNoticeList(params),
  });
}

export function useSaveNoticeMutation(
  onSuccess?: (r: SaveResponse) => void,
  onError?: (e: Error) => void
): UseMutationResult<SaveResponse, Error, { form: NoticeDetail; files: File[] }> {
  return useMutation({
    mutationFn: saveNotice,
    onSuccess,
    onError: (e) => onError?.(e as Error),
  });
}

export function useDeleteNoticeMutation(
  onSuccess?: (r: DeleteResponse) => void,
  onError?: (e: Error) => void
): UseMutationResult<DeleteResponse, Error, { id: string | number }> {
  return useMutation({
    mutationFn: ({ id }) => deleteNotice(id),
    onSuccess,
    onError: (e) => onError?.(e as Error),
  });
}

/* ================== 폼 전용 훅 ================== */
const initialForm: NoticeDetail = {
  title: "",
  content: "",
  priority: "NORMAL",
  is_pinned: false,
  attachments: [],
};

export function useNoticeForm(id?: string | null) {
  const router = useRouter();
  const numericId = useMemo(() => (id ? Number(id) : undefined), [id]);

  // 상세 조회 (수정 모드)
  const {
    data: detailRes,
    isFetching: isDetailLoading,
    isError: isDetailError,
    error: detailError,
  } = useNoticeDetailQuery(numericId);

  // 폼 상태
  const [form, setForm] = useState<NoticeDetail>(initialForm);
  const [files, setFiles] = useState<File[]>([]);

  // 상세 응답 반영
  useEffect(() => {
    if (detailRes?.is_success && detailRes.item) {
      const f = detailRes.item;
      setForm({
        id: f.id,
        title: f.title ?? "",
        content: f.content ?? "",
        priority: (f.priority as PriorityCode) || "NORMAL",
        is_pinned: !!f.is_pinned,
        attachments: f.attachments ?? [],
      });
    } else if (!numericId) {
      setForm(initialForm);
    }
  }, [detailRes?.is_success, detailRes?.item, numericId]);

  // 저장
  const saveMutation = useSaveNoticeMutation(
    (r) => {
      if (r?.is_success) {
        alert("저장되었습니다.");
        router.push("/admin/site/notice/list");
      } else {
        alert(r?.message || "저장 실패");
      }
    },
    (e) => alert(e.message)
  );

  // 핸들러 모음
  const set = <K extends keyof NoticeDetail>(patch: Pick<NoticeDetail, K>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = () => {
    if (!required(form.title)) return alert("제목을 입력해 주세요.");
    if (!required(form.content) && !confirm("본문이 비어 있습니다. 그대로 저장할까요?")) return;
    saveMutation.mutate({ form, files });
  };

  const onCancel = () => confirm("작성 내용을 취소할까요?") && router.back();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const list = e.currentTarget.files;

    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    e.currentTarget.value = "";
  };

  const removeLocalFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const removeExistingAttachment = (idx: number) =>
    setForm((prev) => {
      const arr = [...(prev.attachments || [])];
      arr.splice(idx, 1);
      return { ...prev, attachments: arr };
    });

  return {
    // 상태
    isEdit: !!numericId,
    isDetailLoading,
    isDetailError,
    detailError,
    isSaving: saveMutation.isPending,

    // 폼
    form,
    set,
    files,
    setFiles,

    // 액션
    onSubmit,
    onCancel,
    onFileChange,
    removeLocalFile,
    removeExistingAttachment,

    // 선택지
    priorityOptions: PRIORITY_OPTIONS,
  };
}
