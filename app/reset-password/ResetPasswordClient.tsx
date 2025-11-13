// app/reset-password/ResetPasswordClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { baseUrl } from "@/lib/variable";

export default function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setResultMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!token) {
      setErrorMessage("토큰이 없습니다. 메일의 링크를 다시 확인해 주세요.");
      return;
    }

    if (!newPassword || !newPasswordConfirm) {
      setErrorMessage("새 비밀번호와 확인 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage("비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/auth/reset-password/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "비밀번호 변경에 실패했습니다.");
      }

      setResultMessage(
        "비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다."
      );
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          비밀번호 재설정
        </h1>
        <p className="text-sm text-gray-500">
          새로 사용하실 비밀번호를 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            새 비밀번호
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            placeholder="새 비밀번호를 입력해 주세요."
          />
          <p className="mt-1 text-[11px] text-gray-400">
            영문, 숫자, 특수문자 조합 권장 / 최소 8자 이상
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            새 비밀번호 확인
          </label>
          <input
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            placeholder="다시 한 번 입력해 주세요."
          />
        </div>

        {!token && (
          <p className="text-xs text-red-500 mt-1">
            유효하지 않은 접근입니다. 메일의 링크를 다시 확인해 주세요.
          </p>
        )}

        {errorMessage && (
          <p className="text-xs text-red-500 mt-1 whitespace-pre-line">
            {errorMessage}
          </p>
        )}
        {resultMessage && (
          <p className="text-xs text-emerald-600 mt-1 whitespace-pre-line">
            {resultMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="mt-2 w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "변경 중..." : "비밀번호 변경하기"}
        </button>
      </form>
    </div>
  );
}
