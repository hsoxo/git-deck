import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/webview/**'],
            thresholds: {
                lines: 30,
                functions: 40,
                branches: 60,
                statements: 30,
            },
        },
    },
});
