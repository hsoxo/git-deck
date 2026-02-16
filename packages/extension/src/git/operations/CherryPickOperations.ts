import { SimpleGit } from 'simple-git';
import type { CherryPickState } from '@git-gui/shared';
import { logger } from '../../utils/Logger';
import { ErrorHandler } from '../../utils/ErrorHandler';
import { InputValidator } from '../../utils/InputValidator';

export class CherryPickOperations {
    private state: CherryPickState = { type: 'idle' };

    constructor(private git: SimpleGit) {}

    async cherryPick(commits: string[]): Promise<void> {
        InputValidator.validateCommitRefs(commits);

        try {
            logger.debug('Starting cherry-pick', { commits });

            this.state = {
                type: 'picking',
                commits,
                current: 0,
            };

            for (let i = 0; i < commits.length; i++) {
                const commit = commits[i];
                this.state = {
                    type: 'picking',
                    commits,
                    current: i,
                };

                logger.debug(`Cherry-picking commit ${i + 1}/${commits.length}`, { commit });

                try {
                    await this.git.raw(['cherry-pick', commit]);
                } catch (error) {
                    logger.error('Cherry-pick failed', error);

                    if (await this.hasConflicts()) {
                        const files = await this.getConflictFiles();
                        this.state = { type: 'conflict', commit, files };
                        throw new CherryPickConflictError(commit, files);
                    }
                    throw new Error(ErrorHandler.createUserMessage(error, 'Cherry-pick'));
                }
            }

            this.state = { type: 'completed' };
            logger.info('Cherry-pick completed successfully');
        } catch (error) {
            if (!(error instanceof CherryPickConflictError)) {
                logger.error('Cherry-pick operation failed', error);
            }
            throw error;
        }
    }

    async continue(): Promise<void> {
        if (this.state.type !== 'conflict') {
            throw new Error('Not in conflict state');
        }

        const currentCommit = this.state.commit;

        try {
            logger.debug('Continuing cherry-pick');
            await this.git.raw(['cherry-pick', '--continue']);
            this.state = { type: 'completed' };
            logger.info('Cherry-pick continued successfully');
        } catch (error) {
            logger.error('Cherry-pick continue failed', error);

            if (await this.hasConflicts()) {
                const files = await this.getConflictFiles();
                this.state = {
                    type: 'conflict',
                    commit: currentCommit,
                    files,
                };
                throw new CherryPickConflictError(currentCommit, files);
            }
            throw new Error(ErrorHandler.createUserMessage(error, 'Continue cherry-pick'));
        }
    }

    async abort(): Promise<void> {
        try {
            logger.debug('Aborting cherry-pick');
            await this.git.raw(['cherry-pick', '--abort']);
            this.state = { type: 'aborted' };
            logger.info('Cherry-pick aborted');
        } catch (error) {
            logger.error('Cherry-pick abort failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Abort cherry-pick'));
        }
    }

    async skip(): Promise<void> {
        try {
            logger.debug('Skipping cherry-pick commit');
            await this.git.raw(['cherry-pick', '--skip']);
            logger.info('Cherry-pick commit skipped');
        } catch (error) {
            logger.error('Cherry-pick skip failed', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Skip cherry-pick'));
        }
    }

    getState(): CherryPickState {
        return this.state;
    }

    private async hasConflicts(): Promise<boolean> {
        try {
            const status = await this.git.status();
            return status.conflicted.length > 0;
        } catch (error) {
            logger.warn('Failed to check conflicts', error);
            return false;
        }
    }

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

export class CherryPickConflictError extends Error {
    constructor(
        public commit: string,
        public files: string[]
    ) {
        super(`Cherry-pick conflict in commit ${commit}: ${files.join(', ')}`);
        this.name = 'CherryPickConflictError';
    }
}
