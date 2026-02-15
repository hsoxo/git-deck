import React, { useState } from 'react';
import type { CommitNode } from '@git-gui/shared';
import { rpcClient } from '../../services/rpcClient';
import './CherryPickDialog.css';

interface CherryPickDialogProps {
    commits: CommitNode[];
    onClose: () => void;
    onSuccess: () => void;
}

export const CherryPickDialog: React.FC<CherryPickDialogProps> = ({
    commits,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCherryPick = async () => {
        setLoading(true);
        setError(null);

        try {
            const hashes = commits.map((c) => c.hash);
            await rpcClient.call('git.cherryPick', hashes);
            onSuccess();
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cherry-pick-dialog-overlay" onClick={onClose}>
            <div className="cherry-pick-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="cherry-pick-dialog-header">
                    <h3>Cherry-pick Commits</h3>
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="cherry-pick-dialog-content">
                    {error && <div className="error-message">{error}</div>}

                    <div className="info-message">
                        Cherry-pick will apply the following {commits.length} commit
                        {commits.length !== 1 ? 's' : ''} to the current branch:
                    </div>

                    <div className="commits-list">
                        {commits.map((commit) => (
                            <div key={commit.hash} className="commit-item">
                                <span className="commit-hash">{commit.shortHash}</span>
                                <span className="commit-message">{commit.message}</span>
                                <span className="commit-author">{commit.author}</span>
                            </div>
                        ))}
                    </div>

                    <div className="warning-message">
                        Note: If conflicts occur, you will need to resolve them manually.
                    </div>
                </div>

                <div className="cherry-pick-dialog-footer">
                    <button
                        className="button button-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="button button-primary"
                        onClick={handleCherryPick}
                        disabled={loading}
                    >
                        {loading ? 'Cherry-picking...' : 'Cherry-pick'}
                    </button>
                </div>
            </div>
        </div>
    );
};
