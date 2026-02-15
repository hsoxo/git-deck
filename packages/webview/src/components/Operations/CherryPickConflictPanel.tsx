import React, { useState } from 'react';
import { rpcClient } from '../../services/rpcClient';
import './CherryPickConflictPanel.css';

interface CherryPickConflictPanelProps {
    commit: string;
    conflictFiles: string[];
    onResolved: () => void;
    onAbort: () => void;
}

export const CherryPickConflictPanel: React.FC<CherryPickConflictPanelProps> = ({
    commit,
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
            await rpcClient.call('git.cherryPickContinue');
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
            await rpcClient.call('git.cherryPickSkip');
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
            await rpcClient.call('git.cherryPickAbort');
            onAbort();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cherry-pick-conflict-panel">
            <div className="conflict-header">
                <h3>Cherry-pick Conflicts</h3>
                <span className="conflict-count">
                    {resolvedFiles.size} / {conflictFiles.length} resolved
                </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="conflict-info">
                Cherry-picking commit <code>{commit.substring(0, 7)}</code> resulted in conflicts.
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
                    Abort Cherry-pick
                </button>
                <button className="button button-secondary" onClick={handleSkip} disabled={loading}>
                    Skip Commit
                </button>
                <button
                    className="button button-primary"
                    onClick={handleContinue}
                    disabled={!allResolved || loading}
                >
                    {loading ? 'Continuing...' : 'Continue Cherry-pick'}
                </button>
            </div>
        </div>
    );
};
