import { SimpleGit } from 'simple-git';
import type { GitStatus } from '@git-gui/shared';
import { InputValidator } from '../../utils/InputValidator';

export class StageOperations {
    constructor(private git: SimpleGit) {}

    async getStatus(): Promise<GitStatus> {
        const status = await this.git.status();
        return {
            staged: status.staged,
            unstaged: [...status.modified, ...status.deleted].filter(
                (f) => !status.staged.includes(f)
            ),
            untracked: status.not_added,
            current: status.current,
            tracking: status.tracking,
        };
    }

    async stage(files: string[]): Promise<void> {
        InputValidator.validateFilePaths(files);
        await this.git.add(files);
    }

    async unstage(files: string[]): Promise<void> {
        InputValidator.validateFilePaths(files);
        await this.git.reset(['HEAD', '--', ...files]);
    }

    async stageAll(): Promise<void> {
        await this.git.add('.');
    }

    async unstageAll(): Promise<void> {
        await this.git.reset(['HEAD']);
    }

    async commit(message: string): Promise<void> {
        const sanitized = InputValidator.sanitizeCommitMessage(message);
        await this.git.commit(sanitized);
    }

    async discard(files: string[]): Promise<void> {
        InputValidator.validateFilePaths(files);
        await this.git.checkout(['--', ...files]);
    }
}
