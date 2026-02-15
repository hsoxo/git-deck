import React, { useEffect, useRef, useState } from 'react';
import type { CommitNode, GraphNode, GraphEdge } from '@git-gui/shared';
import { graphLayoutEngine } from '../../services/GraphLayoutEngine';
import { CanvasRenderer } from '../../utils/CanvasRenderer';
import './CommitGraph.css';

interface CommitGraphProps {
    commits: CommitNode[];
    selectedHashes: string[];
    onCommitClick: (hash: string, multi: boolean) => void;
    onCommitDoubleClick: (hash: string) => void;
}

export const CommitGraph: React.FC<CommitGraphProps> = ({
    commits,
    selectedHashes,
    onCommitClick,
    onCommitDoubleClick,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<CanvasRenderer | null>(null);
    const [hoveredHash, setHoveredHash] = useState<string | null>(null);
    const [layout, setLayout] = useState<{
        nodes: Map<string, GraphNode>;
        edges: GraphEdge[];
        lanes: number;
        height: number;
    } | null>(null);

    // 计算布局
    useEffect(() => {
        if (commits.length === 0) {
            setLayout(null);
            return;
        }

        const newLayout = graphLayoutEngine.calculateLayout(commits);
        setLayout(newLayout);
    }, [commits]);

    // 初始化渲染器
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        rendererRef.current = new CanvasRenderer(canvasRef.current);

        const handleResize = () => {
            rendererRef.current?.resize();
            renderGraph();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            rendererRef.current?.destroy();
        };
    }, []);

    // 渲染图形
    const renderGraph = () => {
        if (!layout || !rendererRef.current) {
            return;
        }

        const selectedSet = new Set(selectedHashes);
        rendererRef.current.render(layout.nodes, layout.edges, selectedSet, hoveredHash);
    };

    // 当布局或选中状态改变时重新渲染
    useEffect(() => {
        renderGraph();
    }, [layout, selectedHashes, hoveredHash]);

    // 处理鼠标移动
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !rendererRef.current) {
            return;
        }

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = rendererRef.current.getNodeAtPosition(x, y, layout.nodes);
        setHoveredHash(node ? node.commit.hash : null);

        // 更新鼠标样式
        canvasRef.current!.style.cursor = node ? 'pointer' : 'default';
    };

    // 处理鼠标离开
    const handleMouseLeave = () => {
        setHoveredHash(null);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'default';
        }
    };

    // 处理点击
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !rendererRef.current) {
            return;
        }

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = rendererRef.current.getNodeAtPosition(x, y, layout.nodes);
        if (node) {
            onCommitClick(node.commit.hash, e.ctrlKey || e.metaKey);
        }
    };

    // 处理双击
    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!layout || !rendererRef.current) {
            return;
        }

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = rendererRef.current.getNodeAtPosition(x, y, layout.nodes);
        if (node) {
            onCommitDoubleClick(node.commit.hash);
        }
    };

    const config = graphLayoutEngine.getConfig();
    const width = layout ? (layout.lanes + 1) * config.columnWidth : 100;

    return (
        <div className="commit-graph">
            <canvas
                ref={canvasRef}
                className="commit-graph-canvas"
                style={{ width: `${width}px` }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            />
        </div>
    );
};
