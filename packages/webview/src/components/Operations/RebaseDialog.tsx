import React, { useState, useEffect } from 'react';
import type { BranchInfo } from '@git-gui/shared';
import { rpcClient } from '../../services/rpcClient';
import './RebaseDialog.css';

interface RebaseDialogProps {
    currentBranch: string;
    branches: BranchInfo[];
    onClose: () => void;
    onSuccess: () => void;
}

type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

interface RebaseCommit {
    hash: string;
    shortHash: string;
    message: string;
    action: RebaseAction;
}

export const RebaseDialog: React.FC<RebaseDialogProps> = ({
    currentBranch,
    branches,
    onClose,
    onSuccess,
}) => {
    const [selectedBranch, setSelectedBranch] = useState('');
    const [commits, setCommits] = useState<RebaseCommit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [interactive, setInteractive] = useState(false);

    // 加载可以 rebase 的 commits
    useEffect(() => {
        if (!selectedBranch) {
            setCommits([]);
            return;
        }

        const loadCommits = async () => {
            try {
                const rebaseCommits = await rpcClient.call('git.getRebaseCommits', selectedBranch);
                setCommits(rebaseCommits);
            } catch (err) {
                console.error('Failed to load rebase commits:', err);
                setCommits([]);
            }
        };

        loadCommits();
    }, [selectedBranch]);

    const handleRebase = async () => {
        if (!selectedBranch) {
            setError('Please select a branch');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (interactive && commits.length > 0) {
                await rpcClient.call('git.interactiveRebase', selectedBranch, commits);
            } else {
                await rpcClient.call('git.rebase', selectedBranch, false);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleActionChange = (index: number, action: RebaseAction) => {
        const newCommits = [...commits];
        newCommits[index].action = action;
        setCommits(newCommits);
    };

    const moveCommitUp = (index: number) => {
        if (index === 0) {
            return;
        }
        const newCommits = [...commits];
        [newCommits[index - 1], newCommits[index]] = [newCommits[index], newCommits[index - 1]];
        setCommits(newCommits);
    };

    const moveCommitDown = (index: number) => {
        if (index === commits.length - 1) {
            return;
        }
        const newCommits = [...commits];
        [newCommits[index], newCommits[index + 1]] = [newCommits[index + 1], newCommits[index]];
        setCommits(newCommits);
    };

    const availableBranches = branches.filter((b) => !b.current);

    return (
        <div className="rebase-dialog-overlay" onClick={onClose}>
            <div className="rebase-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="rebase-dialog-header">
                    <h3>Rebase Branch</h3>
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="rebase-dialog-content">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Current Branch:</label>
                        <div className="current-branch">{currentBranch}</div>
                    </div>

                    <div className="form-group">
                        <label>Rebase onto:</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Select a branch...</option>
                            {availableBranches.map((branch) => (
                                <option key={branch.name} value={branch.name}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {commits.length > 0 && (
                        <>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={interactive}
                                        onChange={(e) => setInteractive(e.target.checked)}
                                        disabled={loading}
                                    />
                                    Interactive Rebase
                                </label>
                            </div>

                            {interactive && (
                                <div className="commits-list">
                                    <div className="commits-header">
                                        <span>Commits to rebase ({commits.length})</span>
                                    </div>
                                    {commits.map((commit, index) => (
                                        <div key={commit.hash} className="commit-item">
                                            <div className="commit-controls">
                                                <button
                                                    className="move-button"
                                                    onClick={() => moveCommitUp(index)}
                                                    disabled={index === 0 || loading}
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    className="move-button"
                                                    onClick={() => moveCommitDown(index)}
                                                    disabled={
                                                        index === commits.length - 1 || loading
                                                    }
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                            <select
                                                className="action-select"
                                                value={commit.action}
                                                onChange={(e) =>
                                                    handleActionChange(
                                                        index,
                                                        e.target.value as RebaseAction
                                                    )
                                                }
                                                disabled={loading}
                                            >
                                                <option value="pick">pick</option>
                                                <option value="reword">reword</option>
                                                <option value="edit">edit</option>
                                                <option value="squash">squash</option>
                                                <option value="fixup">fixup</option>
                                                <option value="drop">drop</option>
                                            </select>
                                            <span className="commit-hash">{commit.shortHash}</span>
                                            <span className="commit-message">{commit.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!interactive && (
                                <div className="info-message">
                                    {commits.length} commit{commits.length !== 1 ? 's' : ''} will be
                                    rebased
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="rebase-dialog-footer">
                    <button
                        className="button button-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="button button-primary"
                        onClick={handleRebase}
                        disabled={!selectedBranch || loading}
                    >
                        {loading ? 'Rebasing...' : 'Start Rebase'}
                    </button>
                </div>
            </div>
        </div>
    );
};
