import { useState } from 'react';
import type { CommitNode, BranchInfo } from '@git-gui/shared';
import { useGitStore } from '../../store/gitStore';
import { RevertDialog } from '../Operations/RevertDialog';
import { RebaseDialog } from '../Operations/RebaseDialog';
import { CherryPickDialog } from '../Operations/CherryPickDialog';
import './CommitList.css';

interface CommitListProps {
    commits: CommitNode[];
    branches: BranchInfo[];
    currentBranch: string;
    startIndex?: number;
}

export function CommitList({ commits, branches, currentBranch }: CommitListProps) {
    const { selectedCommits, selectCommit } = useGitStore();
    const [showRevertDialog, setShowRevertDialog] = useState(false);
    const [showRebaseDialog, setShowRebaseDialog] = useState(false);
    const [showCherryPickDialog, setShowCherryPickDialog] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        commit: CommitNode;
    } | null>(null);

    const handleCommitClick = (hash: string, event: React.MouseEvent) => {
        const multi = event.ctrlKey || event.metaKey;
        selectCommit(hash, multi);
    };

    const handleContextMenu = (event: React.MouseEvent, commit: CommitNode) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, commit });
    };

    const handleRevert = () => {
        setShowRevertDialog(true);
        setContextMenu(null);
    };

    const handleRebase = () => {
        setShowRebaseDialog(true);
        setContextMenu(null);
    };

    const handleCherryPick = () => {
        setShowCherryPickDialog(true);
        setContextMenu(null);
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

    const getSelectedCommitObjects = () => {
        return commits.filter((c) => selectedCommits.includes(c.hash));
    };

    if (commits.length === 0) {
        return <div className="commit-list-empty">No commits yet</div>;
    }

    return (
        <>
            <div className="commit-list" onClick={() => setContextMenu(null)}>
                {commits.map((commit) => (
                    <div
                        key={commit.hash}
                        className={`commit-item ${selectedCommits.includes(commit.hash) ? 'selected' : ''} ${commit.isHead ? 'head' : ''}`}
                        onClick={(e) => handleCommitClick(commit.hash, e)}
                        onContextMenu={(e) => handleContextMenu(e, commit)}
                    >
                        <div className="commit-graph">
                            <div className="commit-dot"></div>
                            <div className="commit-line"></div>
                        </div>
                        <div className="commit-content">
                            <div className="commit-message">{commit.message}</div>
                            <div className="commit-meta">
                                <span className="commit-author">{commit.author}</span>
                                <span className="commit-separator">•</span>
                                <span className="commit-hash">{commit.shortHash}</span>
                                <span className="commit-separator">•</span>
                                <span className="commit-date">{formatDate(commit.date)}</span>
                            </div>
                            {commit.refs.length > 0 && (
                                <div className="commit-refs">
                                    {commit.refs.map((ref) => (
                                        <span key={ref} className="commit-ref">
                                            {ref}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {contextMenu && (
                <div
                    className="commit-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="commit-context-menu-item" onClick={handleCherryPick}>
                        Cherry-pick Commit{selectedCommits.length > 1 ? 's' : ''}
                    </div>
                    <div className="commit-context-menu-item" onClick={handleRevert}>
                        Revert Commit{selectedCommits.length > 1 ? 's' : ''}
                    </div>
                    <div className="commit-context-menu-item" onClick={handleRebase}>
                        Rebase onto this Commit
                    </div>
                </div>
            )}

            {showRevertDialog && (
                <RevertDialog
                    commits={getSelectedCommitObjects()}
                    onClose={() => setShowRevertDialog(false)}
                />
            )}

            {showRebaseDialog && (
                <RebaseDialog
                    currentBranch={currentBranch}
                    branches={branches}
                    onClose={() => setShowRebaseDialog(false)}
                    onSuccess={() => {
                        setShowRebaseDialog(false);
                    }}
                />
            )}

            {showCherryPickDialog && (
                <CherryPickDialog
                    commits={getSelectedCommitObjects()}
                    onClose={() => setShowCherryPickDialog(false)}
                    onSuccess={() => {
                        setShowCherryPickDialog(false);
                    }}
                />
            )}
        </>
    );
}
