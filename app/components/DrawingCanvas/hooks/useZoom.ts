import { useState, useEffect, useRef } from 'react';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY } from '../utils/constants';

export const useZoom = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialScale = 1;
    let initialDistance = 0;
    let isZooming = false;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isZooming = true;
        initialScale = scale;
        initialDistance = getDistance(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isZooming) {
        e.preventDefault();
        
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const distanceChange = currentDistance - initialDistance;
        const scaleChange = distanceChange * ZOOM_SENSITIVITY;
        const newScale = initialScale + scaleChange;
        const clampedScale = Math.min(Math.max(MIN_ZOOM, newScale), MAX_ZOOM);
        
        setScale(clampedScale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isZooming = false;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, scale]);

  const resetZoom = () => setScale(1);

  return { scale, resetZoom };
};
