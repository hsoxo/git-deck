import React, { useRef, useEffect, useState, useCallback } from 'react';
import './VirtualScroll.css';

interface VirtualScrollProps {
    itemCount: number;
    itemHeight: number;
    height: number;
    overscan?: number;
    children: (startIndex: number, endIndex: number) => React.ReactNode;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

/**
 * 虚拟滚动组件
 * 只渲染可见区域的元素，提高大列表性能
 */
export const VirtualScroll: React.FC<VirtualScrollProps> = ({
    itemCount,
    itemHeight,
    height,
    overscan = 5,
    children,
    onLoadMore,
    hasMore = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // 计算可见范围
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + height) / itemHeight);

    // 添加 overscan 以提供平滑滚动
    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(itemCount, visibleEnd + overscan);

    // 总高度
    const totalHeight = itemCount * itemHeight;

    // 偏移量
    const offsetY = startIndex * itemHeight;

    // 处理滚动
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.currentTarget;
            setScrollTop(target.scrollTop);

            // 检查是否需要加载更多
            if (onLoadMore && hasMore) {
                const scrollBottom = target.scrollTop + target.clientHeight;
                const threshold = totalHeight - itemHeight * 10; // 距离底部10个元素时加载

                if (scrollBottom >= threshold) {
                    onLoadMore();
                }
            }
        },
        [onLoadMore, hasMore, totalHeight, itemHeight]
    );

    // 滚动到指定索引
    const scrollToIndex = useCallback(
        (index: number, behavior: ScrollBehavior = 'smooth') => {
            if (containerRef.current) {
                const scrollTop = index * itemHeight;
                containerRef.current.scrollTo({
                    top: scrollTop,
                    behavior,
                });
            }
        },
        [itemHeight]
    );

    // 暴露 scrollToIndex 方法
    useEffect(() => {
        if (containerRef.current) {
            (containerRef.current as any).scrollToIndex = scrollToIndex;
        }
    }, [scrollToIndex]);

    return (
        <div
            ref={containerRef}
            className="virtual-scroll-container"
            style={{ height: `${height}px`, overflow: 'auto' }}
            onScroll={handleScroll}
        >
            <div className="virtual-scroll-spacer" style={{ height: `${totalHeight}px` }}>
                <div
                    className="virtual-scroll-content"
                    style={{ transform: `translateY(${offsetY}px)` }}
                >
                    {children(startIndex, endIndex)}
                </div>
            </div>
        </div>
    );
};
