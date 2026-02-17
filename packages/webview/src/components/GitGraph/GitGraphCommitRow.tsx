import { memo, useCallback } from 'react';
import type { CommitNode } from '@git-gui/shared';
import './GitGraphCommitRow.css';

export interface GitGraphCommitRowProps {
    commit: CommitNode;
    currentBranch: string | null;
    onContextMenu: (e: React.MouseEvent, hash: string) => void;
    style?: React.CSSProperties;
}

export const GitGraphCommitRow = memo(function GitGraphCommitRow({
    commit,
    currentBranch,
    onContextMenu,
    style,
}: GitGraphCommitRowProps) {
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

    const graphDisplay = commit.graph || '* ';

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        onContextMenu(e, commit.hash);
    }, [onContextMenu, commit.hash]);

    return (
        <div
            className={`git-graph-commit-row ${isCurrentBranch ? 'current-branch' : ''}`}
            data-hash={commit.hash}
            onContextMenu={handleContextMenu}
            style={style}
        >
            <div className="graph-column">{graphDisplay}</div>

            <div className="commit-info">
                <div className="commit-refs">
                    {/* 显示分支 */}
                    {branches.map((ref, index) => {
                        const isRemote = ref.includes('origin/') || ref.includes('remotes/');
                        const displayName = ref
                            .replace('HEAD -> ', '')
                            .replace('origin/', '')
                            .replace('remotes/', '')
                            .trim();
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
