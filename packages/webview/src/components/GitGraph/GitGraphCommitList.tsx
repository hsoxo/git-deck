import { memo } from 'react';
import type { CommitNode } from '@git-gui/shared';
import { GitGraphCommitRow } from './GitGraphCommitRow';
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
    return (
        <div className="git-graph-commit-list">
            {commits.map((commit) => (
                <GitGraphCommitRow
                    key={commit.hash}
                    commit={commit}
                    currentBranch={currentBranch}
                    onContextMenu={onContextMenu}
                />
            ))}
        </div>
    );
});
