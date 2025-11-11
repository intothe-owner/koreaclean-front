// 회사 형태 옵션
const COMPANY_TYPES = ["협동조합", "유한회사", "주식회사", "개인사업자"] as const;
type CompanyType = (typeof COMPANY_TYPES)[number];

// 카드형 라디오 UI (접근성 포함)
export function CompanyTypeRadio({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: CompanyType) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-neutral-700">
        회사 형태 <span className="text-red-500">*</span>
      </legend>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {COMPANY_TYPES.map((opt) => {
          const checked = value === opt;
          return (
            <label
              key={opt}
              className={[
                "flex cursor-pointer select-none items-center justify-center rounded-xl border px-3 py-2 text-sm transition",
                checked
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white hover:bg-neutral-50",
              ].join(" ")}
            >
              <input
                type="radio"
                name="company_type"
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                required
                className="sr-only"
                aria-checked={checked}
              />
              {opt}
            </label>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        협동조합 / 유한회사 / 주식회사 / 개인사업자 중 하나를 선택하세요.
      </p>
    </fieldset>
  );
}
