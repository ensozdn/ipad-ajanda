'use client';

import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onSave: (imageData: string) => void;
  initialData?: string;
}

export default function DrawingCanvas({ onSave, initialData }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas boyutunu ayarla
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Beyaz arka plan
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Eğer kayıtlı veri varsa yükle
      if (initialData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialData;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initialData]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * (e.pressure || 0.5);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Apple Pencil basınç desteği
    if (tool === 'pen') {
      ctx.lineWidth = lineWidth * (e.pressure > 0 ? e.pressure * 2 : 1);
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    onSave(imageData);
  };

  const colors = [
    '#000000', '#FF0000', '#0000FF', '#00FF00', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-4">
      {/* Araç Çubuğu */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--background-secondary)] rounded-lg">
        {/* Araçlar */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tool === 'pen' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
            }`}
          >
            Kalem
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tool === 'eraser' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
            }`}
          >
            Silgi
          </button>
        </div>

        {/* Kalınlık */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--foreground-secondary)]">Kalınlık:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-8">{lineWidth}</span>
        </div>

        {/* Renkler */}
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? 'border-white scale-110' : 'border-[var(--border)]'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 rounded-lg bg-[var(--error)]/20 text-[var(--error)] hover:bg-[var(--error)]/30 transition-colors"
          >
            Temizle
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[var(--success)] hover:opacity-90 transition-opacity"
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-lg min-h-[600px]">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full h-full touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
}
