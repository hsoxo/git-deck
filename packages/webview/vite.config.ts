import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: false, // 暂时禁用压缩以便调试
        rollupOptions: {
            input: {
                'git-graph': resolve(__dirname, 'src/git-graph.tsx'),
            },
            output: {
                format: 'es', // 使用 ES 模块格式
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
    },
});
