import { memo, useEffect, useRef } from 'react';
import './GitGraphContextMenu.css';

export interface GitGraphContextMenuProps {
    x: number;
    y: number;
    onCherryPick: () => void;
    onRevert: () => void;
    onCreateBranch: () => void;
    onCopyHash: () => void;
    onClose: () => void;
}

export const GitGraphContextMenu = memo(function GitGraphContextMenu({
    x,
    y,
    onCherryPick,
    onRevert,
    onCreateBranch,
    onCopyHash,
    onClose,
}: GitGraphContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="git-graph-context-menu"
            style={{ left: `${x}px`, top: `${y}px` }}
        >
            <div className="context-menu-item" onClick={onCreateBranch}>
                Branch Here
            </div>
            <div className="context-menu-item" onClick={onCherryPick}>
                Cherry-pick
            </div>
            <div className="context-menu-item" onClick={onRevert}>
                Revert
            </div>
            <div className="context-menu-item" onClick={onCopyHash}>
                Copy Hash
            </div>
        </div>
    );
});
