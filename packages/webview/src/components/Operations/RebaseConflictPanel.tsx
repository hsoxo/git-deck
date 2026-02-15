import React, { useState } from 'react';
import { rpcClient } from '../../services/rpcClient';
import './RebaseConflictPanel.css';

interface RebaseConflictPanelProps {
    conflictFiles: string[];
    onResolved: () => void;
    onAbort: () => void;
}

export const RebaseConflictPanel: React.FC<RebaseConflictPanelProps> = ({
    conflictFiles,
    onResolved,
    onAbort,
}) => {
    const [resolvedFiles, setResolvedFiles] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allResolved = resolvedFiles.size === conflictFiles.length;

    const handleMarkResolved = (file: string) => {
        setResolvedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(file)) {
                next.delete(file);
            } else {
                next.add(file);
            }
            return next;
        });
    };

    const handleContinue = async () => {
        if (!allResolved) {
            setError('Please resolve all conflicts before continuing');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.rebaseContinue');
            onResolved();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.rebaseSkip');
            onResolved();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleAbort = async () => {
        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.rebaseAbort');
            onAbort();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rebase-conflict-panel">
            <div className="conflict-header">
                <h3>Rebase Conflicts</h3>
                <span className="conflict-count">
                    {resolvedFiles.size} / {conflictFiles.length} resolved
                </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="conflict-info">
                Resolve conflicts in the following files, then mark them as resolved:
            </div>

            <div className="conflict-files">
                {conflictFiles.map((file) => (
                    <div key={file} className="conflict-file">
                        <input
                            type="checkbox"
                            checked={resolvedFiles.has(file)}
                            onChange={() => handleMarkResolved(file)}
                            disabled={loading}
                        />
                        <span className="file-path">{file}</span>
                    </div>
                ))}
            </div>

            <div className="conflict-actions">
                <button className="button button-danger" onClick={handleAbort} disabled={loading}>
                    Abort Rebase
                </button>
                <button className="button button-secondary" onClick={handleSkip} disabled={loading}>
                    Skip Commit
                </button>
                <button
                    className="button button-primary"
                    onClick={handleContinue}
                    disabled={!allResolved || loading}
                >
                    {loading ? 'Continuing...' : 'Continue Rebase'}
                </button>
            </div>
        </div>
    );
};
