import { SimpleGit } from 'simple-git';
import { Logger } from '../../utils/Logger.js';
import { InputValidator } from '../../utils/InputValidator.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

const logger = Logger.getInstance();

export interface RemoteInfo {
    name: string;
    fetchUrl: string;
    pushUrl: string;
}

export class RemoteOperations {
    constructor(private git: SimpleGit) {}

    async listRemotes(): Promise<RemoteInfo[]> {
        try {
            logger.debug('Listing remotes');
            const remotes = await this.git.getRemotes(true);
            return remotes.map((r) => ({
                name: r.name,
                fetchUrl: r.refs.fetch || '',
                pushUrl: r.refs.push || '',
            }));
        } catch (error) {
            logger.error('Failed to list remotes', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'List remotes'));
        }
    }

    async addRemote(name: string, url: string): Promise<void> {
        try {
            InputValidator.validateRemoteName(name);
            if (!url || url.trim().length === 0) {
                throw new Error('Remote URL cannot be empty');
            }
            logger.debug('Adding remote', { name, url });
            await this.git.addRemote(name, url);
        } catch (error) {
            logger.error('Failed to add remote', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Add remote'));
        }
    }

    async removeRemote(name: string): Promise<void> {
        try {
            InputValidator.validateRemoteName(name);
            logger.debug('Removing remote', { name });
            await this.git.removeRemote(name);
        } catch (error) {
            logger.error('Failed to remove remote', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Remove remote'));
        }
    }

    async fetch(remote: string = 'origin', prune: boolean = false): Promise<void> {
        try {
            InputValidator.validateRemoteName(remote);
            logger.debug('Fetching from remote', { remote, prune });
            const args = [remote];
            if (prune) {
                args.push('--prune');
            }
            await this.git.fetch(args);
        } catch (error) {
            logger.error('Failed to fetch', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Fetch'));
        }
    }

    async pull(remote: string = 'origin', branch?: string, rebase: boolean = false): Promise<void> {
        try {
            InputValidator.validateRemoteName(remote);
            if (branch) {
                InputValidator.validateBranchName(branch);
            }
            logger.debug('Pulling from remote', { remote, branch, rebase });
            const args = [remote];
            if (branch) {
                args.push(branch);
            }
            if (rebase) {
                args.unshift('--rebase');
            }
            await this.git.pull(args);
        } catch (error) {
            logger.error('Failed to pull', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Pull'));
        }
    }

    async push(
        remote: string = 'origin',
        branch?: string,
        force: boolean = false,
        setUpstream: boolean = false
    ): Promise<void> {
        try {
            InputValidator.validateRemoteName(remote);
            if (branch) {
                InputValidator.validateBranchName(branch);
            }
            logger.debug('Pushing to remote', { remote, branch, force, setUpstream });
            const args = [remote];
            if (branch) {
                args.push(branch);
            }
            if (force) {
                args.push('--force');
            }
            if (setUpstream) {
                args.push('--set-upstream');
            }
            await this.git.push(args);
        } catch (error) {
            logger.error('Failed to push', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Push'));
        }
    }
}
