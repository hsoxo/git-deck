import type { GraphNode, GraphEdge } from '@git-gui/shared';

/**
 * Canvas 渲染器
 * 负责在 Canvas 上绘制 commit 图
 */
export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;

    constructor(private canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = ctx;
        this.setupCanvas();
    }

    /**
     * 设置 Canvas
     */
    private setupCanvas(): void {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    }

    /**
     * 清空画布
     */
    clear(): void {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
    }

    /**
     * 渲染完整的图形
     */
    render(
        nodes: Map<string, GraphNode>,
        edges: GraphEdge[],
        selectedHashes: Set<string> = new Set(),
        hoveredHash: string | null = null
    ): void {
        this.clear();

        // 应用变换
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // 先绘制边
        for (const edge of edges) {
            this.drawEdge(edge);
        }

        // 再绘制节点
        for (const node of nodes.values()) {
            const isSelected = selectedHashes.has(node.commit.hash);
            const isHovered = node.commit.hash === hoveredHash;
            this.drawNode(node, isSelected, isHovered);
        }

        this.ctx.restore();
    }

    /**
     * 绘制连接线
     */
    private drawEdge(edge: GraphEdge): void {
        if (edge.path.length < 2) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.strokeStyle = edge.color;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 移动到起点
        this.ctx.moveTo(edge.path[0].x, edge.path[0].y);

        // 如果只有两个点，直接连线
        if (edge.path.length === 2) {
            this.ctx.lineTo(edge.path[1].x, edge.path[1].y);
        } else {
            // 使用贝塞尔曲线绘制平滑路径
            for (let i = 1; i < edge.path.length - 2; i += 2) {
                const cp1 = edge.path[i];
                const cp2 = edge.path[i + 1];
                const end = edge.path[i + 2] || edge.path[edge.path.length - 1];

                this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制节点
     */
    private drawNode(node: GraphNode, isSelected: boolean, isHovered: boolean): void {
        const radius = 5;

        // 绘制节点圆圈
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = node.color;
        this.ctx.fill();

        // 如果是 HEAD，绘制外圈
        if (node.commit.isHead) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = node.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // 如果被选中，绘制高亮圈
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#FFD700'; // Gold
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // 如果被悬停，绘制悬停效果
        if (isHovered) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius + 7, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // 绘制 refs 标签
        if (node.commit.refs.length > 0) {
            this.drawRefs(node);
        }
    }

    /**
     * 绘制 refs 标签
     */
    private drawRefs(node: GraphNode): void {
        const refs = node.commit.refs;
        let offsetX = node.x + 15;
        const y = node.y;

        for (const ref of refs) {
            // 确定标签颜色
            let bgColor = '#666';
            let textColor = '#fff';

            if (ref.includes('HEAD')) {
                bgColor = '#4285F4';
            } else if (ref.startsWith('tag:')) {
                bgColor = '#FBBC04';
                textColor = '#000';
            } else if (ref.includes('origin/')) {
                bgColor = '#EA4335';
            }

            // 绘制标签背景
            const text = ref.replace('tag: ', '');
            this.ctx.font = '11px sans-serif';
            const metrics = this.ctx.measureText(text);
            const padding = 4;
            const width = metrics.width + padding * 2;
            const height = 16;

            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(offsetX, y - height / 2, width, height);

            // 绘制标签文本
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text, offsetX + padding, y);

            offsetX += width + 5;
        }
    }

    /**
     * 设置缩放
     */
    setScale(scale: number): void {
        this.scale = Math.max(0.5, Math.min(2, scale));
    }

    /**
     * 设置偏移
     */
    setOffset(x: number, y: number): void {
        this.offsetX = x;
        this.offsetY = y;
    }

    /**
     * 获取鼠标位置对应的节点
     */
    getNodeAtPosition(x: number, y: number, nodes: Map<string, GraphNode>): GraphNode | null {
        // 转换坐标
        const transformedX = (x - this.offsetX) / this.scale;
        const transformedY = (y - this.offsetY) / this.scale;

        const radius = 5;

        for (const node of nodes.values()) {
            const dx = transformedX - node.x;
            const dy = transformedY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius + 5) {
                return node;
            }
        }

        return null;
    }

    /**
     * 调整 Canvas 大小
     */
    resize(): void {
        this.setupCanvas();
    }

    /**
     * 销毁渲染器
     */
    destroy(): void {
        // 清理资源
        this.clear();
    }
}
