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
                index: resolve(__dirname, 'src/main.tsx'),
                'git-graph': resolve(__dirname, 'src/git-graph.tsx'),
            },
            output: {
                format: 'es', // 使用 ES 模块格式以支持多入口
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name].[ext]',
                // Prevent code splitting for git-graph to avoid shared chunks
                manualChunks: (id) => {
                    // Keep git-graph completely separate
                    if (id.includes('git-graph.tsx') ||
                        id.includes('GitGraph') ||
                        id.includes('useGitGraphLogic')) {
                        return 'git-graph';
                    }
                    // Everything else goes to index
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
});
