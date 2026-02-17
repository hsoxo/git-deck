import { useState, useEffect, useCallback } from 'react';
import type { CommitNode, BranchInfo } from '@git-gui/shared';
import type { GitGraphViewProps } from './GitGraphView';
import { getVsCodeApi } from '../../utils/vscodeApi';

interface ContextMenuState {
    x: number;
    y: number;
    hash: string;
}

export function useGitGraphLogic(props: GitGraphViewProps) {
    const [commits, setCommits] = useState<CommitNode[]>([]);
    const [branches, setBranches] = useState<BranchInfo[]>([]);
    const [currentBranch, setCurrentBranch] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // 获取 VS Code API (safely, only once)
    const vscode = getVsCodeApi();

    // 加载数据
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 发送消息到扩展请求数据
            vscode?.postMessage({ type: 'getGraphData' });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setLoading(false);
        }
    }, [vscode]);

    // 监听来自扩展的消息
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;

            switch (message.type) {
                case 'graphData':
                    setCommits(message.commits || []);
                    setBranches(message.branches || []);
                    setCurrentBranch(message.currentBranch || null);
                    setSelectedBranch(message.currentBranch || '');
                    setLoading(false);
                    break;

                case 'error':
                    setError(message.message);
                    setLoading(false);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // 初始加载
        loadData();

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [loadData]);

    const handleRefresh = useCallback(() => {
        loadData();
        props.onRefresh?.();
    }, [loadData, props]);

    const handleBranchChange = useCallback((branch: string) => {
        setSelectedBranch(branch);
    }, []);

    const handleCheckout = useCallback(() => {
        if (selectedBranch) {
            vscode?.postMessage({ type: 'checkout', branch: selectedBranch });
            props.onCheckout?.(selectedBranch);
        }
    }, [selectedBranch, vscode, props]);

    const handleMerge = useCallback(() => {
        if (selectedBranch) {
            vscode?.postMessage({ type: 'merge', branch: selectedBranch });
            props.onMerge?.(selectedBranch);
        }
    }, [selectedBranch, vscode, props]);

    const handleRebase = useCallback(() => {
        if (selectedBranch) {
            vscode?.postMessage({ type: 'rebase', branch: selectedBranch });
            props.onRebase?.(selectedBranch);
        }
    }, [selectedBranch, vscode, props]);

    const handleContextMenu = useCallback((e: React.MouseEvent, hash: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            hash,
        });
    }, []);

    const handleCherryPick = useCallback((hash: string) => {
        vscode?.postMessage({ type: 'cherryPick', commits: [hash] });
        props.onCherryPick?.([hash]);
        setContextMenu(null);
    }, [vscode, props]);

    const handleRevert = useCallback((hash: string) => {
        vscode?.postMessage({ type: 'revert', commit: hash });
        props.onRevert?.(hash);
        setContextMenu(null);
    }, [vscode, props]);

    const handleCopyHash = useCallback((hash: string) => {
        navigator.clipboard.writeText(hash);
        props.onCopyHash?.(hash);
        setContextMenu(null);
    }, [props]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    return {
        commits,
        branches,
        currentBranch,
        selectedBranch,
        loading,
        error,
        contextMenu,
        handleRefresh,
        handleBranchChange,
        handleCheckout,
        handleMerge,
        handleRebase,
        handleContextMenu,
        handleCherryPick,
        handleRevert,
        handleCopyHash,
        closeContextMenu,
    };
}
