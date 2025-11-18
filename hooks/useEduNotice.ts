// src/hooks/useEduNotice.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

import { baseUrl } from "@/lib/variable";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import type { UploadedFile } from "@/components/ui/FileUpload";

/** 목록 파라미터 타입 */
export type EduNoticeListParams = {
  q?: string;
  page: number;
  page_size: number;
  order_by?: "createdAt" | "title" | "edu_start_date";
  order_dir?: "ASC" | "DESC";
};

/** 목록 응답 타입 */
export type EduNoticeListResponse = {
  total: number;
  items: any[]; // 필요하면 정확한 타입으로 교체
};

/** 교육 공지 목록 조회 */
export function useEduNoticeListQuery(params: EduNoticeListParams) {
  return useQuery<EduNoticeListResponse>({
    queryKey: ["eduNoticeList", params],
    queryFn: async () => {
      const usp = new URLSearchParams();
      if (params.q) usp.set("q", params.q);
      usp.set("page", String(params.page));
      usp.set("page_size", String(params.page_size));
      if (params.order_by) usp.set("order_by", params.order_by);
      if (params.order_dir) usp.set("order_dir", params.order_dir);

      const res = await fetchWithAuth(
        `${baseUrl}/edu/admin/edu-notice?` + usp.toString(),
        { method: "GET" }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "교육 공지 목록 조회에 실패했습니다.");
      }
      return res.json();
    },
  });
}

