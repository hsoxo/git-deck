import { memo, useMemo } from 'react';
import type { CommitNode } from '@git-gui/shared';
import { GitGraphCommitRow } from './GitGraphCommitRow';
import { GitGraphRenderer } from './GitGraphRenderer';
import './GitGraphCommitList.css';

export interface GitGraphCommitListProps {
    commits: CommitNode[];
    currentBranch: string | null;
    onContextMenu: (e: React.MouseEvent, hash: string) => void;
}

export const GitGraphCommitList = memo(function GitGraphCommitList({
    commits,
    currentBranch,
    onContextMenu,
}: GitGraphCommitListProps) {
    const renderer = useMemo(() => new GitGraphRenderer(), []);
    const graphCommits = useMemo(() => renderer.calculateLayout(commits), [renderer, commits]);

    const columnWidth = renderer.getColumnWidth();
    const rowHeight = renderer.getRowHeight();
    const dotRadius = renderer.getDotRadius();

    return (
        <div className="git-graph-commit-list">
            {graphCommits.map((graphCommit) => (
                <GitGraphCommitRow
                    key={graphCommit.commit.hash}
                    graphCommit={graphCommit}
                    currentBranch={currentBranch}
                    onContextMenu={onContextMenu}
                    columnWidth={columnWidth}
                    rowHeight={rowHeight}
                    dotRadius={dotRadius}
                />
            ))}
        </div>
    );
});
