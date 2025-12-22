import { useState, useCallback } from 'react';
import { ToolType, LineStyleType, Point } from '../types';
import { drawShape, getCoordinates, isApplePencil } from '../utils/canvasUtils';

export const useDrawingTools = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onSaveHistory: () => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [fillShape, setFillShape] = useState(false);
  const [lineStyle, setLineStyle] = useState<LineStyleType>('solid');
  
  // Şekil çizimi için
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<ImageData | null>(null);

  const startDrawing = useCallback((
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { started: false, x: 0, y: 0 };

    // Touch event ve birden fazla parmak varsa çizme
    if ('touches' in e && e.touches.length > 1) {
      return { started: false, x: 0, y: 0 };
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return { started: false, x: 0, y: 0 };

    // Apple Pencil kontrolü
    if ('touches' in e) {
      if (!isApplePencil(e)) {
        return { started: false, x: 0, y: 0 };
      }
      e.preventDefault();
    }

    const { x, y, pressure } = getCoordinates(e, canvas);

    setIsDrawing(true);

    // Şekil araçları için başlangıç noktasını kaydet
    const isShapeTool = ['line', 'rectangle', 'circle', 'arrow'].includes(tool);
    if (isShapeTool) {
      setStartPoint({ x, y });
      setCurrentShape(ctx.getImageData(0, 0, canvas.width, canvas.height));
      return { started: true, x, y };
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = lineWidth * 4;
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = lineWidth * 5;
    } else if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = lineWidth * 0.5;
    } else if (tool === 'crayon') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * (pressure > 0 ? pressure * 2 : 1);
    }

    return { started: true, x, y };
  }, [canvasRef, tool, color, lineWidth]);

  const draw = useCallback((
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Touch event ve birden fazla parmak varsa çizme
    if ('touches' in e && e.touches.length > 1) {
      setIsDrawing(false);
      return;
    }

    if ('touches' in e) {
      e.preventDefault();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, pressure } = getCoordinates(e, canvas);

    // Şekil araçları için önizleme
    const isShapeTool = ['line', 'rectangle', 'circle', 'arrow'].includes(tool);
    if (isShapeTool && startPoint && currentShape) {
      ctx.putImageData(currentShape, 0, 0);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      drawShape(ctx, tool, startPoint.x, startPoint.y, x, y, color, fillShape, lineStyle);
      return;
    }

    // Apple Pencil basınç desteği
    if (tool === 'pen') {
      ctx.lineWidth = lineWidth * (pressure > 0 ? pressure * 2 : 1);
    } else if (tool === 'highlighter') {
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = lineWidth * 4;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, canvasRef, tool, color, lineWidth, startPoint, currentShape, fillShape, lineStyle]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentShape(null);
      onSaveHistory();
      return true;
    }
    return false;
  }, [isDrawing, onSaveHistory]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSaveHistory();
  }, [canvasRef, onSaveHistory]);

  return {
    isDrawing,
    tool,
    setTool,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    fillShape,
    setFillShape,
    lineStyle,
    setLineStyle,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas
  };
};
