import React, { useState, useEffect, useRef, useCallback } from 'react';

type Orientation = 'vertical' | 'horizontal';

export const useCustomScrollbar = (orientation: Orientation = 'vertical', dependency?: any) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollPos, setScrollPos] = useState(0);
    const [scrollSize, setScrollSize] = useState(0);
    const [clientSize, setClientSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState(0);
    const [startScrollPos, setStartScrollPos] = useState(0);

    const updateScrollDimensions = useCallback(() => {
        if (scrollContainerRef.current) {
            if (orientation === 'vertical') {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                setScrollPos(scrollTop);
                setScrollSize(scrollHeight);
                setClientSize(clientHeight);
            } else {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
                setScrollPos(scrollLeft);
                setScrollSize(scrollWidth);
                setClientSize(clientWidth);
            }
        }
    }, [orientation]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            updateScrollDimensions();
        });

        resizeObserver.observe(container);
        Array.from(container.children).forEach(child => resizeObserver.observe(child as Element));

        return () => resizeObserver.disconnect();
    }, [updateScrollDimensions, dependency]);

    const handleScroll = () => {
        updateScrollDimensions();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos(orientation === 'vertical' ? e.pageY : e.pageX);
        setStartScrollPos(scrollPos);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !scrollContainerRef.current) return;

            const currentPos = orientation === 'vertical' ? e.pageY : e.pageX;
            const delta = currentPos - startPos;
            const scrollRatio = scrollSize / clientSize;
            const newScrollPos = startScrollPos + delta * scrollRatio;

            if (orientation === 'vertical') {
                scrollContainerRef.current.scrollTop = newScrollPos;
            } else {
                scrollContainerRef.current.scrollLeft = newScrollPos;
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startPos, startScrollPos, scrollSize, clientSize, orientation]);

    const rawThumbSize = (clientSize / scrollSize) * 100;
    // Minimum size 5% or dynamic calculation if needed (Editor used dynamic)
    // Let's stick to a safe minimum for now, or allow passing min size logic?
    // Editor logic: Math.max(rawThumbWidth, (20 / clientWidth) * 100 * (scrollWidth / clientWidth))
    // Simplified: Math.max(rawThumbSize, 5) is usually good enough.
    const effectiveThumbSize = Math.max(rawThumbSize, 5);

    const thumbOffset = (scrollPos / (scrollSize - clientSize)) * (100 - effectiveThumbSize);
    const showScrollbar = scrollSize > clientSize + 1;

    return {
        scrollContainerRef,
        handleScroll,
        handleMouseDown,
        thumbSize: effectiveThumbSize,
        thumbOffset,
        showScrollbar,
        isDragging
    };
};
