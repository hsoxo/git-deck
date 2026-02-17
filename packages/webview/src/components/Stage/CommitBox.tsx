import { useState, useEffect, useRef } from 'react';
import { useGitStore } from '../../store/gitStore';
import './CommitBox.css';

export function CommitBox() {
    const [message, setMessage] = useState('');
    const [isAmend, setIsAmend] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { status, commit, amendCommit, commits } = useGitStore();

    useEffect(() => {
        if (isAmend && commits.length > 0) {
            setMessage(commits[0].message);
        } else if (!isAmend) {
            setMessage('');
        }
    }, [isAmend, commits]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleCommit = async () => {
        if (message.trim()) {
            if (isAmend) {
                await amendCommit(message);
            } else {
                if (status && status.staged.length > 0) {
                    await commit(message);
                }
            }
            setMessage('');
            setIsAmend(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleCommit();
        }
    };

    const canCommit =
        message.trim().length > 0 && (isAmend || (status && status.staged.length > 0));

    return (
        <div className="commit-box">
            <div className="commit-header">
                <h3>Commit Message</h3>
                <div className="commit-options">
                    <label className="commit-amend-label">
                        <input
                            type="checkbox"
                            checked={isAmend}
                            onChange={(e) => setIsAmend(e.target.checked)}
                            disabled={commits.length === 0}
                        />
                        <span>Amend last commit</span>
                    </label>
                    <span className="commit-hint">Ctrl+Enter to commit</span>
                </div>
            </div>
            <textarea
                className="commit-message"
                placeholder={isAmend ? 'Edit commit message...' : 'Enter commit message...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
            />
            <div className="commit-footer">
                <span className="commit-info">
                    {isAmend
                        ? 'Amending last commit'
                        : `${status?.staged.length || 0} file(s) staged`}
                </span>
                <div className="commit-button-group">
                    <button className="commit-button" onClick={handleCommit} disabled={!canCommit}>
                        {isAmend ? 'Amend Commit' : 'Commit'}
                    </button>
                    <div className="commit-menu-container" ref={menuRef}>
                        <button
                            className="commit-menu-button"
                            onClick={() => setShowMenu(!showMenu)}
                            disabled={!canCommit}
                            aria-label="Commit options"
                        >
                            ▼
                        </button>
                        {showMenu && (
                            <div className="commit-dropdown-menu">
                                <div
                                    className="commit-menu-item"
                                    onClick={() => {
                                        handleCommit();
                                        setShowMenu(false);
                                    }}
                                >
                                    Commit
                                </div>
                                <div
                                    className="commit-menu-item"
                                    onClick={() => {
                                        setIsAmend(true);
                                        setShowMenu(false);
                                    }}
                                >
                                    Commit & Amend
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
