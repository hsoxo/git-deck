import { memo, useCallback } from 'react';
import type { GraphCommit } from './GitGraphRenderer';
import './GitGraphCommitRow.css';

export interface GitGraphCommitRowProps {
    graphCommit: GraphCommit;
    currentBranch: string | null;
    onContextMenu: (e: React.MouseEvent, hash: string) => void;
    style?: React.CSSProperties;
    columnWidth: number;
    rowHeight: number;
    dotRadius: number;
}

export const GitGraphCommitRow = memo(function GitGraphCommitRow({
    graphCommit,
    currentBranch,
    onContextMenu,
    style,
    columnWidth,
    rowHeight,
    dotRadius,
}: GitGraphCommitRowProps) {
    const { commit, x, columns } = graphCommit;

    // 解析 refs 为分支和标签
    const branches: string[] = [];
    const tags: string[] = [];

    commit.refs?.forEach(ref => {
        if (ref.includes('tag:')) {
            // 提取标签名
            const tagName = ref.replace('tag:', '').trim();
            tags.push(tagName);
        } else {
            // 分支引用
            branches.push(ref);
        }
    });

    const isCurrentBranch = branches.some(b =>
        b.includes(`HEAD -> ${currentBranch}`) ||
        b === currentBranch
    );

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        onContextMenu(e, commit.hash);
    }, [onContextMenu, commit.hash]);

    // 计算 SVG 宽度
    const svgWidth = Math.max(columns.length * columnWidth, (x + 1) * columnWidth);
    const dotX = x * columnWidth + columnWidth / 2;
    const dotY = rowHeight / 2;
    const dotColor = columns[x]?.color || '#4285f4';

    return (
        <div
            className={`git-graph-commit-row ${isCurrentBranch ? 'current-branch' : ''}`}
            data-hash={commit.hash}
            onContextMenu={handleContextMenu}
            style={style}
        >
            <div className="graph-column">
                <svg
                    width={svgWidth}
                    height={rowHeight}
                    style={{ display: 'block' }}
                >
                    {/* 绘制所有列的线条 */}
                    {columns.map((col, idx) => {
                        if (!col.branch) return null;
                        const lineX = idx * columnWidth + columnWidth / 2;
                        return (
                            <line
                                key={`col-${idx}`}
                                x1={lineX}
                                y1={0}
                                x2={lineX}
                                y2={rowHeight}
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
                </svg>
            </div>

            <div className="commit-info">
                <div className="commit-refs">
                    {/* 显示分支 */}
                    {branches.map((ref, index) => {
                        const isRemote = ref.includes('origin/') || ref.includes('remotes/');
                        const displayName = ref
                            .replace('HEAD -> ', '')
                            .replace('origin/', '')
                            .replace('remotes/', '')
                            .trim();
                        const isCurrent = ref.includes(`HEAD -> ${currentBranch}`) || ref === currentBranch;
                        const labelClass = isCurrent ? 'current' : (isRemote ? 'remote' : 'local');

                        return (
                            <span
                                key={`branch-${index}`}
                                className={`branch-label ${labelClass}`}
                                title={ref}
                            >
                                {displayName}
                            </span>
                        );
                    })}

                    {/* 显示标签 */}
                    {tags.map((tag, index) => (
                        <span
                            key={`tag-${index}`}
                            className="tag-label"
                            title={`tag: ${tag}`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <span className="commit-message" title={commit.message}>
                    {commit.message}
                </span>

                <span className="commit-hash">
                    {commit.hash.substring(0, 7)}
                </span>

                <span className="commit-author">
                    {commit.author_name || commit.author}
                </span>

                <span className="commit-date">
                    {new Date(commit.date).toLocaleString()}
                </span>
            </div>
        </div>
    );
});
