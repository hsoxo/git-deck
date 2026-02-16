import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/extension.ts'],
    format: ['cjs'],
    outDir: 'dist',
    external: ['vscode'],
    sourcemap: true,
    clean: true,
    minify: false,
    bundle: true,
    noExternal: ['simple-git', 'chokidar', '@git-gui/shared'],
});
