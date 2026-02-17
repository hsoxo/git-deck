import { memo, useCallback } from 'react';
import type { GraphCommit } from './GitGraphRenderer';
import './GitGraphCommitRow.css';

export interface GitGraphCommitRowProps {
    graphCommit: GraphCommit;
    currentBranch: string | null;
    onContextMenu: (e: React.MouseEvent, hash: string) => void;
    rowHeight: number;
}

export const GitGraphCommitRow = memo(function GitGraphCommitRow({
    graphCommit,
    currentBranch,
    onContextMenu,
    rowHeight,
}: GitGraphCommitRowProps) {
    const { commit } = graphCommit;

    // 解析 refs 为分支和标签
    const branches: string[] = [];
    const tags: string[] = [];

    commit.refs?.forEach(ref => {
        if (ref.includes('tag:')) {
            // 提取标签名
            const tagName = ref.replace('tag:', '').trim();
            tags.push(tagName);
        } else {
            // 分支引用
            branches.push(ref);
        }
    });

    const isCurrentBranch = branches.some(b =>
        b.includes(`HEAD -> ${currentBranch}`) ||
        b === currentBranch
    );

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        onContextMenu(e, commit.hash);
    }, [onContextMenu, commit.hash]);

    return (
        <div
            className={`git-graph-commit-row ${isCurrentBranch ? 'current-branch' : ''}`}
            data-hash={commit.hash}
            onContextMenu={handleContextMenu}
            style={{ height: rowHeight }}
        >
            <div className="commit-info">
                <div className="commit-refs">
                    {/* 显示分支 */}
                    {branches.map((ref, index) => {
                        const isRemote = ref.includes('origin/') || ref.includes('remotes/');

                        // 处理显示名称
                        let displayName = ref.replace('HEAD -> ', '').trim();

                        // 如果是远程分支，保留 origin/ 前缀
                        if (isRemote) {
                            // 将 remotes/origin/ 转换为 origin/
                            displayName = displayName.replace('remotes/origin/', 'origin/');
                            // 确保有 origin/ 前缀
                            if (!displayName.startsWith('origin/')) {
                                displayName = 'origin/' + displayName;
                            }
                        }

                        const isCurrent = ref.includes(`HEAD -> ${currentBranch}`) || ref === currentBranch;
                        const labelClass = isCurrent ? 'current' : (isRemote ? 'remote' : 'local');

                        return (
                            <span
                                key={`branch-${index}`}
                                className={`branch-label ${labelClass}`}
                                title={ref}
                            >
                                {displayName}
                            </span>
                        );
                    })}

                    {/* 显示标签 */}
                    {tags.map((tag, index) => (
                        <span
                            key={`tag-${index}`}
                            className="tag-label"
                            title={`tag: ${tag}`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <span className="commit-message" title={commit.message}>
                    {commit.message}
                </span>

                <span className="commit-hash">
                    {commit.hash.substring(0, 7)}
                </span>

                <span className="commit-author">
                    {commit.author_name || commit.author}
                </span>

                <span className="commit-date">
                    {new Date(commit.date).toLocaleString()}
                </span>
            </div>
        </div>
    );
});
