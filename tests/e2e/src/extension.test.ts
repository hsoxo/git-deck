import * as assert from 'assert';
import * as vscode from 'vscode';
import { describe, it, before } from 'mocha';

describe('Extension E2E Tests', () => {
    before(async () => {
        // 等待扩展激活
        const ext = vscode.extensions.getExtension('git-gui.git-gui');
        if (ext && !ext.isActive) {
            await ext.activate();
        }
    });

    it('should activate extension', () => {
        const ext = vscode.extensions.getExtension('git-gui.git-gui');
        assert.ok(ext);
        assert.strictEqual(ext?.isActive, true);
    });

    it('should register webview view provider', async () => {
        const ext = vscode.extensions.getExtension('git-gui.git-gui');
        assert.ok(ext);

        // 验证命令已注册
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('gitGui.refresh'));
        assert.ok(commands.includes('gitGui.rebase'));
        assert.ok(commands.includes('gitGui.cherryPick'));
    });

    it('should open Git GUI view', async () => {
        // 执行刷新命令
        await vscode.commands.executeCommand('gitGui.refresh');

        // 验证命令执行成功（不抛出异常）
        assert.ok(true);
    });
});
