import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // Exclude old Jest-based tests that can't be easily converted
      '**/__tests__/hooks/useAuth.test.tsx',
      '**/__tests__/hooks/useUserPreferences.test.tsx',
      '**/__tests__/services/firestoreService.test.ts',
      '**/__integration_tests__/auth.integration.test.tsx',
      '**/__integration_tests__/dashboard.integration.test.tsx',
      '**/__integration_tests__/gymAnalyzer.integration.test.tsx',
      // Exclude meal upload integration test due to Firebase Auth complexity
      '**/__integration_tests__/mealUpload.integration.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '__integration_tests__/',
        '*.config.{js,ts}',
        'dist/',
        'public/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
