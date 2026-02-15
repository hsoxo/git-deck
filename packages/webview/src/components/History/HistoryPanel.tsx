import { useEffect, useState } from 'react';
import { useGitStore } from '../../store/gitStore';
import { CommitList } from './CommitList';
import { CommitGraph } from './CommitGraph';
import { CommitDetails } from './CommitDetails';
import { SearchBar } from './SearchBar';
import { VirtualScroll } from './VirtualScroll';
import type { CommitNode } from '@git-gui/shared';
import './HistoryPanel.css';

export function HistoryPanel() {
    const {
        commits,
        branches,
        status,
        loading,
        selectedCommits,
        hasMore,
        searchQuery,
        fetchHistory,
        fetchBranches,
        selectCommit,
        searchCommits,
        clearSearch,
        loadMore,
    } = useGitStore();

    const [selectedCommit, setSelectedCommit] = useState<CommitNode | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // 加载历史记录
    useEffect(() => {
        fetchHistory({ maxCount: 100 });
        fetchBranches();
    }, [fetchHistory, fetchBranches]);

    const handleCommitClick = (hash: string, multi: boolean) => {
        selectCommit(hash, multi);

        // 单选时更新详情面板
        if (!multi) {
            const commit = commits.find((c) => c.hash === hash);
            if (commit) {
                setSelectedCommit(commit);
                setShowDetails(true);
            }
        }
    };

    const handleCommitDoubleClick = (hash: string) => {
        const commit = commits.find((c) => c.hash === hash);
        if (commit) {
            setSelectedCommit(commit);
            setShowDetails(true);
        }
    };

    const handleSearch = (query: string, type: 'message' | 'author' | 'hash') => {
        searchCommits(query, type);
    };

    const handleClearSearch = () => {
        clearSearch();
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
    };

    return (
        <div className="history-panel">
            <div className="history-header">
                <h3>Commit History</h3>
                <span className="commit-count">
                    {commits.length} commits
                    {searchQuery && ' (filtered)'}
                </span>
            </div>

            <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

            <div className="history-content">
                <div className="history-main">
                    <CommitGraph
                        commits={commits}
                        selectedHashes={selectedCommits}
                        onCommitClick={handleCommitClick}
                        onCommitDoubleClick={handleCommitDoubleClick}
                    />
                    <div className="commit-list-container">
                        <VirtualScroll
                            itemCount={commits.length}
                            itemHeight={50}
                            height={600}
                            overscan={10}
                            onLoadMore={loadMore}
                            hasMore={hasMore && !searchQuery}
                        >
                            {(startIndex, endIndex) => (
                                <CommitList
                                    commits={commits.slice(startIndex, endIndex)}
                                    branches={branches}
                                    currentBranch={status?.current || 'main'}
                                    startIndex={startIndex}
                                />
                            )}
                        </VirtualScroll>
                        {loading && (
                            <div className="loading-indicator">Loading more commits...</div>
                        )}
                    </div>
                </div>

                {showDetails && (
                    <CommitDetails commit={selectedCommit} onClose={handleCloseDetails} />
                )}
            </div>
        </div>
    );
}
