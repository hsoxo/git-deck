import { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { RebaseState } from '@git-gui/shared';
import { logger } from '../../utils/Logger';
import { ErrorHandler } from '../../utils/ErrorHandler';
import { InputValidator } from '../../utils/InputValidator';

export type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

export interface RebaseCommit {
    hash: string;
    shortHash: string;
    message: string;
    action: RebaseAction;
}

export class RebaseOperations {
    private state: RebaseState = { type: 'idle' };

    constructor(
        private git: SimpleGit,
        private repoPath: string
    ) {}

    /**
     * 开始普通 rebase
     */
    async rebase(onto: string, interactive: boolean = false): Promise<void> {
        InputValidator.validateCommitRef(onto);

        try {
            logger.debug('Starting rebase', { onto, interactive });

            // 获取要 rebase 的 commits 数量
            const log = await this.git.log({ from: onto, to: 'HEAD' });

            this.state = {
                type: 'in_progress',
                current: 0,
                total: log.all.length,
                onto,
            };

            const args = interactive ? ['-i', onto] : [onto];
            await this.git.rebase(args);

            this.state = { type: 'completed' };
            logger.info('Rebase completed successfully');
        } catch (error) {
            logger.error('Rebase failed', error);

            if (await this.hasConflicts()) {
                const files = await this.getConflictFiles();
                this.state = { type: 'conflict', files };
                throw new RebaseConflictError(files);
            }

            throw new Error(ErrorHandler.createUserMessage(error, 'Rebase'));
        }
    }

    /**
     * 开始交互式 rebase
     */
    async interactiveRebase(onto: string, commits: RebaseCommit[]): Promise<void> {
        InputValidator.validateCommitRef(onto);

        try {
            logger.debug('Starting interactive rebase', { onto, commits: commits.length });

            // 创建临时 todo 文件
            const todoContent = this.createRebaseTodo(commits);
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-rebase-'));
            const todoFile = path.join(tmpDir, 'git-rebase-todo');
            const editorScript = path.join(tmpDir, 'editor.sh');

            // 写入 todo 内容
            fs.writeFileSync(todoFile, todoContent, 'utf-8');

            // 创建编辑器脚本，将我们的 todo 复制到 Git 的 todo 文件
            const scriptContent = `#!/bin/sh\ncat "${todoFile}" > "$1"\n`;
            fs.writeFileSync(editorScript, scriptContent, 'utf-8');
            fs.chmodSync(editorScript, 0o755);

            this.state = {
                type: 'in_progress',
                current: 0,
                total: commits.length,
                onto,
            };

            // 使用自定义编辑器执行交互式 rebase
            const env = process.env || {};
            await this.git
                .env({
                    ...env,
                    GIT_SEQUENCE_EDITOR: editorScript,
                })
                .rebase(['-i', onto]);

            // 清理临时文件
            try {
                fs.unlinkSync(todoFile);
                fs.unlinkSync(editorScript);
                fs.rmdirSync(tmpDir);
            } catch (cleanupError) {
                logger.warn('Failed to cleanup temp files', cleanupError);
            }

            this.state = { type: 'completed' };
            logger.info('Interactive rebase completed');
        } catch (error) {
            logger.error('Interactive rebase failed', error);

            if (await this.hasConflicts()) {
                const files = await this.getConflictFiles();
                this.state = { type: 'conflict', files };
                throw new RebaseConflictError(files);
            }

            throw new Error(ErrorHandler.createUserMessage(error, 'Interactive rebase'));
        }
    }

    /**
     * 继续 rebase
     */
    async continue(): Promise<void> {
        if (this.state.type !== 'conflict') {
            throw new Error('Not in conflict state');
        }

        try {
            logger.debug('Continuing rebase');
            await this.git.rebase(['--continue']);
            this.state = { type: 'completed' };
            logger.info('Rebase continued successfully');
        } catch (error) {
            logger.error('Rebase continue failed', error);

            if (await this.hasConflicts()) {
                const files = await this.getConflictFiles();
                this.state = { type: 'conflict', files };
                throw new RebaseConflictError(files);
            }

            throw new Error(ErrorHandler.createUserMessage(error, 'Continue rebase'));
        }
    }

    /**
     * 中止 rebase
     */
    async abort(): Promise<void> {
        try {
            logger.debug('Aborting rebase');
            await this.git.rebase(['--abort']);
            this.state = { type: 'aborted' };
            logger.info('Rebase aborted');
        } catch (error) {
            logger.error('Rebase abort failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Abort rebase'));
        }
    }

    /**
     * 跳过当前 commit
     */
    async skip(): Promise<void> {
        try {
            logger.debug('Skipping current commit');
            await this.git.rebase(['--skip']);
            logger.info('Commit skipped');
        } catch (error) {
            logger.error('Rebase skip failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Skip commit'));
        }
    }

    /**
     * 编辑 rebase commit
     */
    async editCommit(message: string): Promise<void> {
        try {
            logger.debug('Editing commit message');
            await this.git.raw(['commit', '--amend', '-m', message]);
            await this.git.rebase(['--continue']);
            logger.info('Commit message edited');
        } catch (error) {
            logger.error('Edit commit failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Edit commit'));
        }
    }

    /**
     * 获取 rebase 状态
     */
    getState(): RebaseState {
        return this.state;
    }

    /**
     * 检查是否正在 rebase
     */
    async isRebasing(): Promise<boolean> {
        const gitDir = path.join(this.repoPath, '.git');
        return (
            fs.existsSync(path.join(gitDir, 'rebase-merge')) ||
            fs.existsSync(path.join(gitDir, 'rebase-apply'))
        );
    }

    /**
     * 获取 rebase 进度信息
     */
    async getRebaseProgress(): Promise<{
        current: number;
        total: number;
        currentCommit?: string;
    } | null> {
        if (!(await this.isRebasing())) {
            return null;
        }

        const gitDir = path.join(this.repoPath, '.git');
        const rebaseMergeDir = path.join(gitDir, 'rebase-merge');
        const rebaseApplyDir = path.join(gitDir, 'rebase-apply');

        let dir = rebaseMergeDir;
        if (!fs.existsSync(dir)) {
            dir = rebaseApplyDir;
        }

        if (!fs.existsSync(dir)) {
            return null;
        }

        try {
            const msgNumFile = path.join(dir, 'msgnum');
            const endFile = path.join(dir, 'end');
            const headNameFile = path.join(dir, 'head-name');

            const current = fs.existsSync(msgNumFile)
                ? parseInt(fs.readFileSync(msgNumFile, 'utf-8').trim())
                : 0;
            const total = fs.existsSync(endFile)
                ? parseInt(fs.readFileSync(endFile, 'utf-8').trim())
                : 0;
            const currentCommit = fs.existsSync(headNameFile)
                ? fs.readFileSync(headNameFile, 'utf-8').trim()
                : undefined;

            return { current, total, currentCommit };
        } catch (error) {
            logger.warn('Failed to get rebase progress', error);
            return null;
        }
    }

    /**
     * 获取可以 rebase 的 commits
     */
    async getRebaseCommits(onto: string): Promise<RebaseCommit[]> {
        try {
            const log = await this.git.log({ from: onto, to: 'HEAD' });

            return log.all.map((commit) => ({
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 7),
                message: commit.message,
                action: 'pick' as RebaseAction,
            }));
        } catch (error) {
            logger.error('Failed to get rebase commits', error);
            return [];
        }
    }

    /**
     * 创建 rebase todo 内容
     */
    private createRebaseTodo(commits: RebaseCommit[]): string {
        const lines = commits.map((commit) => `${commit.action} ${commit.hash} ${commit.message}`);

        return lines.join('\n') + '\n';
    }

    /**
     * 检查是否有冲突
     */
    private async hasConflicts(): Promise<boolean> {
        try {
            const status = await this.git.status();
            return status.conflicted.length > 0;
        } catch (error) {
            logger.warn('Failed to check conflicts', error);
            return false;
        }
    }

    /**
     * 获取冲突文件列表
     */
    private async getConflictFiles(): Promise<string[]> {
        try {
            const status = await this.git.status();
            return status.conflicted;
        } catch (error) {
            logger.warn('Failed to get conflict files', error);
            return [];
        }
    }
}

export class RebaseConflictError extends Error {
    constructor(public files: string[]) {
        super(`Rebase conflict in files: ${files.join(', ')}`);
        this.name = 'RebaseConflictError';
    }
}
