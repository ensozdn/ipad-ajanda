import { useEffect, useRef } from 'react';
import { BackgroundType } from '../types';
import { drawBackground } from '../utils/canvasUtils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

export const useCanvasSetup = (
  initialData?: string,
  initialBackground?: BackgroundType,
  onInitialized?: () => void
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    const scale = window.devicePixelRatio || 2;
    const width = CANVAS_WIDTH * scale;
    const height = CANVAS_HEIGHT * scale;
    
    canvas.width = width;
    canvas.height = height;
    bgCanvas.width = width;
    bgCanvas.height = height;
    
    drawBackground(bgCtx, width, height, initialBackground || 'plain');
    
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        onInitialized?.();
      };
      img.src = initialData;
    } else {
      onInitialized?.();
    }
  }, [initialData, initialBackground]);

  return { canvasRef, backgroundCanvasRef };
};
