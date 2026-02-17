import { memo, useMemo } from 'react';
import type { CommitNode } from '@git-gui/shared';
import { GitGraphCommitRow } from './GitGraphCommitRow';
import { GitGraphRenderer } from './GitGraphRenderer';
import './GitGraphCommitList.css';

export interface GitGraphCommitListProps {
    commits: CommitNode[];
    currentBranch: string | null;
    onContextMenu: (e: React.MouseEvent, hash: string) => void;
}

export const GitGraphCommitList = memo(function GitGraphCommitList({
    commits,
    currentBranch,
    onContextMenu,
}: GitGraphCommitListProps) {
    const renderer = useMemo(() => new GitGraphRenderer(), []);
    const graphCommits = useMemo(() => renderer.calculateLayout(commits), [renderer, commits]);

    const columnWidth = renderer.getColumnWidth();
    const rowHeight = renderer.getRowHeight();
    const dotRadius = renderer.getDotRadius();

    // 计算 SVG 总尺寸
    const maxColumns = Math.max(...graphCommits.map(gc => gc.columns.length), 1);
    const svgWidth = maxColumns * columnWidth;
    const svgHeight = graphCommits.length * rowHeight;

    return (
        <div className="git-graph-commit-list">
            {/* 左侧：SVG 图形层 */}
            <div className="git-graph-svg-container" style={{ width: svgWidth }}>
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    style={{ display: 'block' }}
                >
                    {graphCommits.map((graphCommit, index) => {
                        const y = index * rowHeight;
                        const dotX = graphCommit.x * columnWidth + columnWidth / 2;
                        const dotY = y + rowHeight / 2;
                        const dotColor = graphCommit.columns[graphCommit.x]?.color || '#4285f4';

                        return (
                            <g key={graphCommit.commit.hash}>
                                {/* 绘制所有列的线条 */}
                                {graphCommit.columns.map((col, idx) => {
                                    if (!col.branch) return null;
                                    const lineX = idx * columnWidth + columnWidth / 2;
                                    return (
                                        <line
                                            key={`line-${index}-${idx}`}
                                            x1={lineX}
                                            y1={y + rowHeight / 2}
                                            x2={lineX}
                                            y2={y + rowHeight + rowHeight / 2}
                                            stroke={col.color}
                                            strokeWidth="2"
                                        />
                                    );
                                })}

                                {/* 绘制提交点 */}
                                <circle
                                    cx={dotX}
                                    cy={dotY}
                                    r={dotRadius}
                                    fill={dotColor}
                                    stroke={dotColor}
                                    strokeWidth="2"
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* 右侧：提交信息列表 */}
            <div className="git-graph-info-container">
                {graphCommits.map((graphCommit) => (
                    <GitGraphCommitRow
                        key={graphCommit.commit.hash}
                        graphCommit={graphCommit}
                        currentBranch={currentBranch}
                        onContextMenu={onContextMenu}
                        rowHeight={rowHeight}
                    />
                ))}
            </div>
        </div>
    );
});
