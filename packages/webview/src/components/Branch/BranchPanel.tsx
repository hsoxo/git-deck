import React, { useState, useEffect } from 'react';
import { useGitStore } from '../../store/gitStore';
import './BranchPanel.css';

interface BranchItemProps {
    name: string;
    current: boolean;
    upstream?: string;
    ahead?: number;
    behind?: number;
    onCheckout: () => void;
    onDelete: () => void;
    onRename: () => void;
    onMerge: () => void;
}

const BranchItem: React.FC<BranchItemProps> = ({
    name,
    current,
    upstream,
    ahead,
    behind,
    onCheckout,
    onDelete,
    onRename,
    onMerge,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={`branch-item ${current ? 'current' : ''}`}>
            <div className="branch-info" onClick={onCheckout}>
                <span className="branch-icon">{current ? '📍' : '🌿'}</span>
                <span className="branch-name">{name}</span>
                {current && <span className="current-badge">HEAD</span>}
            </div>

            {upstream && (
                <div className="branch-tracking">
                    <span className="tracking-icon">🔗</span>
                    <span className="tracking-name">{upstream}</span>
                    {ahead !== undefined && ahead > 0 && <span className="ahead">↑{ahead}</span>}
                    {behind !== undefined && behind > 0 && (
                        <span className="behind">↓{behind}</span>
                    )}
                </div>
            )}

            <div className="branch-actions">
                <button
                    className="action-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                >
                    ⋮
                </button>

                {showMenu && (
                    <div className="branch-menu">
                        {!current && <button onClick={onCheckout}>Checkout</button>}
                        <button onClick={onMerge}>Merge into current</button>
                        <button onClick={onRename}>Rename</button>
                        {!current && (
                            <button onClick={onDelete} className="danger">
                                Delete
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const BranchPanel: React.FC = () => {
    const {
        branches,
        currentBranch,
        fetchBranches,
        createBranch,
        deleteBranch,
        renameBranch,
        checkoutBranch,
        mergeBranch,
    } = useGitStore();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [createFromCurrent, setCreateFromCurrent] = useState(true);
    const [startPoint, setStartPoint] = useState('');

    const [renameDialog, setRenameDialog] = useState<{
        show: boolean;
        oldName: string;
        newName: string;
    }>({ show: false, oldName: '', newName: '' });

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleCreateBranch = async () => {
        if (!newBranchName.trim()) {
            return;
        }

        try {
            await createBranch(newBranchName, createFromCurrent ? undefined : startPoint);
            setShowCreateDialog(false);
            setNewBranchName('');
            setStartPoint('');
        } catch (error) {
            console.error('Failed to create branch:', error);
        }
    };

    const handleDeleteBranch = async (name: string) => {
        if (
            !confirm(
                `Are you sure you want to delete branch '${name}'?\n\nThis action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await deleteBranch(name, false);
        } catch (error) {
            // Try force delete if normal delete fails
            if (confirm(`Branch '${name}' has unmerged changes.\n\nForce delete anyway?`)) {
                await deleteBranch(name, true);
            }
        }
    };

    const handleRenameBranch = async () => {
        if (!renameDialog.newName.trim()) {
            return;
        }

        try {
            await renameBranch(renameDialog.oldName, renameDialog.newName);
            setRenameDialog({ show: false, oldName: '', newName: '' });
        } catch (error) {
            console.error('Failed to rename branch:', error);
        }
    };

    const handleCheckoutBranch = async (name: string) => {
        if (name === currentBranch) {
            return;
        }

        try {
            await checkoutBranch(name);
        } catch (error) {
            console.error('Failed to checkout branch:', error);
        }
    };

    const handleMergeBranch = async (name: string) => {
        if (
            !confirm(
                `Merge branch '${name}' into '${currentBranch}'?\n\nThis will create a merge commit.`
            )
        ) {
            return;
        }

        try {
            await mergeBranch(name);
        } catch (error) {
            console.error('Failed to merge branch:', error);
        }
    };

    const localBranches = branches.filter((b) => !b.remote);
    const remoteBranches = branches.filter((b) => b.remote);

    return (
        <div className="branch-panel">
            <div className="branch-header">
                <h3>Branches</h3>
                <button className="create-branch-button" onClick={() => setShowCreateDialog(true)}>
                    + New Branch
                </button>
            </div>

            <div className="branch-list">
                <div className="branch-section">
                    <h4>Local Branches ({localBranches.length})</h4>
                    {localBranches.map((branch) => (
                        <BranchItem
                            key={branch.name}
                            name={branch.name}
                            current={branch.current}
                            onCheckout={() => handleCheckoutBranch(branch.name)}
                            onDelete={() => handleDeleteBranch(branch.name)}
                            onRename={() =>
                                setRenameDialog({
                                    show: true,
                                    oldName: branch.name,
                                    newName: branch.name,
                                })
                            }
                            onMerge={() => handleMergeBranch(branch.name)}
                        />
                    ))}
                </div>

                {remoteBranches.length > 0 && (
                    <div className="branch-section">
                        <h4>Remote Branches ({remoteBranches.length})</h4>
                        {remoteBranches.map((branch) => (
                            <BranchItem
                                key={branch.name}
                                name={branch.name}
                                current={false}
                                onCheckout={() => handleCheckoutBranch(branch.name)}
                                onDelete={() => {}}
                                onRename={() => {}}
                                onMerge={() => handleMergeBranch(branch.name)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showCreateDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Create New Branch</h3>

                        <div className="form-group">
                            <label>Branch Name</label>
                            <input
                                type="text"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                placeholder="feature/my-feature"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={createFromCurrent}
                                    onChange={(e) => setCreateFromCurrent(e.target.checked)}
                                />
                                Create from current branch ({currentBranch})
                            </label>
                        </div>

                        {!createFromCurrent && (
                            <div className="form-group">
                                <label>Start Point</label>
                                <input
                                    type="text"
                                    value={startPoint}
                                    onChange={(e) => setStartPoint(e.target.value)}
                                    placeholder="main"
                                />
                            </div>
                        )}

                        <div className="dialog-actions">
                            <button onClick={handleCreateBranch}>Create</button>
                            <button
                                onClick={() => {
                                    setShowCreateDialog(false);
                                    setNewBranchName('');
                                    setStartPoint('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {renameDialog.show && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Rename Branch</h3>

                        <div className="form-group">
                            <label>Old Name</label>
                            <input type="text" value={renameDialog.oldName} disabled />
                        </div>

                        <div className="form-group">
                            <label>New Name</label>
                            <input
                                type="text"
                                value={renameDialog.newName}
                                onChange={(e) =>
                                    setRenameDialog({
                                        ...renameDialog,
                                        newName: e.target.value,
                                    })
                                }
                                autoFocus
                            />
                        </div>

                        <div className="dialog-actions">
                            <button onClick={handleRenameBranch}>Rename</button>
                            <button
                                onClick={() =>
                                    setRenameDialog({
                                        show: false,
                                        oldName: '',
                                        newName: '',
                                    })
                                }
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
