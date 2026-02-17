import { memo } from 'react';
import { GitGraphToolbar } from './GitGraphToolbar';
import { GitGraphCommitList } from './GitGraphCommitList';
import { GitGraphContextMenu } from './GitGraphContextMenu';
import { useGitGraphLogic } from './useGitGraphLogic';
import './GitGraphView.css';

export interface GitGraphViewProps {
    onRefresh?: () => void;
    onCheckout?: (branch: string) => void;
    onMerge?: (branch: string) => void;
    onRebase?: (branch: string) => void;
    onCherryPick?: (commits: string[]) => void;
    onRevert?: (commit: string) => void;
    onCreateBranch?: (commit: string) => void;
    onCopyHash?: (hash: string) => void;
}

export const GitGraphView = memo(function GitGraphView(props: GitGraphViewProps) {
    const {
        commits,
        branches,
        currentBranch,
        loading,
        error,
        contextMenu,
        selectedBranch,
        handleRefresh,
        handleBranchChange,
        handleCheckout,
        handleMerge,
        handleRebase,
        handleContextMenu,
        handleCherryPick,
        handleRevert,
        handleCreateBranch,
        handleCopyHash,
        closeContextMenu,
    } = useGitGraphLogic(props);

    if (error) {
        return (
            <div className="git-graph-error">
                <div className="error-icon">⚠️</div>
                <h2>Failed to Load Git Graph</h2>
                <p>{error}</p>
                <button onClick={handleRefresh}>Retry</button>
            </div>
        );
    }

    if (loading && commits.length === 0) {
        return (
            <div className="git-graph-loading">
                <div className="loading-spinner"></div>
                <p>Loading git graph...</p>
            </div>
        );
    }

    return (
        <div className="git-graph-view" onClick={closeContextMenu}>
            <GitGraphToolbar
                branches={branches}
                currentBranch={currentBranch}
                selectedBranch={selectedBranch}
                onRefresh={handleRefresh}
                onBranchChange={handleBranchChange}
                onCheckout={handleCheckout}
                onMerge={handleMerge}
                onRebase={handleRebase}
            />

            <GitGraphCommitList
                commits={commits}
                currentBranch={currentBranch}
                onContextMenu={handleContextMenu}
            />

            {contextMenu && (
                <GitGraphContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onCherryPick={() => handleCherryPick(contextMenu.hash)}
                    onRevert={() => handleRevert(contextMenu.hash)}
                    onCreateBranch={() => handleCreateBranch(contextMenu.hash)}
                    onCopyHash={() => handleCopyHash(contextMenu.hash)}
                    onClose={closeContextMenu}
                />
            )}
        </div>
    );
});
