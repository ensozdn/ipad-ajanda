'use client';

import { useRef, useEffect, useState } from 'react';

type BackgroundType = 'plain' | 'lined' | 'grid';

interface DrawingCanvasProps {
  onSave: (imageData: string) => void;
  initialData?: string;
}

export default function DrawingCanvas({ onSave, initialData }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [background, setBackground] = useState<BackgroundType>('plain');

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    // Canvas boyutunu büyük ayarla (Retina için) ama scale KULLANMA
    const scale = window.devicePixelRatio || 2;
    const width = 800 * scale;
    const height = 1000 * scale;
    
    canvas.width = width;
    canvas.height = height;
    bgCanvas.width = width;
    bgCanvas.height = height;
    
    // Arka plan çiz - gerçek canvas boyutunda
    drawBackground(bgCtx, width, height);
    
    // Eğer kayıtlı veri varsa yükle
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  // Touch event listeners ile passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      startDrawing(e as any);
    };

    const handleTouchMove = (e: TouchEvent) => {
      draw(e as any);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, tool, color, lineWidth]);

  // Background değiştiğinde yeniden çiz
  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current;
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    // Gerçek canvas boyutunda çiz
    drawBackground(bgCtx, bgCanvas.width, bgCanvas.height);
  }, [background]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Eğer touch event ise ve birden fazla parmak varsa (pinch-to-zoom), çizme
    if ('touches' in e && e.touches.length > 1) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y, pressure = 0.5;
    let isApplePencil = false;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      
      // Scale hesabı - canvas gerçek boyutu ile CSS boyutu
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
      pressure = (touch as any).force || 0.5;
      
      // Apple Pencil kontrolü - pointerType veya touch type
      isApplePencil = (touch as any).touchType === 'stylus';
      if (!isApplePencil) {
        // Parmakla dokunuyorsa çizme, scroll/zoom yapsın
        setIsDrawing(false);
        return;
      }
      
      // Apple Pencil ile çizerken scroll engelle
      e.preventDefault();
    } else {
      // Pointer event
      const rect = canvas.getBoundingClientRect();
      
      // Scale hesabı - canvas gerçek boyutu ile CSS boyutu
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
      pressure = e.pressure || 0.5;
      
      // Eğer pointer type mouse veya touch ise, sadece pen/stylus kabul et
      if (e.pointerType !== 'pen' && e.pointerType !== 'mouse') {
        setIsDrawing(false);
        return;
      }
    }

    setIsDrawing(true);

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
      ctx.lineWidth = lineWidth * (pressure > 0 ? pressure * 2 : 1);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Eğer touch event ise ve birden fazla parmak varsa (pinch-to-zoom), çizme
    if ('touches' in e && e.touches.length > 1) {
      setIsDrawing(false);
      return;
    }
    
    // Apple Pencil ile çizerken scroll engelle
    if ('touches' in e) {
      e.preventDefault();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y, pressure = 0.5;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      
      // Scale hesabı - canvas gerçek boyutu ile CSS boyutu
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
      pressure = (touch as any).force || 0.5;
    } else {
      // Pointer event
      const rect = canvas.getBoundingClientRect();
      
      // Scale hesabı - canvas gerçek boyutu ile CSS boyutu
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
      pressure = e.pressure || 0.5;
    }

    // Apple Pencil basınç desteği
    if (tool === 'pen') {
      ctx.lineWidth = lineWidth * (pressure > 0 ? pressure * 2 : 1);
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    // Geçici canvas oluştur - arka plan + çizim birleştir
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Önce arka planı çiz
    tempCtx.drawImage(bgCanvas, 0, 0);
    // Sonra çizimi üzerine ekle
    tempCtx.drawImage(canvas, 0, 0);

    const imageData = tempCanvas.toDataURL('image/png');
    onSave(imageData);
  };

  const colors = [
    '#000000', '#FF0000', '#0000FF', '#00FF00', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f5f5]">
      {/* Toolbar - GoodNotes style */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        {/* Sol taraf - Araçlar */}
        <div className="flex items-center gap-3">
          {/* Kalem/Silgi */}
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'pen' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Kalem"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'eraser' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Silgi"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Renkler */}
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c ? 'border-blue-500 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Kalınlık */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-6">{lineWidth}</span>
          </div>
        </div>

        {/* Orta - Arka plan */}
        <div className="flex gap-2">
          <button
            onClick={() => setBackground('plain')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              background === 'plain' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Düz
          </button>
          <button
            onClick={() => setBackground('lined')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              background === 'lined' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Çizgili
          </button>
          <button
            onClick={() => setBackground('grid')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              background === 'grid' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kareli
          </button>
        </div>

        {/* Sağ taraf - Aksiyonlar */}
        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="px-4 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Temizle
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* Canvas - Tam ekran, pinch-to-zoom */}
      <div className="flex-1 overflow-hidden relative bg-white">
        <div className="absolute inset-0 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="relative" style={{ width: '800px', height: '1000px', margin: '20px auto' }}>
            {/* Arka plan canvas */}
            <canvas
              ref={backgroundCanvasRef}
              className="absolute inset-0 w-full h-full shadow-lg"
              style={{ pointerEvents: 'none' }}
            />
            {/* Çizim canvas */}
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="absolute inset-0 w-full h-full shadow-lg"
              style={{ 
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
