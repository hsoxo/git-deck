import { SimpleGit } from 'simple-git';
import type { RevertState } from '@git-gui/shared';
import { logger } from '../../utils/Logger';
import { ErrorHandler } from '../../utils/ErrorHandler';
import { InputValidator } from '../../utils/InputValidator';

export class RevertOperations {
    private state: RevertState = { type: 'idle' };

    constructor(private git: SimpleGit) {}

    /**
     * Revert one or more commits
     * Creates new commits that undo the changes
     */
    async revert(commits: string[], noEdit: boolean = true): Promise<void> {
        InputValidator.validateCommitRefs(commits);

        try {
            logger.debug('Reverting commits', { commits, noEdit });

            this.state = {
                type: 'in_progress',
                commits,
                current: 0,
            };

            // Revert in reverse order (newest first)
            for (let i = 0; i < commits.length; i++) {
                const commit = commits[commits.length - 1 - i];
                this.state = {
                    type: 'in_progress',
                    commits,
                    current: i,
                };

                logger.debug(`Reverting commit ${i + 1}/${commits.length}`, { commit });
                await this.git.raw(['revert', noEdit ? '--no-edit' : '--edit', commit]);
            }

            this.state = { type: 'completed' };
            logger.info('Revert completed successfully');
        } catch (error) {
            logger.error('Revert failed', error);

            if (await this.hasConflicts()) {
                const files = await this.getConflictFiles();
                this.state = { type: 'conflict', commit: commits[0], files };
                throw new RevertConflictError(commits[0], files);
            }

            throw new Error(ErrorHandler.createUserMessage(error, 'Revert'));
        }
    }

    /**
     * Revert a commit without committing
     * Useful for reviewing changes before committing
     */
    async revertNoCommit(commit: string): Promise<void> {
        InputValidator.validateCommitRef(commit);

        try {
            logger.debug('Reverting commit without committing', { commit });
            await this.git.raw(['revert', '--no-commit', commit]);
            logger.info('Revert (no commit) completed successfully');
        } catch (error) {
            logger.error('Revert (no commit) failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Revert (no commit)'));
        }
    }

    /**
     * Continue a revert after resolving conflicts
     */
    async continue(): Promise<void> {
        if (this.state.type !== 'conflict') {
            throw new Error('Not in conflict state');
        }

        const currentCommit = this.state.commit;

        try {
            logger.debug('Continuing revert');
            await this.git.raw(['revert', '--continue']);
            this.state = { type: 'completed' };
            logger.info('Revert continued successfully');
        } catch (error) {
            logger.error('Revert continue failed', error);

            if (await this.hasConflicts()) {
                const files = await this.getConflictFiles();
                this.state = {
                    type: 'conflict',
                    commit: currentCommit,
                    files,
                };
                throw new RevertConflictError(currentCommit, files);
            }

            throw new Error(ErrorHandler.createUserMessage(error, 'Continue revert'));
        }
    }

    /**
     * Abort an in-progress revert
     */
    async abort(): Promise<void> {
        try {
            logger.debug('Aborting revert');
            await this.git.raw(['revert', '--abort']);
            this.state = { type: 'aborted' };
            logger.info('Revert aborted');
        } catch (error) {
            logger.error('Revert abort failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Abort revert'));
        }
    }

    /**
     * Skip the current commit during revert
     */
    async skip(): Promise<void> {
        try {
            logger.debug('Skipping revert commit');
            await this.git.raw(['revert', '--skip']);
            logger.info('Revert commit skipped');
        } catch (error) {
            logger.error('Revert skip failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Skip revert'));
        }
    }

    /**
     * Get current revert state
     */
    getState(): RevertState {
        return this.state;
    }

    /**
     * Check if there are conflicts
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
     * Get list of conflicted files
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

export class RevertConflictError extends Error {
    constructor(
        public commit: string,
        public files: string[]
    ) {
        super(`Revert conflict in commit ${commit}: ${files.join(', ')}`);
        this.name = 'RevertConflictError';
    }
}
