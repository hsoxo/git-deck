import { SimpleGit } from 'simple-git';
import type { CommitNode, LogOptions } from '@git-gui/shared';
import { LogParser } from '../LogParser';
import { logger } from '../../utils/Logger';
import { ErrorHandler } from '../../utils/ErrorHandler';

/**
 * Git log 操作类
 * 处理所有与 commit 历史相关的操作
 */
export class LogOperations {
    constructor(private git: SimpleGit) {}

    /**
     * 获取 commit 历史
     */
    async getLog(options: LogOptions = {}): Promise<CommitNode[]> {
        try {
            logger.debug('Getting commit log', options);

            const maxCount = options.maxCount || 100;
            const skip = options.skip || 0;

            // 构建 git log 命令参数
            const args = [
                'log',
                `--max-count=${maxCount}`,
                `--skip=${skip}`,
                `--format=${LogParser.getLogFormat()}`,
                '--date-order',
            ];

            // 添加分支或范围过滤
            if (options.branch) {
                args.push(options.branch);
            } else if (options.from && options.to) {
                args.push(`${options.from}..${options.to}`);
            } else if (options.from) {
                args.push(`${options.from}..HEAD`);
            } else {
                args.push('--all');
            }

            // 执行 git log
            const output = await this.git.raw(args);

            // 获取 HEAD hash
            const headHash = await this.getHeadHash();

            // 解析输出
            const commits = LogParser.parseLog(output, headHash);

            logger.debug(`Loaded ${commits.length} commits`);
            return commits;
        } catch (error) {
            logger.error('Failed to get log', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get commit log'));
        }
    }

    /**
     * 获取带图形的 commit 历史
     * 用于可视化分支结构
     */
    async getGraphLog(options: LogOptions = {}): Promise<CommitNode[]> {
        try {
            logger.debug('Getting graph log', options);

            const maxCount = options.maxCount || 100;

            const args = [
                'log',
                '--graph',
                '--oneline',
                '--decorate',
                `--max-count=${maxCount}`,
                '--all',
            ];

            const output = await this.git.raw(args);
            const { commits } = LogParser.parseGraphLog(output);

            return commits;
        } catch (error) {
            logger.error('Failed to get graph log', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get graph log'));
        }
    }

    /**
     * 获取指定 commit 的详细信息
     */
    async getCommitDetails(hash: string): Promise<CommitNode | null> {
        try {
            logger.debug('Getting commit details', { hash });

            const args = ['log', '-1', `--format=${LogParser.getLogFormat()}`, hash];

            const output = await this.git.raw(args);
            const headHash = await this.getHeadHash();
            const commits = LogParser.parseLog(output, headHash);

            return commits[0] || null;
        } catch (error) {
            logger.error('Failed to get commit details', error);
            return null;
        }
    }

    /**
     * 获取 commit 的文件变更列表
     */
    async getCommitFiles(hash: string): Promise<string[]> {
        try {
            logger.debug('Getting commit files', { hash });

            const output = await this.git.raw([
                'diff-tree',
                '--no-commit-id',
                '--name-only',
                '-r',
                hash,
            ]);

            return output
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== '');
        } catch (error) {
            logger.error('Failed to get commit files', error);
            return [];
        }
    }

    /**
     * 获取两个 commit 之间的差异统计
     */
    async getCommitStats(hash: string): Promise<{
        files: number;
        insertions: number;
        deletions: number;
    }> {
        try {
            logger.debug('Getting commit stats', { hash });

            const output = await this.git.raw(['show', '--stat', '--format=', hash]);

            // 解析统计信息
            // 格式: "3 files changed, 45 insertions(+), 12 deletions(-)"
            const statsMatch = output.match(
                /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/
            );

            if (statsMatch) {
                return {
                    files: parseInt(statsMatch[1]) || 0,
                    insertions: parseInt(statsMatch[2]) || 0,
                    deletions: parseInt(statsMatch[3]) || 0,
                };
            }

            return { files: 0, insertions: 0, deletions: 0 };
        } catch (error) {
            logger.error('Failed to get commit stats', error);
            return { files: 0, insertions: 0, deletions: 0 };
        }
    }

    /**
     * 搜索 commits
     */
    async searchCommits(query: string, options: LogOptions = {}): Promise<CommitNode[]> {
        try {
            logger.debug('Searching commits', { query, options });

            const maxCount = options.maxCount || 100;

            const args = [
                'log',
                `--max-count=${maxCount}`,
                `--format=${LogParser.getLogFormat()}`,
                '--all',
                `--grep=${query}`,
                '-i', // case insensitive
            ];

            const output = await this.git.raw(args);
            const headHash = await this.getHeadHash();

            return LogParser.parseLog(output, headHash);
        } catch (error) {
            logger.error('Failed to search commits', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Search commits'));
        }
    }

    /**
     * 获取指定作者的 commits
     */
    async getCommitsByAuthor(author: string, options: LogOptions = {}): Promise<CommitNode[]> {
        try {
            logger.debug('Getting commits by author', { author, options });

            const maxCount = options.maxCount || 100;

            const args = [
                'log',
                `--max-count=${maxCount}`,
                `--format=${LogParser.getLogFormat()}`,
                '--all',
                `--author=${author}`,
            ];

            const output = await this.git.raw(args);
            const headHash = await this.getHeadHash();

            return LogParser.parseLog(output, headHash);
        } catch (error) {
            logger.error('Failed to get commits by author', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get commits by author'));
        }
    }

    /**
     * 获取指定日期范围的 commits
     */
    async getCommitsByDateRange(
        since: Date,
        until: Date,
        options: LogOptions = {}
    ): Promise<CommitNode[]> {
        try {
            logger.debug('Getting commits by date range', { since, until, options });

            const maxCount = options.maxCount || 100;

            const args = [
                'log',
                `--max-count=${maxCount}`,
                `--format=${LogParser.getLogFormat()}`,
                '--all',
                `--since=${since.toISOString()}`,
                `--until=${until.toISOString()}`,
            ];

            const output = await this.git.raw(args);
            const headHash = await this.getHeadHash();

            return LogParser.parseLog(output, headHash);
        } catch (error) {
            logger.error('Failed to get commits by date range', error);
            throw new Error(ErrorHandler.createUserMessage(error, 'Get commits by date range'));
        }
    }

    /**
     * 获取 HEAD commit hash
     */
    private async getHeadHash(): Promise<string> {
        try {
            const output = await this.git.raw(['rev-parse', 'HEAD']);
            return output.trim();
        } catch (error) {
            logger.warn('Failed to get HEAD hash', error);
            return '';
        }
    }
}
