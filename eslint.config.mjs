import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tailwind from "eslint-plugin-tailwindcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...tailwind.configs["flat/recommended"],
  {
    settings: {
      tailwindcss: {
        callees: ["cn", "clsx", "twMerge"],
        config: path.resolve(__dirname, "tailwind.config.ts"),
        whitelist: [
          "glass-panel.*",
          "no-spinners",
          "no-scrollbar",
          "custom-scrollbar",
          "memo-print-page",
          "no-print",
          "tabular-nums",
        ],
      },
    },
    rules: {
      "tailwindcss/no-contradicting-classname": "warn",
      "tailwindcss/no-custom-classname": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
