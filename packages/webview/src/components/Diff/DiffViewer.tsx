import { useState, useEffect } from 'react';
import { useGitStore } from '../../store/gitStore';
import './DiffViewer.css';

interface DiffViewerProps {
    file: string;
    staged?: boolean;
    onClose: () => void;
}

export function DiffViewer({ file, staged = false, onClose }: DiffViewerProps) {
    const [diff, setDiff] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { getFileDiff } = useGitStore();

    useEffect(() => {
        loadDiff();
    }, [file, staged]);

    const loadDiff = async () => {
        setLoading(true);
        const result = await getFileDiff(file, staged);
        setDiff(result);
        setLoading(false);
    };

    const parseDiff = (diffText: string) => {
        const lines = diffText.split('\n');
        return lines.map((line, index) => {
            let className = 'diff-line';
            if (line.startsWith('+') && !line.startsWith('+++')) {
                className += ' diff-addition';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                className += ' diff-deletion';
            } else if (line.startsWith('@@')) {
                className += ' diff-hunk';
            }
            return (
                <div key={index} className={className}>
                    {line || ' '}
                </div>
            );
        });
    };

    return (
        <div className="diff-viewer-overlay" onClick={onClose}>
            <div className="diff-viewer" onClick={(e) => e.stopPropagation()}>
                <div className="diff-viewer-header">
                    <h3>{file}</h3>
                    <span className="diff-viewer-badge">{staged ? 'Staged' : 'Unstaged'}</span>
                    <button className="diff-viewer-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="diff-viewer-content">
                    {loading ? (
                        <div className="diff-viewer-loading">Loading diff...</div>
                    ) : diff ? (
                        <pre className="diff-viewer-pre">{parseDiff(diff)}</pre>
                    ) : (
                        <div className="diff-viewer-empty">No changes</div>
                    )}
                </div>
            </div>
        </div>
    );
}
