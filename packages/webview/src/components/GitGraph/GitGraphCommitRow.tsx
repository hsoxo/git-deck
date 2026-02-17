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
    const branchRefs = commit.refs?.filter(r => !r.includes('tag:')) || [];
    const isCurrentBranch = branchRefs.some(b => b.includes(currentBranch || ''));
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
                    {branchRefs.map((ref, index) => {
                        const isRemote = ref.includes('/');
                        const displayName = ref.replace('HEAD -> ', '').replace('origin/', '');
                        const isCurrent = ref.includes(currentBranch || '');
                        const labelClass = isCurrent ? 'current' : (isRemote ? 'remote' : '');

                        return (
                            <span
                                key={index}
                                className={`branch-label ${labelClass}`}
                                title={ref}
                            >
                                {displayName}
                            </span>
                        );
                    })}
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
