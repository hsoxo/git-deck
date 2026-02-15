import React, { useState, useCallback } from 'react';
import './SearchBar.css';

interface SearchBarProps {
    onSearch: (query: string, type: 'message' | 'author' | 'hash') => void;
    onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear }) => {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<'message' | 'author' | 'hash'>('message');

    const handleSearch = useCallback(() => {
        if (query.trim()) {
            onSearch(query.trim(), searchType);
        }
    }, [query, searchType, onSearch]);

    const handleClear = useCallback(() => {
        setQuery('');
        onClear();
    }, [onClear]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            handleClear();
        }
    };

    return (
        <div className="search-bar">
            <div className="search-input-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder={`Search by ${searchType}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {query && (
                    <button className="clear-button" onClick={handleClear} title="Clear search">
                        ×
                    </button>
                )}
            </div>

            <select
                className="search-type-select"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
            >
                <option value="message">Message</option>
                <option value="author">Author</option>
                <option value="hash">Hash</option>
            </select>

            <button className="search-button" onClick={handleSearch} disabled={!query.trim()}>
                Search
            </button>
        </div>
    );
};
