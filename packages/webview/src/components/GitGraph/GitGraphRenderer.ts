import type { CommitNode } from '@git-gui/shared';

export interface GraphColumn {
    color: string;
    branch?: string;
}

export interface GraphCommit {
    commit: CommitNode;
    x: number; // 列位置
    columns: GraphColumn[]; // 当前行的所有列
    routes: Route[]; // 连接线
}

export interface Route {
    from: { x: number; y: number };
    to: { x: number; y: number };
    color: string;
}

const COLORS = [
    '#4285f4', // 蓝色
    '#ea4335', // 红色
    '#fbbc04', // 黄色
    '#34a853', // 绿色
    '#ff6d00', // 橙色
    '#46bdc6', // 青色
    '#7baaf7', // 浅蓝
    '#f07b72', // 浅红
    '#fdd663', // 浅黄
    '#81c995', // 浅绿
];

export class GitGraphRenderer {
    private columnWidth = 20;
    private rowHeight = 32;
    private dotRadius = 4;

    /**
     * 计算 git graph 的布局
     */
    public calculateLayout(commits: CommitNode[]): GraphCommit[] {
        const result: GraphCommit[] = [];
        const columns: Map<string, number> = new Map(); // hash -> column index
        const activeColumns: (string | null)[] = []; // column index -> hash or null

        for (let i = 0; i < commits.length; i++) {
            const commit = commits[i];
            const routes: Route[] = [];

            // 找到或分配列
            let columnIndex = columns.get(commit.hash);

            if (columnIndex === undefined) {
                // 新提交，找一个空列或创建新列
                columnIndex = activeColumns.findIndex(h => h === null);
                if (columnIndex === -1) {
                    columnIndex = activeColumns.length;
                    activeColumns.push(commit.hash);
                } else {
                    activeColumns[columnIndex] = commit.hash;
                }
                columns.set(commit.hash, columnIndex);
            }

            const currentY = i;
            const currentX = columnIndex;
            const color = COLORS[columnIndex % COLORS.length];

            // 处理父提交
            if (commit.parents && commit.parents.length > 0) {
                commit.parents.forEach((parentHash, idx) => {
                    let parentColumn: number = columns.get(parentHash) ?? -1;

                    if (parentColumn === -1) {
                        // 父提交还没有列，分配一个
                        if (idx === 0) {
                            // 第一个父提交继承当前列
                            parentColumn = columnIndex!;
                            columns.set(parentHash, parentColumn);
                            activeColumns[parentColumn] = parentHash;
                        } else {
                            // 其他父提交（合并）找新列
                            const newColumn = activeColumns.findIndex(h => h === null);
                            if (newColumn === -1) {
                                parentColumn = activeColumns.length;
                                activeColumns.push(parentHash);
                            } else {
                                parentColumn = newColumn;
                                activeColumns[parentColumn] = parentHash;
                            }
                            columns.set(parentHash, parentColumn);
                        }
                    }

                    // 添加连接线
                    routes.push({
                        from: { x: currentX, y: currentY },
                        to: { x: parentColumn, y: currentY + 1 },
                        color: idx === 0 ? color : COLORS[parentColumn % COLORS.length]
                    });
                });
            }

            // 清除当前列（如果没有父提交继承）
            if (!commit.parents || commit.parents.length === 0 ||
                columns.get(commit.parents[0]) !== columnIndex) {
                activeColumns[columnIndex] = null;
            }

            // 构建当前行的列信息
            const currentColumns: GraphColumn[] = activeColumns.map((hash, idx) => ({
                color: COLORS[idx % COLORS.length],
                branch: hash || undefined
            }));

            result.push({
                commit,
                x: currentX,
                columns: currentColumns,
                routes
            });
        }

        return result;
    }

    /**
     * 生成 SVG 路径
     */
    public generateSVGPath(route: Route): string {
        const fromX = route.from.x * this.columnWidth + this.columnWidth / 2;
        const fromY = route.from.y * this.rowHeight + this.rowHeight / 2;
        const toX = route.to.x * this.columnWidth + this.columnWidth / 2;
        const toY = route.to.y * this.rowHeight + this.rowHeight / 2;

        if (route.from.x === route.to.x) {
            // 直线
            return `M ${fromX} ${fromY} L ${toX} ${toY}`;
        } else {
            // 曲线
            const controlPointY = fromY + (toY - fromY) / 2;
            return `M ${fromX} ${fromY} C ${fromX} ${controlPointY}, ${toX} ${controlPointY}, ${toX} ${toY}`;
        }
    }

    public getColumnWidth(): number {
        return this.columnWidth;
    }

    public getRowHeight(): number {
        return this.rowHeight;
    }

    public getDotRadius(): number {
        return this.dotRadius;
    }
}
