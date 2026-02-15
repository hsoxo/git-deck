import React, { useEffect, useState } from 'react';
import type { CommitNode } from '@git-gui/shared';
import { rpcClient } from '../../services/rpcClient';
import './CommitDetails.css';

interface CommitDetailsProps {
    commit: CommitNode | null;
    onClose: () => void;
}

interface CommitStats {
    files: number;
    insertions: number;
    deletions: number;
}

export const CommitDetails: React.FC<CommitDetailsProps> = ({ commit, onClose }) => {
    const [files, setFiles] = useState<string[]>([]);
    const [stats, setStats] = useState<CommitStats | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!commit) {
            setFiles([]);
            setStats(null);
            return;
        }

        const loadDetails = async () => {
            setLoading(true);
            try {
                const [commitFiles, commitStats] = await Promise.all([
                    rpcClient.call('git.getCommitFiles', commit.hash),
                    rpcClient.call('git.getCommitStats', commit.hash),
                ]);
                setFiles(commitFiles);
                setStats(commitStats);
            } catch (error) {
                console.error('Failed to load commit details:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDetails();
    }, [commit]);

    if (!commit) {
        return (
            <div className="commit-details empty">
                <p>Select a commit to view details</p>
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString();
    };

    return (
        <div className="commit-details">
            <div className="commit-details-header">
                <h3>Commit Details</h3>
                <button className="close-button" onClick={onClose} title="Close">
                    ×
                </button>
            </div>

            <div className="commit-details-content">
                {/* Commit Info */}
                <div className="detail-section">
                    <div className="detail-row">
                        <span className="detail-label">Hash:</span>
                        <span className="detail-value monospace">{commit.hash}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Author:</span>
                        <span className="detail-value">{commit.author}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{commit.email}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(commit.date)}</span>
                    </div>
                    {commit.refs.length > 0 && (
                        <div className="detail-row">
                            <span className="detail-label">Refs:</span>
                            <div className="refs-list">
                                {commit.refs.map((ref, index) => (
                                    <span key={index} className="ref-tag">
                                        {ref}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Message */}
                <div className="detail-section">
                    <h4>Message</h4>
                    <div className="commit-message">{commit.message}</div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="detail-section">
                        <h4>Changes</h4>
                        <div className="commit-stats">
                            <span className="stat-item">
                                <span className="stat-label">Files:</span>
                                <span className="stat-value">{stats.files}</span>
                            </span>
                            <span className="stat-item stat-additions">
                                <span className="stat-label">+</span>
                                <span className="stat-value">{stats.insertions}</span>
                            </span>
                            <span className="stat-item stat-deletions">
                                <span className="stat-label">-</span>
                                <span className="stat-value">{stats.deletions}</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Files */}
                <div className="detail-section">
                    <h4>Files Changed ({files.length})</h4>
                    {loading ? (
                        <div className="loading">Loading files...</div>
                    ) : (
                        <div className="files-list">
                            {files.map((file, index) => (
                                <div key={index} className="file-item">
                                    {file}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Parents */}
                {commit.parents.length > 0 && (
                    <div className="detail-section">
                        <h4>Parents</h4>
                        <div className="parents-list">
                            {commit.parents.map((parent, index) => (
                                <div key={index} className="parent-item monospace">
                                    {parent.substring(0, 7)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
