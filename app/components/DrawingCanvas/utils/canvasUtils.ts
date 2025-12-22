import { BackgroundType, LineStyleType } from '../types';

export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: BackgroundType
) => {
  // Beyaz arka plan
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (background === 'lined') {
    // Çizgili defter
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const lineSpacing = 30;
    
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (background === 'grid') {
    // Kareli defter
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const gridSize = 30;
    
    // Dikey çizgiler
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Yatay çizgiler
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
};

export const drawShape = (
  ctx: CanvasRenderingContext2D,
  shapeType: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  fillShape: boolean,
  lineStyle: LineStyleType
) => {
  // Çizgi stilini ayarla
  if (lineStyle === 'dashed') {
    ctx.setLineDash([10, 5]);
  } else if (lineStyle === 'dotted') {
    ctx.setLineDash([2, 5]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();

  if (shapeType === 'line') {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (shapeType === 'rectangle') {
    const width = x2 - x1;
    const height = y2 - y1;
    if (fillShape) {
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1, width, height);
    }
    ctx.strokeRect(x1, y1, width, height);
  } else if (shapeType === 'circle') {
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    const centerX = x1 + (x2 - x1) / 2;
    const centerY = y1 + (y2 - y1) / 2;
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    if (fillShape) {
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.stroke();
  } else if (shapeType === 'arrow') {
    const headLength = 20;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Ana çizgi
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Ok başı (sağ taraf)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.stroke();
    
    // Ok başı (sol taraf)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  ctx.setLineDash([]);
};

export const getCoordinates = (
  e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): { x: number; y: number; pressure: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ('touches' in e) {
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
      pressure: (touch as any).force || 0.5
    };
  } else {
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5
    };
  }
};

export const isApplePencil = (e: React.TouchEvent<HTMLCanvasElement>): boolean => {
  if ('touches' in e && e.touches.length > 0) {
    const touch = e.touches[0];
    return (touch as any).touchType === 'stylus';
  }
  return false;
};
