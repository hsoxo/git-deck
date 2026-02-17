import simpleGit, { SimpleGit, LogResult, StatusResult } from 'simple-git';
import * as path from 'path';
import type { GitStatus, CommitNode, LogOptions, BranchInfo } from '@git-gui/shared';
import { logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';

export class GitService {
    private git: SimpleGit;
    private repoPath: string;

    constructor(repoPath: string) {
        this.repoPath = repoPath;
        this.git = simpleGit(repoPath);
        logger.info(`GitService initialized for: ${repoPath}`);
    }

    async getStatus(): Promise<GitStatus> {
        try {
            logger.debug('Getting git status...');
            logger.time('git.status');
            const status: StatusResult = await this.git.status();
            logger.timeEnd('git.status');

            // simple-git 的 status.files 包含每个文件的详细状态
            // 每个文件有 index 和 working_dir 两个状态字段
            // index: 暂存区的状态 (M=modified, A=added, D=deleted, ' '=unchanged)
            // working_dir: 工作区的状态 (M=modified, D=deleted, ' '=unchanged)

            const staged: string[] = [];
            const unstaged: string[] = [];
            const untracked: string[] = [];

            status.files.forEach(file => {
                const hasIndexChanges = file.index && file.index !== ' ' && file.index !== '?';
                const hasWorkingChanges = file.working_dir && file.working_dir !== ' ' && file.working_dir !== '?';

                if (file.working_dir === '?') {
                    // Untracked file
                    untracked.push(file.path);
                } else {
                    // Tracked file
                    if (hasIndexChanges) {
                        staged.push(file.path);
                    }
                    if (hasWorkingChanges) {
                        unstaged.push(file.path);
                    }
                }
            });

            const result = {
                staged,
                unstaged,
                untracked,
                current: status.current,
                tracking: status.tracking,
            };

            logger.debug('Git status retrieved successfully', {
                staged: result.staged.length,
                unstaged: result.unstaged.length,
                untracked: result.untracked.length,
                current: result.current,
            });

            return result;
        } catch (error) {
            logger.error('Failed to get status', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get status'));
        }
    }

    async getLog(options: LogOptions = {}): Promise<CommitNode[]> {
        try {
            logger.debug('Getting git log', options);
            logger.time('git.log');
            const log: LogResult = await this.git.log({
                maxCount: options.maxCount || 100,
                from: options.from,
                to: options.to,
            });
            logger.timeEnd('git.log');

            logger.debug(`Retrieved ${log.all.length} commits`);

            const currentBranch = await this.getCurrentBranch();
            const headHash = await this.getHeadHash();

            return log.all.map((commit) => {
                // 安全地获取 parents，处理可能不存在的情况
                let parents: string[] = [];
                if ('parents' in commit && commit.parents) {
                    parents = Array.isArray(commit.parents) ? commit.parents : [];
                }

                return {
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    message: commit.message,
                    author: commit.author_name,
                    email: commit.author_email,
                    date: new Date(commit.date),
                    parents,
                    refs: this.parseRefs(commit.refs),
                    isHead: commit.hash === headHash,
                };
            });
        } catch (error) {
            logger.error('Failed to get log', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get log'));
        }
    }
    async getGraphLog(maxCount: number = 100): Promise<CommitNode[]> {
        try {
            logger.debug('Getting git graph log');
            logger.time('git.graphLog');

            // 使用 --all 获取所有分支，--graph 获取图形信息
            // 使用特殊分隔符来避免解析问题
            const result = await this.git.raw([
                'log',
                '--all',
                '--graph',
                '--date=iso',
                '--pretty=format:%H|%h|%P|%an|%ae|%ad|%D|%s',
                `--max-count=${maxCount}`
            ]);

            logger.timeEnd('git.graphLog');

            const commits: CommitNode[] = [];
            const lines = result.split('\n');

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                // 解析图形字符和提交信息
                // 图形字符包括: * | / \ _ 和空格
                const graphMatch = line.match(/^([\s*|/\\_]+)/);
                const graphChars = graphMatch ? graphMatch[1] : '';

                // 提取提交信息（去掉图形字符）
                const commitInfo = line.substring(graphChars.length).trim();

                // 使用 | 分隔符解析提交信息
                const parts = commitInfo.split('|');

                if (parts.length >= 7) {
                    const hash = parts[0];
                    const shortHash = parts[1];
                    const parents = parts[2] ? parts[2].split(' ').filter(p => p) : [];
                    const author_name = parts[3];
                    const author_email = parts[4];
                    const dateStr = parts[5];
                    const refs = parts[6];
                    const message = parts.slice(7).join('|'); // 消息可能包含 |

                    commits.push({
                        hash,
                        shortHash,
                        message,
                        author: author_name,
                        author_name,
                        email: author_email,
                        author_email,
                        date: new Date(dateStr),
                        parents,
                        refs: this.parseRefs(refs),
                        isHead: false,
                        graph: graphChars
                    });
                }
            }

            // 标记 HEAD
            const headHash = await this.getHeadHash();
            commits.forEach(commit => {
                commit.isHead = commit.hash === headHash;
            });

            logger.debug(`Retrieved ${commits.length} commits with graph`);
            return commits;
        } catch (error) {
            logger.error('Failed to get graph log', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get graph log'));
        }
    }

    async stageFiles(files: string[]): Promise<void> {
        try {
            // 验证输入
            if (!files || files.length === 0) {
                throw new Error('No files specified');
            }

            // 验证文件路径
            for (const file of files) {
                if (file.includes('..') || path.isAbsolute(file)) {
                    throw new Error(`Invalid file path: ${file}`);
                }
            }

            logger.debug('Staging files', files);
            await this.git.add(files);
        } catch (error) {
            logger.error('Failed to stage files', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Stage files'));
        }
    }

    async unstageFiles(files: string[]): Promise<void> {
        try {
            logger.debug('Unstaging files', files);
            await this.git.reset(['HEAD', '--', ...files]);
        } catch (error) {
            logger.error('Failed to unstage files', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Unstage files'));
        }
    }

    async stageAll(): Promise<void> {
        try {
            logger.debug('Staging all files');
            await this.git.add('.');
        } catch (error) {
            logger.error('Failed to stage all', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Stage all'));
        }
    }

    async unstageAll(): Promise<void> {
        try {
            logger.debug('Unstaging all files');
            await this.git.reset(['HEAD']);
        } catch (error) {
            logger.error('Failed to unstage all', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Unstage all'));
        }
    }

    async commit(message: string): Promise<void> {
        try {
            // 验证输入
            if (!message || message.trim().length === 0) {
                throw new Error('Commit message cannot be empty');
            }

            if (message.length > 5000) {
                throw new Error('Commit message is too long (max 5000 characters)');
            }

            logger.debug('Creating commit', { message: message.substring(0, 100) });
            await this.git.commit(message);
        } catch (error) {
            logger.error('Failed to commit', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Commit'));
        }
    }

    async discardChanges(files: string[]): Promise<void> {
        try {
            logger.debug('Discarding changes', files);
            await this.git.checkout(['--', ...files]);
        } catch (error) {
            logger.error('Failed to discard changes', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Discard changes'));
        }
    }

    async getBranches(): Promise<BranchInfo[]> {
        try {
            logger.debug('Getting branches');
            const branches = await this.git.branch();
            return branches.all.map((name) => ({
                name,
                current: name === branches.current,
                remote: name.startsWith('remotes/'),
            }));
        } catch (error) {
            logger.error('Failed to get branches', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get branches'));
        }
    }

    async getTags(): Promise<import('@git-gui/shared').TagInfo[]> {
        try {
            logger.debug('Getting tags');
            logger.time('git.tags');

            // 获取所有标签及其详细信息
            const result = await this.git.raw([
                'tag',
                '-l',
                '--format=%(refname:short)%09%(objectname)%09%(creatordate:iso8601)%09%(subject)%09%(taggername)'
            ]);

            logger.timeEnd('git.tags');

            const tags: import('@git-gui/shared').TagInfo[] = [];
            const lines = result.trim().split('\n');

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                const parts = line.split('\t');
                if (parts.length >= 2) {
                    tags.push({
                        name: parts[0],
                        hash: parts[1],
                        date: parts[2] ? new Date(parts[2]) : new Date(),
                        message: parts[3] || '',
                        tagger: parts[4] || ''
                    });
                }
            }

            logger.debug(`Retrieved ${tags.length} tags`);
            return tags;
        } catch (error) {
            logger.error('Failed to get tags', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get tags'));
        }
    }


    async getCurrentBranch(): Promise<string | null> {
        try {
            const branches = await this.git.branch();
            return branches.current;
        } catch (error) {
            logger.error('Failed to get current branch', error);
            return null;
        }
    }

    async getHeadHash(): Promise<string> {
        try {
            const log = await this.git.log({ maxCount: 1 });
            return log.latest?.hash || '';
        } catch (error) {
            logger.error('Failed to get HEAD hash', error);
            return '';
        }
    }

    async amendCommit(message?: string): Promise<void> {
        try {
            logger.debug('Amending commit', { message });
            if (message) {
                await this.git.raw(['commit', '--amend', '-m', message]);
            } else {
                await this.git.raw(['commit', '--amend', '--no-edit']);
            }
        } catch (error) {
            logger.error('Failed to amend commit', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Amend commit'));
        }
    }

    async getFileDiff(file: string, staged: boolean = false): Promise<string> {
        try {
            logger.debug('Getting file diff', { file, staged });
            const args = staged ? ['--cached', file] : [file];
            return await this.git.diff(args);
        } catch (error) {
            logger.error('Failed to get file diff', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get file diff'));
        }
    }

    async revertCommits(commits: string[]): Promise<void> {
        try {
            logger.debug('Reverting commits', commits);
            // Revert commits in reverse order (newest first)
            for (const commit of commits.reverse()) {
                await this.git.raw(['revert', '--no-edit', commit]);
            }
        } catch (error) {
            logger.error('Failed to revert commits', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Revert commits'));
        }
    }

    async createBranch(name: string, startPoint?: string): Promise<void> {
        try {
            logger.debug('Creating branch', { name, startPoint });
            const args = [name];
            if (startPoint) {
                args.push(startPoint);
            }
            await this.git.branch(args);
        } catch (error) {
            logger.error('Failed to create branch', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Create branch'));
        }
    }

    async deleteBranch(name: string, force: boolean = false): Promise<void> {
        try {
            logger.debug('Deleting branch', { name, force });
            await this.git.branch([force ? '-D' : '-d', name]);
        } catch (error) {
            logger.error('Failed to delete branch', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Delete branch'));
        }
    }

    async renameBranch(oldName: string, newName: string, force: boolean = false): Promise<void> {
        try {
            logger.debug('Renaming branch', { oldName, newName, force });
            await this.git.branch([force ? '-M' : '-m', oldName, newName]);
        } catch (error) {
            logger.error('Failed to rename branch', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Rename branch'));
        }
    }

    async checkoutBranch(name: string, create: boolean = false): Promise<void> {
        try {
            logger.debug('Checking out branch', { name, create });
            if (create) {
                await this.git.checkoutBranch(name, 'HEAD');
            } else {
                await this.git.checkout(name);
            }
        } catch (error) {
            logger.error('Failed to checkout branch', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Checkout branch'));
        }
    }

    async mergeBranch(branch: string, noFastForward: boolean = false): Promise<void> {
        try {
            logger.debug('Merging branch', { branch, noFastForward });
            const args = [branch];
            if (noFastForward) {
                args.unshift('--no-ff');
            }
            await this.git.merge(args);
        } catch (error) {
            logger.error('Failed to merge branch', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Merge branch'));
        }
    }

    async cherryPick(commits: string[]): Promise<void> {
        try {
            logger.debug('Cherry-picking commits', commits);
            for (const commit of commits) {
                await this.git.raw(['cherry-pick', commit]);
            }
        } catch (error) {
            logger.error('Failed to cherry-pick', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Cherry-pick'));
        }
    }

    async rebase(branch: string, interactive: boolean = false): Promise<void> {
        try {
            logger.debug('Rebasing onto branch', { branch, interactive });
            const args = ['rebase'];
            if (interactive) {
                args.push('-i');
            }
            args.push(branch);
            await this.git.raw(args);
        } catch (error) {
            logger.error('Failed to rebase', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Rebase'));
        }
    }


    private parseRefs(refs: string): string[] {
        if (!refs) {
            return [];
        }
        return refs.split(',').map((r) => r.trim());
    }

    async push(force: boolean = false): Promise<void> {
        logger.debug(`Pushing to remote${force ? ' (force)' : ''}...`);
        const args = ['push'];
        if (force) {
            args.push('--force');
        }
        await this.git.raw(args);
        logger.info(`Pushed successfully${force ? ' (force)' : ''}`);
    }

    getRepoPath(): string {
        return this.repoPath;
    }
}
