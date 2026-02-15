import type { CommitNode, GraphNode, GraphEdge, Point } from '@git-gui/shared';

/**
 * 图形布局引擎
 * 计算 commit 图的布局，包括节点位置和连接线路径
 */
export class GraphLayoutEngine {
    private readonly ROW_HEIGHT = 50; // 每行高度
    private readonly COLUMN_WIDTH = 30; // 每列宽度
    private readonly NODE_RADIUS = 5; // 节点半径

    private colors = [
        '#4285F4', // Blue
        '#EA4335', // Red
        '#FBBC04', // Yellow
        '#34A853', // Green
        '#FF6D00', // Orange
        '#9C27B0', // Purple
        '#00BCD4', // Cyan
        '#E91E63', // Pink
    ];

    /**
     * 计算完整的图形布局
     */
    calculateLayout(commits: CommitNode[]): {
        nodes: Map<string, GraphNode>;
        edges: GraphEdge[];
        lanes: number;
        height: number;
    } {
        if (commits.length === 0) {
            return { nodes: new Map(), edges: [], lanes: 0, height: 0 };
        }

        // 构建父子关系图
        const childrenMap = this.buildChildrenMap(commits);

        // 分配泳道
        const laneAssignments = this.assignLanes(commits, childrenMap);

        // 计算节点位置
        const nodes = this.calculateNodePositions(commits, laneAssignments);

        // 计算连接线
        const edges = this.calculateEdges(commits, nodes);

        // 计算总泳道数和高度
        const lanes = Math.max(...Array.from(laneAssignments.values())) + 1;
        const height = commits.length * this.ROW_HEIGHT;

        return { nodes, edges, lanes, height };
    }

    /**
     * 构建父子关系映射
     */
    private buildChildrenMap(commits: CommitNode[]): Map<string, CommitNode[]> {
        const childrenMap = new Map<string, CommitNode[]>();

        for (const commit of commits) {
            for (const parent of commit.parents) {
                if (!childrenMap.has(parent)) {
                    childrenMap.set(parent, []);
                }
                childrenMap.get(parent)!.push(commit);
            }
        }

        return childrenMap;
    }

    /**
     * 为每个 commit 分配泳道
     * 使用贪心算法，尽量复用泳道
     */
    private assignLanes(
        commits: CommitNode[],
        childrenMap: Map<string, CommitNode[]>
    ): Map<string, number> {
        const laneAssignments = new Map<string, number>();
        const activeLanes = new Map<number, string>(); // lane -> commit hash
        let nextLane = 0;

        for (let i = 0; i < commits.length; i++) {
            const commit = commits[i];

            // 尝试复用父节点的泳道
            let assignedLane: number | null = null;

            if (commit.parents.length > 0) {
                const firstParent = commit.parents[0];
                const parentLane = laneAssignments.get(firstParent);

                if (parentLane !== undefined && !activeLanes.has(parentLane)) {
                    assignedLane = parentLane;
                }
            }

            // 如果无法复用，分配新泳道
            if (assignedLane === null) {
                // 查找第一个空闲的泳道
                assignedLane = 0;
                while (activeLanes.has(assignedLane)) {
                    assignedLane++;
                }
                nextLane = Math.max(nextLane, assignedLane + 1);
            }

            laneAssignments.set(commit.hash, assignedLane);
            activeLanes.set(assignedLane, commit.hash);

            // 清理不再活跃的泳道
            // 如果一个 commit 没有子节点，或者所有子节点都已处理，则释放其泳道
            const children = childrenMap.get(commit.hash) || [];
            const allChildrenProcessed = children.every((child) => laneAssignments.has(child.hash));

            if (children.length === 0 || allChildrenProcessed) {
                // 检查是否有其他 commit 在使用这个泳道
                const laneCommit = activeLanes.get(assignedLane);
                if (laneCommit === commit.hash) {
                    activeLanes.delete(assignedLane);
                }
            }
        }

        return laneAssignments;
    }

    /**
     * 计算节点位置
     */
    private calculateNodePositions(
        commits: CommitNode[],
        laneAssignments: Map<string, number>
    ): Map<string, GraphNode> {
        const nodes = new Map<string, GraphNode>();

        commits.forEach((commit, index) => {
            const lane = laneAssignments.get(commit.hash) || 0;
            const color = this.colors[lane % this.colors.length];

            nodes.set(commit.hash, {
                commit,
                x: lane * this.COLUMN_WIDTH + this.COLUMN_WIDTH / 2,
                y: index * this.ROW_HEIGHT + this.ROW_HEIGHT / 2,
                color,
                lane,
            });
        });

        return nodes;
    }

    /**
     * 计算连接线路径
     */
    private calculateEdges(commits: CommitNode[], nodes: Map<string, GraphNode>): GraphEdge[] {
        const edges: GraphEdge[] = [];

        for (const commit of commits) {
            const fromNode = nodes.get(commit.hash);
            if (!fromNode) {
                continue;
            }

            for (const parentHash of commit.parents) {
                const toNode = nodes.get(parentHash);
                if (!toNode) {
                    continue;
                }

                // 计算路径
                const path = this.calculateEdgePath(fromNode, toNode);

                edges.push({
                    from: commit.hash,
                    to: parentHash,
                    path,
                    color: fromNode.color,
                });
            }
        }

        return edges;
    }

    /**
     * 计算两个节点之间的连接线路径
     */
    private calculateEdgePath(from: GraphNode, to: GraphNode): Point[] {
        const path: Point[] = [];

        // 起点
        path.push({ x: from.x, y: from.y });

        // 如果在同一列，直接连接
        if (from.x === to.x) {
            path.push({ x: to.x, y: to.y });
            return path;
        }

        // 如果在不同列，使用贝塞尔曲线
        const midY = (from.y + to.y) / 2;

        // 添加控制点以创建平滑曲线
        path.push({ x: from.x, y: midY });
        path.push({ x: to.x, y: midY });
        path.push({ x: to.x, y: to.y });

        return path;
    }

    /**
     * 获取节点颜色
     */
    getColor(lane: number): string {
        return this.colors[lane % this.colors.length];
    }

    /**
     * 获取布局配置
     */
    getConfig() {
        return {
            rowHeight: this.ROW_HEIGHT,
            columnWidth: this.COLUMN_WIDTH,
            nodeRadius: this.NODE_RADIUS,
            colors: this.colors,
        };
    }
}

export const graphLayoutEngine = new GraphLayoutEngine();
