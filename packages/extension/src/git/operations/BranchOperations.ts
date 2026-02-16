import { SimpleGit } from 'simple-git';
import { Logger } from '../../utils/Logger';
import { ErrorHandler } from '../../utils/ErrorHandler';
import { InputValidator } from '../../utils/InputValidator';

export interface BranchInfo {
    name: string;
    current: boolean;
    commit: string;
    label: string;
    upstream?: string;
    ahead?: number;
    behind?: number;
}

export interface BranchListResult {
    local: BranchInfo[];
    remote: BranchInfo[];
    current: string;
}

/**
 * Branch operations manager
 */
export class BranchOperations {
    private logger = Logger.getInstance();

    constructor(private git: SimpleGit) {}

    /**
     * List all branches (local and remote)
     */
    async listBranches(): Promise<BranchListResult> {
        this.logger.info('BranchOperations: Listing branches');

        try {
            const summary = await this.git.branch(['-vv', '-a']);

            const local: BranchInfo[] = [];
            const remote: BranchInfo[] = [];
            let current = '';

            for (const [name, branch] of Object.entries(summary.branches)) {
                const info: BranchInfo = {
                    name: branch.name,
                    current: branch.current,
                    commit: branch.commit,
                    label: branch.label,
                };

                // Parse upstream tracking info
                const trackingMatch = branch.label.match(/\[([^\]]+)\]/);
                if (trackingMatch) {
                    const tracking = trackingMatch[1];
                    const parts = tracking.split(':');
                    info.upstream = parts[0].trim();

                    // Parse ahead/behind
                    if (parts[1]) {
                        const aheadMatch = parts[1].match(/ahead (\d+)/);
                        const behindMatch = parts[1].match(/behind (\d+)/);
                        if (aheadMatch) {
                            info.ahead = parseInt(aheadMatch[1]);
                        }
                        if (behindMatch) {
                            info.behind = parseInt(behindMatch[1]);
                        }
                    }
                }

                if (branch.current) {
                    current = branch.name;
                }

                if (name.startsWith('remotes/')) {
                    remote.push(info);
                } else {
                    local.push(info);
                }
            }

            this.logger.info(
                `BranchOperations: Found ${local.length} local and ${remote.length} remote branches`
            );

            return { local, remote, current };
        } catch (error) {
            const message = ErrorHandler.createUserMessage(error, 'List branches');
            this.logger.error(`BranchOperations: Failed to list branches - ${message}`);
            throw new Error(message);
        }
    }

    /**
     * Create a new branch
     */
    async createBranch(name: string, startPoint?: string): Promise<void> {
        InputValidator.validateBranchName(name);
        if (startPoint) {
            InputValidator.validateCommitRef(startPoint);
        }

        this.logger.info(`BranchOperations: Creating branch '${name}'`);

        try {
            const args = [name];
            if (startPoint) {
                args.push(startPoint);
            }

            await this.git.branch(args);
            this.logger.info(`BranchOperations: Branch '${name}' created successfully`);
        } catch (error) {
            const message = ErrorHandler.createUserMessage(error, `Create branch '${name}'`);
            this.logger.error(`BranchOperations: Failed to create branch '${name}' - ${message}`);
            throw new Error(message);
        }
    }

    /**
     * Delete a branch
     */
    async deleteBranch(name: string, force: boolean = false): Promise<void> {
        InputValidator.validateBranchName(name);
        this.logger.info(`BranchOperations: Deleting branch '${name}' (force: ${force})`);

        try {
            await this.git.branch([force ? '-D' : '-d', name]);
            this.logger.info(`BranchOperations: Branch '${name}' deleted successfully`);
        } catch (error) {
            const message = ErrorHandler.createUserMessage(error, `Delete branch '${name}'`);
            this.logger.error(`BranchOperations: Failed to delete branch '${name}' - ${message}`);
            throw new Error(message);
        }
    }

    /**
     * Rename a branch
     */
    async renameBranch(oldName: string, newName: string, force: boolean = false): Promise<void> {
        InputValidator.validateBranchName(oldName);
        InputValidator.validateBranchName(newName);
        this.logger.info(`BranchOperations: Renaming branch '${oldName}' to '${newName}'`);

        try {
            await this.git.branch([force ? '-M' : '-m', oldName, newName]);
            this.logger.info(
                `BranchOperations: Branch '${oldName}' renamed to '${newName}' successfully`
            );
        } catch (error) {
            const message = ErrorHandler.createUserMessage(
                error,
                `Rename branch '${oldName}' to '${newName}'`
            );
            this.logger.error(
                `BranchOperations: Failed to rename branch '${oldName}' to '${newName}' - ${message}`
            );
            throw new Error(message);
        }
    }

    /**
     * Checkout (switch to) a branch
     */
    async checkoutBranch(name: string, create: boolean = false): Promise<void> {
        InputValidator.validateBranchName(name);
        this.logger.info(`BranchOperations: Checking out branch '${name}' (create: ${create})`);

        try {
            if (create) {
                await this.git.checkoutBranch(name, 'HEAD');
            } else {
                await this.git.checkout(name);
            }
            this.logger.info(`BranchOperations: Checked out branch '${name}' successfully`);
        } catch (error) {
            const message = ErrorHandler.createUserMessage(error, `Checkout branch '${name}'`);
            this.logger.error(`BranchOperations: Failed to checkout branch '${name}' - ${message}`);
            throw new Error(message);
        }
    }

    /**
     * Set upstream tracking branch
     */
    async setUpstream(branch: string, upstream: string): Promise<void> {
        this.logger.info(`BranchOperations: Setting upstream '${upstream}' for branch '${branch}'`);

        try {
            await this.git.branch(['--set-upstream-to', upstream, branch]);
            this.logger.info(
                `BranchOperations: Upstream '${upstream}' set for branch '${branch}' successfully`
            );
        } catch (error) {
            const message = ErrorHandler.createUserMessage(
                error,
                `Set upstream for branch '${branch}'`
            );
            this.logger.error(
                `BranchOperations: Failed to set upstream for branch '${branch}' - ${message}`
            );
            throw new Error(message);
        }
    }

    /**
     * Unset upstream tracking branch
     */
    async unsetUpstream(branch: string): Promise<void> {
        this.logger.info(`BranchOperations: Unsetting upstream for branch '${branch}'`);

        try {
            await this.git.branch(['--unset-upstream', branch]);
            this.logger.info(
                `BranchOperations: Upstream unset for branch '${branch}' successfully`
            );
        } catch (error) {
            const message = ErrorHandler.createUserMessage(
                error,
                `Unset upstream for branch '${branch}'`
            );
            this.logger.error(
                `BranchOperations: Failed to unset upstream for branch '${branch}' - ${message}`
            );
            throw new Error(message);
        }
    }

    /**
     * Merge a branch into current branch
     */
    async mergeBranch(branch: string, noFastForward: boolean = false): Promise<void> {
        InputValidator.validateBranchName(branch);
        this.logger.info(`BranchOperations: Merging branch '${branch}' (no-ff: ${noFastForward})`);

        try {
            const args = [branch];
            if (noFastForward) {
                args.unshift('--no-ff');
            }

            await this.git.merge(args);
            this.logger.info(`BranchOperations: Branch '${branch}' merged successfully`);
        } catch (error) {
            const message = ErrorHandler.createUserMessage(error, `Merge branch '${branch}'`);
            this.logger.error(`BranchOperations: Failed to merge branch '${branch}' - ${message}`);
            throw new Error(message);
        }
    }

    /**
     * Get current branch name
     */
    async getCurrentBranch(): Promise<string> {
        this.logger.info('BranchOperations: Getting current branch');

        try {
            const summary = await this.git.branch();
            this.logger.info(`BranchOperations: Current branch is '${summary.current}'`);
            return summary.current;
        } catch (error) {
            const message = ErrorHandler.createUserMessage(error, 'Get current branch');
            this.logger.error(`BranchOperations: Failed to get current branch - ${message}`);
            throw new Error(message);
        }
    }
}
