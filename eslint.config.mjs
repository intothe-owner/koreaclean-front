// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js 기본 프리셋
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ✅ 여기서 원하는 룰만 덮어쓰기
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // 기본 no-unused-vars 비활성화(중복 방지)
      "no-unused-vars": "off",
      // TS용 미사용 변수 → error → warn 으로 낮추기 + 언더스코어 허용
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default eslintConfig;
