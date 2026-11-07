// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions/cham-bai chạy trên Deno (Supabase), không phải trong app.
    ignores: ['dist/*', 'supabase/functions/cham-bai/*', 'supabase/functions/_shared/plus.ts', 'supabase/functions/_shared/luot-ngay.ts'],
  },
]);
