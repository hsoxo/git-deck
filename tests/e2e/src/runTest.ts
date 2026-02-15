import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // Extension 开发目录
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../packages/extension');

        // 测试文件路径
        const extensionTestsPath = path.resolve(__dirname, './index');

        // 下载 VS Code，解压并运行测试
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions'],
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
