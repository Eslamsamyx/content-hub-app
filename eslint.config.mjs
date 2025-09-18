import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unsafe-function-type": "off"
    }
  },
  {
    ignores: [
      // dependencies
      "node_modules/**",
      // next.js
      ".next/**",
      "out/**",
      // production
      "build/**",
      "dist/**",
      // misc
      "**/.DS_Store",
      "**/*.pem",
      // debug
      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      // local env files
      "**/.env*.local",
      // vercel
      ".vercel/**",
      // typescript
      "**/*.tsbuildinfo",
      "**/next-env.d.ts"
    ]
  }
];

export default eslintConfig;
