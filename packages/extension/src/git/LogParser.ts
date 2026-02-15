import type { CommitNode } from '@git-gui/shared';
import { logger } from '../utils/Logger';

/**
 * Git log 解析器
 * 解析 git log 输出为结构化的 commit 数据
 */
export class LogParser {
    /**
     * 解析 git log 输出
     * 格式: hash|shortHash|parents|refs|author|email|date|message
     */
    static parseLog(logOutput: string, headHash: string): CommitNode[] {
        if (!logOutput || !logOutput.trim()) {
            return [];
        }

        const lines = logOutput.trim().split('\n');
        const commits: CommitNode[] = [];

        for (const line of lines) {
            try {
                const commit = this.parseLogLine(line, headHash);
                if (commit) {
                    commits.push(commit);
                }
            } catch (error) {
                logger.warn('Failed to parse log line', { line, error });
            }
        }

        return commits;
    }

    /**
     * 解析单行 git log
     */
    private static parseLogLine(line: string, headHash: string): CommitNode | null {
        const parts = line.split('|');

        if (parts.length < 8) {
            logger.warn('Invalid log line format', { line });
            return null;
        }

        const [hash, shortHash, parentsStr, refs, author, email, dateStr, ...messageParts] = parts;

        // 解析 parents
        const parents = parentsStr ? parentsStr.split(' ').filter((p) => p) : [];

        // 解析 refs
        const refsList = this.parseRefs(refs);

        // 解析日期
        const date = new Date(parseInt(dateStr) * 1000);

        // 消息可能包含 | 字符，需要重新组合
        const message = messageParts.join('|');

        return {
            hash,
            shortHash,
            message,
            author,
            email,
            date,
            parents,
            refs: refsList,
            isHead: hash === headHash,
        };
    }

    /**
     * 解析 refs 字符串
     * 格式: "HEAD -> main, origin/main, tag: v1.0.0"
     */
    private static parseRefs(refs: string): string[] {
        if (!refs || refs.trim() === '') {
            return [];
        }

        return refs
            .split(',')
            .map((ref) => ref.trim())
            .filter((ref) => ref !== '');
    }

    /**
     * 构建 git log 格式字符串
     * 用于 git log --format 参数
     */
    static getLogFormat(): string {
        return '%H|%h|%P|%D|%an|%ae|%at|%s';
    }

    /**
     * 解析 git log --graph 输出
     * 提取图形信息用于可视化
     */
    static parseGraphLog(graphOutput: string): {
        commits: CommitNode[];
        graphLines: string[];
    } {
        const lines = graphOutput.split('\n');
        const commits: CommitNode[] = [];
        const graphLines: string[] = [];

        for (const line of lines) {
            // 提取图形部分 (*, |, /, \, 等字符)
            const graphMatch = line.match(/^([*|/\\ ]+)/);
            if (graphMatch) {
                graphLines.push(graphMatch[1]);
            }

            // 提取 commit 信息
            const commitMatch = line.match(/\*\s+(.+)$/);
            if (commitMatch) {
                // 这里需要进一步解析 commit 信息
                // 暂时只提取图形部分
            }
        }

        return { commits, graphLines };
    }

    /**
     * 构建父子关系图
     */
    static buildCommitGraph(commits: CommitNode[]): Map<string, CommitNode[]> {
        const graph = new Map<string, CommitNode[]>();

        for (const commit of commits) {
            // 为每个 parent 添加当前 commit 作为子节点
            for (const parent of commit.parents) {
                if (!graph.has(parent)) {
                    graph.set(parent, []);
                }
                graph.get(parent)!.push(commit);
            }
        }

        return graph;
    }

    /**
     * 查找分支点
     * 返回有多个子节点的 commits (分支点)
     */
    static findBranchPoints(commits: CommitNode[]): Set<string> {
        const childrenCount = new Map<string, number>();

        // 统计每个 commit 的子节点数量
        for (const commit of commits) {
            for (const parent of commit.parents) {
                childrenCount.set(parent, (childrenCount.get(parent) || 0) + 1);
            }
        }

        // 找出有多个子节点的 commits
        const branchPoints = new Set<string>();
        for (const [hash, count] of childrenCount.entries()) {
            if (count > 1) {
                branchPoints.add(hash);
            }
        }

        return branchPoints;
    }

    /**
     * 查找合并点
     * 返回有多个父节点的 commits (合并点)
     */
    static findMergePoints(commits: CommitNode[]): Set<string> {
        const mergePoints = new Set<string>();

        for (const commit of commits) {
            if (commit.parents.length > 1) {
                mergePoints.add(commit.hash);
            }
        }

        return mergePoints;
    }
}
