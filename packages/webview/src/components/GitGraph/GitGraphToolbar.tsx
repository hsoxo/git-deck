import { memo } from 'react';
import type { BranchInfo } from '@git-gui/shared';
import './GitGraphToolbar.css';

export interface GitGraphToolbarProps {
    branches: BranchInfo[];
    currentBranch: string | null;
    selectedBranch: string;
    onRefresh: () => void;
    onBranchChange: (branch: string) => void;
    onCheckout: () => void;
    onMerge: () => void;
    onRebase: () => void;
}

export const GitGraphToolbar = memo(function GitGraphToolbar({
    branches,
    currentBranch,
    selectedBranch,
    onRefresh,
    onBranchChange,
    onCheckout,
    onMerge,
    onRebase,
}: GitGraphToolbarProps) {
    return (
        <div className="git-graph-toolbar">
            <button onClick={onRefresh} className="toolbar-button">
                Refresh
            </button>

            <select
                className="branch-selector"
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value)}
            >
                {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                        {branch.name}
                        {branch.name === currentBranch ? ' (current)' : ''}
                    </option>
                ))}
            </select>

            <button onClick={onCheckout} className="toolbar-button">
                Checkout
            </button>

            <button onClick={onMerge} className="toolbar-button">
                Merge
            </button>

            <button onClick={onRebase} className="toolbar-button">
                Rebase
            </button>
        </div>
    );
});
