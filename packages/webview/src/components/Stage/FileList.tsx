import { useState } from 'react';
import { DiffViewer } from '../Diff/DiffViewer';
import './FileList.css';

interface FileListProps {
    files: string[];
    onAction: (files: string[]) => void;
    actionLabel: string;
    onDiscard?: (files: string[]) => void;
    staged?: boolean;
}

export function FileList({
    files,
    onAction,
    actionLabel,
    onDiscard,
    staged = false,
}: FileListProps) {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [diffFile, setDiffFile] = useState<string | null>(null);

    const handleFileClick = (file: string, event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey) {
            // Multi-select
            const newSelection = new Set(selectedFiles);
            if (newSelection.has(file)) {
                newSelection.delete(file);
            } else {
                newSelection.add(file);
            }
            setSelectedFiles(newSelection);
        } else {
            // Single select
            setSelectedFiles(new Set([file]));
        }
    };

    const handleFileDblClick = (file: string) => {
        setDiffFile(file);
    };

    const handleAction = (file: string) => {
        onAction([file]);
        setSelectedFiles(new Set());
    };

    const handleActionSelected = () => {
        if (selectedFiles.size > 0) {
            onAction(Array.from(selectedFiles));
            setSelectedFiles(new Set());
        }
    };

    const handleDiscard = (file: string) => {
        if (onDiscard) {
            onDiscard([file]);
            setSelectedFiles(new Set());
        }
    };

    const handleDiscardSelected = () => {
        if (onDiscard && selectedFiles.size > 0) {
            onDiscard(Array.from(selectedFiles));
            setSelectedFiles(new Set());
        }
    };

    if (files.length === 0) {
        return <div className="file-list-empty">No changes</div>;
    }

    return (
        <>
            <div className="file-list">
                {selectedFiles.size > 0 && (
                    <div className="file-list-actions">
                        <button onClick={handleActionSelected}>
                            {actionLabel} {selectedFiles.size} file(s)
                        </button>
                        {onDiscard && !staged && (
                            <button className="file-list-discard" onClick={handleDiscardSelected}>
                                Discard {selectedFiles.size} file(s)
                            </button>
                        )}
                    </div>
                )}
                <div className="file-list-items">
                    {files.map((file) => (
                        <div
                            key={file}
                            className={`file-item ${selectedFiles.has(file) ? 'selected' : ''}`}
                            onClick={(e) => handleFileClick(file, e)}
                            onDoubleClick={() => handleFileDblClick(file)}
                            title="Double-click to view diff"
                        >
                            <span className="file-name">{file}</span>
                            <div className="file-actions">
                                <button
                                    className="file-action"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(file);
                                    }}
                                >
                                    {actionLabel}
                                </button>
                                {onDiscard && !staged && (
                                    <button
                                        className="file-action file-action-discard"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDiscard(file);
                                        }}
                                    >
                                        Discard
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {diffFile && (
                <DiffViewer file={diffFile} staged={staged} onClose={() => setDiffFile(null)} />
            )}
        </>
    );
}