/** 교육 공지 삭제 */
export function useDeleteEduNoticeMutation(
  onSuccess?: (result: any) => void,        // ✅ 결과를 받도록 수정
  onError?: (err: Error) => void
) {
  return useMutation({
    mutationFn: async ({ id }: { id: number | string }) => {   // ✅ string도 허용
      const res = await fetchWithAuth(`${baseUrl}/edu/admin/edu-notice/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "교육 공지 삭제에 실패했습니다.");
      }
      return res.json(); // onSuccess 로 넘어감
    },
    onSuccess: (data) => {
      onSuccess?.(data); // ✅ 결과 전달
    },
    onError: (err: any) => {
      onError?.(err as Error);
    },
  });
}

/** DB EduNotice 모델에 대응하는 타입 (프론트용) */
export type EduNoticeDto = {
  id?: number;
  title: string;
  content: string;
  edu_start_date: string;      // YYYY-MM-DD
  edu_end_date: string;        // YYYY-MM-DD
  class_start_time: string;    // HH:MM
  class_end_time: string;      // HH:MM
  attachments?: Array<{
    id?: number | string;
    name?: string;
    url?: string;
    size?: number;
    [key: string]: any;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

/** 폼 기본값 */
const DEFAULT_FORM: EduNoticeDto = {
  title: "",
  content: "",
  edu_start_date: "",
  edu_end_date: "",
  class_start_time: "",
  class_end_time: "",
  attachments: [],
};

// 날짜(YYYY-MM-DD...) → YYYY-MM-DD
const toDateOnly = (v?: string | null): string => {
  if (!v) return "";
  return v.slice(0, 10);
};

// 시간(HH:MM:SS...) → HH:MM
const toTimeHM = (v?: string | null): string => {
  if (!v) return "";
  return v.slice(0, 5);
};

export function useEduNoticeForm(id: string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState<EduNoticeDto>(DEFAULT_FORM);

  // 새로 업로드할 파일들
  const [files, setFiles] = useState<UploadedFile[]>([]);

  /** 상세 조회 (수정 모드일 때만) */
  const {
    data: detail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
  } = useQuery<EduNoticeDto>({
    // ✅ 상세 조회용 쿼리 키를 Detail 훅과 구분
    queryKey: ["eduNoticeDetailForm", id],
    enabled: isEdit && !!id,
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl}/edu/admin/edu-notice/${id}`, {
        method: "GET",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "교육 공지 상세 조회에 실패했습니다.");
      }
      const json = await res.json();

      // 응답을 폼에 맞게 변환
      const data: EduNoticeDto = {
        id: json.id,
        title: json.title ?? "",
        content: json.content ?? "",
        edu_start_date: toDateOnly(json.edu_start_date),
        edu_end_date: toDateOnly(json.edu_end_date),
        class_start_time: toTimeHM(json.class_start_time),
        class_end_time: toTimeHM(json.class_end_time),
        attachments: Array.isArray(json.attachments) ? json.attachments : [],
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      };
      return data;
    },
  });

  /** 상세를 가져오면 폼에 세팅 */
  useEffect(() => {
    if (detail) {
      setForm(detail);
    }
  }, [detail]);

  /** 부분 업데이트용 set */
  const set = (patch: Partial<EduNoticeDto>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  /** 새 파일 선택 */
  const onFileChange = (nextFiles: UploadedFile[]) => {
    setForm((prev) => ({
    ...prev,
    attachments: nextFiles as any, // UploadedFile[] 구조 그대로 저장
  }));
  };

  /** 로컬(새로 추가한) 파일 제거 */
  const removeLocalFile = (target: UploadedFile) => {
    setFiles((prev) =>
      prev.filter(
        (f) => (f.id ?? f.name) !== (target.id ?? target.name)
      )
    );
  };

  /** 기존 attachments 중 하나 제거 */
  const removeExistingAttachment = (target: any) => {
    setForm((prev) => ({
      ...prev,
      attachments: (prev.attachments ?? []).filter(
        (a: any) =>
          (a.id ?? a.url ?? a.name) !==
          (target.id ?? target.url ?? target.name)
      ),
    }));
  };

  /** 저장 mutation */
  const {
    mutate: mutateSave,
    isPending: isSaving,
  } = useMutation({
    mutationFn: async () => {
      // 기본 검증
      if (!form.title.trim()) throw new Error("제목을 입력하세요.");
      if (!form.edu_start_date || !form.edu_end_date)
        throw new Error("교육 시작일과 종료일을 모두 입력하세요.");
      if (!form.class_start_time || !form.class_end_time)
        throw new Error("수업 시작/종료 시간을 모두 입력하세요.");
      if (!form.content.trim()) throw new Error("내용을 입력하세요.");

      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("content", form.content.trim());
      fd.append("edu_start_date", form.edu_start_date);
      fd.append("edu_end_date", form.edu_end_date);
      fd.append("class_start_time", form.class_start_time);
      fd.append("class_end_time", form.class_end_time);

      // 남은 기존 첨부들
      fd.append(
  "attachments",
  JSON.stringify(form.attachments ?? [])
);

      // 새로 업로드할 파일들
      files.forEach((f) => {
        // FileUpload 구현에 따라 필드명이 다를 수 있음
        const raw = (f as any).file ?? (f as any).raw ?? null;
        if (raw instanceof File) {
          fd.append("files", raw);
        }
      });

      const url = isEdit
        ? `${baseUrl}/edu/admin/edu-notice/${id}`
        : `${baseUrl}/edu/admin/edu-notice`;

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PUT" : "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "교육 공지 저장에 실패했습니다.");
      }
      return res.json();
    },
    onSuccess: () => {
      // 목록 쿼리 키는 프로젝트에 맞게 수정 (예: ["eduNoticeList"])
      queryClient.invalidateQueries({ queryKey: ["eduNoticeList"] });
      Swal.fire("완료", "교육 공지가 저장되었습니다.", "success");
      router.back();
    },
    onError: (err: any) => {
      Swal.fire(
        "오류",
        err?.message ?? "교육 공지 저장에 실패했습니다.",
        "error"
      );
    },
  });

  /** 저장 버튼 클릭 핸들러 */
  const onSubmit = () => {
    mutateSave();
  };

  /** 취소 버튼 클릭 */
  const onCancel = () => {
    router.back();
  };

  return {
    isEdit,
    isDetailLoading,
    isDetailError,
    detailError,
    form,
    set,
    files,
    onFileChange,
    removeLocalFile,
    removeExistingAttachment,
    onSubmit,
    onCancel,
    isSaving,
  };
}

// 교육 공지 상세 조회 (상세 페이지용)
export function useEduNoticeDetailQuery(id?: string) {
  return useQuery<{ item: EduNoticeDto }>({
    queryKey: ["eduNoticeDetail", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl}/edu/admin/edu-notice/${id}`, {
        method: "GET",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "교육 공지 상세 조회에 실패했습니다.");
      }
      const json = await res.json();

      // 만약 백엔드가 { item: {...} } 형태로 주면 그대로 리턴
      if ("item" in json) return json;

      const item: EduNoticeDto = {
        id: json.id,
        title: json.title ?? "",
        content: json.content ?? "",
        edu_start_date: json.edu_start_date ?? "",
        edu_end_date: json.edu_end_date ?? "",
        class_start_time: json.class_start_time ?? "",
        class_end_time: json.class_end_time ?? "",
        attachments: Array.isArray(json.attachments) ? json.attachments : [],
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      };

      return { item };
    },
  });
}
