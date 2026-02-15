import { SimpleGit } from 'simple-git';
import type { StashInfo } from '@git-gui/shared';
import { logger } from '../../utils/Logger';
import { ErrorHandler } from '../../utils/ErrorHandler';

export class StashOperations {
    constructor(private git: SimpleGit) {}

    async list(): Promise<StashInfo[]> {
        try {
            logger.debug('Fetching stash list');
            const result = await this.git.stashList();
            logger.debug(`Found ${result.all.length} stashes`);

            return result.all.map((stash, index) => ({
                index,
                message: stash.message,
                hash: stash.hash,
                date: new Date(stash.date),
            }));
        } catch (error) {
            logger.error('Failed to list stashes', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'List stashes'));
        }
    }

    async push(message?: string, includeUntracked: boolean = false): Promise<void> {
        try {
            logger.debug('Creating stash', { message, includeUntracked });

            const args: string[] = ['push'];
            if (message) {
                args.push('-m', message);
            }
            if (includeUntracked) {
                args.push('--include-untracked');
            }

            await this.git.stash(args);
            logger.info('Stash created successfully');
        } catch (error) {
            logger.error('Failed to create stash', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Create stash'));
        }
    }

    async pop(index: number = 0): Promise<void> {
        try {
            logger.debug('Popping stash', { index });
            await this.git.stash(['pop', `stash@{${index}}`]);
            logger.info('Stash popped successfully');
        } catch (error) {
            logger.error('Failed to pop stash', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Pop stash'));
        }
    }

    async apply(index: number): Promise<void> {
        try {
            logger.debug('Applying stash', { index });
            await this.git.stash(['apply', `stash@{${index}}`]);
            logger.info('Stash applied successfully');
        } catch (error) {
            logger.error('Failed to apply stash', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Apply stash'));
        }
    }

    async drop(index: number): Promise<void> {
        try {
            logger.debug('Dropping stash', { index });
            await this.git.stash(['drop', `stash@{${index}}`]);
            logger.info('Stash dropped successfully');
        } catch (error) {
            logger.error('Failed to drop stash', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Drop stash'));
        }
    }

    async clear(): Promise<void> {
        try {
            logger.debug('Clearing all stashes');
            await this.git.stash(['clear']);
            logger.info('All stashes cleared');
        } catch (error) {
            logger.error('Failed to clear stashes', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Clear stashes'));
        }
    }

    async branch(name: string, index: number): Promise<void> {
        try {
            logger.debug('Creating branch from stash', { name, index });
            await this.git.stash(['branch', name, `stash@{${index}}`]);
            logger.info('Branch created from stash successfully');
        } catch (error) {
            logger.error('Failed to create branch from stash', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Create branch from stash'));
        }
    }
}
