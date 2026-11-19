// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions/cham-bai chạy trên Deno (Supabase), không phải trong app.
    ignores: ['dist/*', 'supabase/functions/cham-bai/*', 'supabase/functions/_shared/plus.ts', 'supabase/functions/_shared/luot-ngay.ts', 'supabase/functions/_shared/moi.ts'],
  },
  {
    // GIA-58: lõi dùng chung (app + web) không import ngược sang giao diện. Xem docs/cau-truc-code.md.
    files: ['src/lib/**', 'src/hooks/**', 'src/constants/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/*', '@/components', '@/components/*', '@/web', '@/web/*', '**/app/*', '**/components/*', '**/web/*'],
              message: 'Lõi dùng chung (src/lib, src/hooks, src/constants) không import từ giao diện (src/app, src/components, src/web). Xem docs/cau-truc-code.md.',
            },
          ],
        },
      ],
    },
  },
]);
