import React, { useState, useEffect } from 'react';
import type { StashInfo } from '@git-gui/shared';
import { rpcClient } from '../../services/rpcClient';
import './StashPanel.css';

export const StashPanel: React.FC = () => {
    const [stashes, setStashes] = useState<StashInfo[]>([]);
    const [message, setMessage] = useState('');
    const [includeUntracked, setIncludeUntracked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStashes();
    }, []);

    const loadStashes = async () => {
        try {
            const list = await rpcClient.call('git.stashList');
            setStashes(list);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleCreateStash = async () => {
        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.stashPush', message || undefined, includeUntracked);
            setMessage('');
            setIncludeUntracked(false);
            await loadStashes();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handlePop = async (index: number) => {
        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.stashPop', index);
            await loadStashes();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (index: number) => {
        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.stashApply', index);
            await loadStashes();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (index: number) => {
        if (!confirm('Are you sure you want to delete this stash?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.stashDrop', index);
            await loadStashes();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm('Are you sure you want to delete ALL stashes? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await rpcClient.call('git.stashClear');
            await loadStashes();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            }
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (days === 1) {
            return 'yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return d.toLocaleDateString();
        }
    };

    return (
        <div className="stash-panel">
            <div className="stash-header">
                <h3>Stash Management</h3>
                {stashes.length > 0 && (
                    <button
                        className="button button-danger-small"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        Clear All
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="stash-create">
                <input
                    type="text"
                    className="stash-message-input"
                    placeholder="Stash message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                />
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={includeUntracked}
                        onChange={(e) => setIncludeUntracked(e.target.checked)}
                        disabled={loading}
                    />
                    Include untracked files
                </label>
                <button
                    className="button button-primary"
                    onClick={handleCreateStash}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Stash'}
                </button>
            </div>

            <div className="stash-list">
                {stashes.length === 0 ? (
                    <div className="stash-empty">
                        No stashes yet. Create a stash to save your current changes.
                    </div>
                ) : (
                    stashes.map((stash) => (
                        <div key={stash.hash} className="stash-item">
                            <div className="stash-info">
                                <div className="stash-index">stash@{`{${stash.index}}`}</div>
                                <div className="stash-message">
                                    {stash.message || 'WIP on branch'}
                                </div>
                                <div className="stash-date">{formatDate(stash.date)}</div>
                            </div>
                            <div className="stash-actions">
                                <button
                                    className="button button-small button-secondary"
                                    onClick={() => handleApply(stash.index)}
                                    disabled={loading}
                                    title="Apply stash (keep in list)"
                                >
                                    Apply
                                </button>
                                <button
                                    className="button button-small button-primary"
                                    onClick={() => handlePop(stash.index)}
                                    disabled={loading}
                                    title="Pop stash (apply and remove)"
                                >
                                    Pop
                                </button>
                                <button
                                    className="button button-small button-danger"
                                    onClick={() => handleDrop(stash.index)}
                                    disabled={loading}
                                    title="Delete stash"
                                >
                                    Drop
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
