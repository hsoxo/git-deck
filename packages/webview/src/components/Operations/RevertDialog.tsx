import { useState } from 'react';
import type { CommitNode } from '@git-gui/shared';
import { useGitStore } from '../../store/gitStore';
import './RevertDialog.css';

interface RevertDialogProps {
    commits: CommitNode[];
    onClose: () => void;
}

export function RevertDialog({ commits, onClose }: RevertDialogProps) {
    const [loading, setLoading] = useState(false);
    const { revertCommits } = useGitStore();

    const handleRevert = async () => {
        setLoading(true);
        try {
            await revertCommits(commits.map((c) => c.hash));
            onClose();
        } catch (error) {
            console.error('Revert failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="revert-dialog-overlay" onClick={onClose}>
            <div className="revert-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="revert-dialog-header">
                    <h3>Revert Commit{commits.length > 1 ? 's' : ''}</h3>
                </div>
                <div className="revert-dialog-content">
                    <p>
                        Are you sure you want to revert the following commit
                        {commits.length > 1 ? 's' : ''}?
                    </p>
                    <div className="revert-dialog-commits">
                        {commits.map((commit) => (
                            <div key={commit.hash} className="revert-dialog-commit">
                                <span className="revert-dialog-commit-hash">
                                    {commit.shortHash}
                                </span>
                                <span className="revert-dialog-commit-message">
                                    {commit.message}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="revert-dialog-note">
                        This will create new commit{commits.length > 1 ? 's' : ''} that undo
                        {commits.length === 1 ? 'es' : ''} these changes.
                    </p>
                </div>
                <div className="revert-dialog-footer">
                    <button onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className="revert-dialog-confirm"
                        onClick={handleRevert}
                        disabled={loading}
                    >
                        {loading ? 'Reverting...' : 'Revert'}
                    </button>
                </div>
            </div>
        </div>
    );
}
