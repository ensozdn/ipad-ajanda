'use client';

import { useRef, useEffect, useState } from 'react';

type BackgroundType = 'plain' | 'lined' | 'grid';

interface Page {
  id: string;
  imageData: string;
  background: BackgroundType;
  placedTexts?: Array<{ id: string; x: number; y: number; text: string; fontSize: number; fontFamily: string; color: string }>;
  placedImages?: Array<{ x: number; y: number; width: number; height: number; imageData: string }>;
}

interface DrawingCanvasProps {
  onSave: (imageData: string) => void;
  initialData?: string;
  initialBackground?: BackgroundType;
}

export default function DrawingCanvas({ onSave, initialData, initialBackground = 'plain' }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScaleRef = useRef(1);
  const initialDistanceRef = useRef(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'marker' | 'pencil' | 'crayon' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'image'>('pen');
  const [background, setBackground] = useState<BackgroundType>(initialBackground);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0); // Pan X position
  const [panY, setPanY] = useState(0); // Pan Y position
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Çoklu sayfa
  const [pages, setPages] = useState<Page[]>([{ id: '1', imageData: '', background: initialBackground }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Şekil özellikleri
  const [fillShape, setFillShape] = useState(false); // Dolu/boş şekil
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid'); // Çizgi stili
  const [showToolMenu, setShowToolMenu] = useState(false); // Araç menüsü
  const [showShapeMenu, setShowShapeMenu] = useState(false); // Şekil menüsü
  
  // Şekil çizimi için
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<ImageData | null>(null);
  
  // Fotoğraf için
  const [selectedImage, setSelectedImage] = useState<{ img: HTMLImageElement; x: number; y: number; width: number; height: number } | null>(null);
  const [placedImages, setPlacedImages] = useState<Array<{ img: HTMLImageElement; x: number; y: number; width: number; height: number }>>([]);
  const [selectedPlacedImage, setSelectedPlacedImage] = useState<number | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // Metin aracı için
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [placedTexts, setPlacedTexts] = useState<Array<{ id: string; x: number; y: number; text: string; fontSize: number; fontFamily: string; color: string }>>([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textDragStartPos, setTextDragStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // Undo/Redo için history
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

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
        // İlk history state'ini kaydet
        saveToHistory();
      };
      img.src = initialData;
    } else {
      // Boş canvas için ilk state'i kaydet
      saveToHistory();
    }
  }, [initialData]);

  // PlacedTexts veya placedImages değiştiğinde canvas'ı redraw et
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas'ı redraw et (mevcut durumu koru)
    // Sadece text ve image layer'ını güncelle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Arka planı tekrar çiz
    const bgCanvas = backgroundCanvasRef.current;
    if (bgCanvas) {
      ctx.drawImage(bgCanvas, 0, 0);
    }

    // Metinleri çiz
    placedTexts.forEach((txt, index) => {
      ctx.font = `${txt.fontSize}px ${txt.fontFamily}`;
      ctx.fillStyle = txt.color;
      ctx.textBaseline = 'top';
      ctx.fillText(txt.text, txt.x, txt.y);

      // Seçilen metnin etrafına border çiz
      if (selectedTextIndex === index) {
        const metrics = ctx.measureText(txt.text);
        const textWidth = metrics.width;
        const textHeight = txt.fontSize;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(txt.x, txt.y - textHeight, textWidth, textHeight);
        ctx.setLineDash([]);
      }
    });

    // Fotoğrafları çiz
    placedImages.forEach((imgData, index) => {
      ctx.drawImage(
        imgData.img,
        imgData.x,
        imgData.y,
        imgData.width,
        imgData.height
      );

      // Seçilen fotoğrafın etrafına border çiz
      if (selectedPlacedImage === index) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
        ctx.setLineDash([]);
      }
    });
  }, [placedTexts, placedImages, selectedTextIndex, selectedPlacedImage]);

  // Çok yavaş pinch-to-zoom - iPad optimized
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
        
        // Mini artış - 0.006'dan 0.007'ye
        const zoomSensitivity = 0.007; // Sadece +0.001 artış
        const scaleChange = distanceChange * zoomSensitivity;
        
        const newScale = initialScale + scaleChange;
        const clampedScale = Math.min(Math.max(0.7, newScale), 2); // 0.7x - 2x arası
        
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
  }, [scale]);

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

  // Klavye kısayolları (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history]);

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

    // Metin aracı için tıklama
    if (tool === 'text') {
      // Var olan metne tıklandı mı kontrol et
      for (let i = placedTexts.length - 1; i >= 0; i--) {
        const txt = placedTexts[i];
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;
        tempCtx.font = `${txt.fontSize}px ${txt.fontFamily}`;
        const metrics = tempCtx.measureText(txt.text);
        const textWidth = metrics.width;
        const textHeight = txt.fontSize;
        
        if (
          x >= txt.x &&
          x <= txt.x + textWidth &&
          y >= txt.y - textHeight &&
          y <= txt.y
        ) {
          setSelectedTextIndex(i);
          setTextDragStartPos({ x, y });
          setIsDraggingText(true);
          setIsDrawing(true); // Draw event'lerini trigger et
          return;
        }
      }
      
      // Yeni metin ekleme
      setTextInput({ x, y, text: '' });
      return;
    }

    // Eraser tool - metni silme
    if (tool === 'eraser') {
      // Hangi metne tıklandığını kontrol et
      for (let i = placedTexts.length - 1; i >= 0; i--) {
        const txt = placedTexts[i];
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;
        tempCtx.font = `${txt.fontSize}px ${txt.fontFamily}`;
        const metrics = tempCtx.measureText(txt.text);
        const textWidth = metrics.width;
        const textHeight = txt.fontSize;
        
        if (
          x >= txt.x &&
          x <= txt.x + textWidth &&
          y >= txt.y - textHeight &&
          y <= txt.y
        ) {
          // Metni sil
          const updatedTexts = placedTexts.filter((_, index) => index !== i);
          setPlacedTexts(updatedTexts);
          setSelectedTextIndex(null);
          saveToHistory();
          return;
        }
      }
    }

    // Image tool için - fotoğrafı seçip taşıyabiliyor
    if (tool === 'image') {
      // Hangi fotoğrafın üzerine tıklandığını kontrol et
      for (let i = placedImages.length - 1; i >= 0; i--) {
        const img = placedImages[i];
        if (
          x >= img.x &&
          x <= img.x + img.width &&
          y >= img.y &&
          y <= img.y + img.height
        ) {
          setSelectedPlacedImage(i);
          setIsDraggingImage(true);
          setDragStartPos({ x, y }); // Drag başlangıç konumunu kaydet
          return;
        }
      }
      return;
    }

    setIsDrawing(true);

    // Şekil araçları için başlangıç noktasını kaydet
    const isShapeTool = ['line', 'rectangle', 'circle', 'arrow'].includes(tool);
    if (isShapeTool) {
      setStartPoint({ x, y });
      // Şekil çizimi için mevcut canvas'ı kaydet
      setCurrentShape(ctx.getImageData(0, 0, canvas.width, canvas.height));
      return;
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
      ctx.globalAlpha = 0.3; // Yarı saydam
      ctx.lineWidth = lineWidth * 4; // Daha kalın
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0; // Tam opak
      ctx.lineWidth = lineWidth * 5; // Çok kalın
    } else if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = lineWidth * 0.5; // Çok ince
    } else if (tool === 'crayon') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6; // Yarı saydam
      ctx.lineWidth = lineWidth * 3; // Orta kalın
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * (pressure > 0 ? pressure * 2 : 1);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Text taşıma modunda ise
    if (isDraggingText && selectedTextIndex !== null && textDragStartPos) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let currentX, currentY;
      if ('touches' in e) {
        const touch = e.touches[0];
        currentX = (touch.clientX - rect.left) * scaleX;
        currentY = (touch.clientY - rect.top) * scaleY;
      } else {
        currentX = (e.clientX - rect.left) * scaleX;
        currentY = (e.clientY - rect.top) * scaleY;
      }

      // Fareyi ne kadar hareket ettirdiğini hesapla
      const deltaX = currentX - textDragStartPos.x;
      const deltaY = currentY - textDragStartPos.y;

      // Metni güncelle
      const txt = placedTexts[selectedTextIndex];
      const updatedTexts = [...placedTexts];
      updatedTexts[selectedTextIndex] = {
        ...txt,
        x: Math.max(0, Math.min(canvas.width, txt.x + deltaX)),
        y: Math.max(0, Math.min(canvas.height, txt.y + deltaY))
      };
      setPlacedTexts(updatedTexts);

      // Canvas'ı hemen güncelle (state update'ini bekleme)
      const bgCanvas = backgroundCanvasRef.current;
      if (bgCanvas) {
        ctx.drawImage(bgCanvas, 0, 0);
      }

      // Güncellenen metni ve diğerlerini çiz
      updatedTexts.forEach((t, index) => {
        ctx.font = `${t.fontSize}px ${t.fontFamily}`;
        ctx.fillStyle = t.color;
        ctx.textBaseline = 'top';
        ctx.fillText(t.text, t.x, t.y);

        if (selectedTextIndex === index) {
          const metrics = ctx.measureText(t.text);
          const textWidth = metrics.width;
          const textHeight = t.fontSize;
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(t.x, t.y - textHeight, textWidth, textHeight);
          ctx.setLineDash([]);
        }
      });

      // Fotoğrafları da çiz
      placedImages.forEach((imgData, index) => {
        ctx.drawImage(
          imgData.img,
          imgData.x,
          imgData.y,
          imgData.width,
          imgData.height
        );

        if (selectedPlacedImage === index) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
          ctx.setLineDash([]);
        }
      });

      // Başlangıç pozisyonunu güncelle
      setTextDragStartPos({ x: currentX, y: currentY });
      return;
    }

    // Image taşıma modunda ise
    if (isDraggingImage && selectedPlacedImage !== null && dragStartPos) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let currentX, currentY;
      if ('touches' in e) {
        const touch = e.touches[0];
        currentX = (touch.clientX - rect.left) * scaleX;
        currentY = (touch.clientY - rect.top) * scaleY;
      } else {
        currentX = (e.clientX - rect.left) * scaleX;
        currentY = (e.clientY - rect.top) * scaleY;
      }

      // Fareyi ne kadar hareket ettirdiğini hesapla
      const deltaX = currentX - dragStartPos.x;
      const deltaY = currentY - dragStartPos.y;

      // Fotoğrafı güncelle
      const img = placedImages[selectedPlacedImage];
      const updatedImages = [...placedImages];
      updatedImages[selectedPlacedImage] = {
        ...img,
        x: Math.max(0, Math.min(canvas.width - img.width, img.x + deltaX)),
        y: Math.max(0, Math.min(canvas.height - img.height, img.y + deltaY))
      };
      setPlacedImages(updatedImages);

      // Canvas'ı temizle ve fotoğrafları yeniden çiz (klonlanmayı engellemek için)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updatedImages.forEach((imgData, index) => {
        ctx.drawImage(
          imgData.img,
          imgData.x,
          imgData.y,
          imgData.width,
          imgData.height
        );

        // Seçilen fotoğrafın etrafına border çiz
        if (selectedPlacedImage === index) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
          ctx.setLineDash([]);
        }
      });
      
      // Drag pozisyonunu güncelle
      setDragStartPos({ x: currentX, y: currentY });
      return;
    }

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

    // Şekil araçları için önizleme
    const isShapeTool = ['line', 'rectangle', 'circle', 'arrow'].includes(tool);
    if (isShapeTool && startPoint && currentShape) {
      // Önceki canvas'ı geri yükle (önizleme için)
      ctx.putImageData(currentShape, 0, 0);
      
      // Şekil stili
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Şekli çiz
      drawShape(ctx, tool, startPoint.x, startPoint.y, x, y);
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

    // Yerleştirilen metinleri canvas'a çiz
    placedTexts.forEach((txt, index) => {
      ctx.font = `${txt.fontSize}px ${txt.fontFamily}`;
      ctx.fillStyle = txt.color;
      ctx.textBaseline = 'top';
      ctx.fillText(txt.text, txt.x, txt.y);

      // Seçilen metnin etrafına border çiz
      if (selectedTextIndex === index) {
        const metrics = ctx.measureText(txt.text);
        const textWidth = metrics.width;
        const textHeight = txt.fontSize;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(txt.x, txt.y - textHeight, textWidth, textHeight);
        ctx.setLineDash([]);
      }
    });

    // Yapıştırılan fotoğrafları canvas'a çiz
    placedImages.forEach((imgData, index) => {
      ctx.drawImage(
        imgData.img,
        imgData.x,
        imgData.y,
        imgData.width,
        imgData.height
      );

      // Seçilen fotoğrafın etrafına border çiz
      if (selectedPlacedImage === index) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
        ctx.setLineDash([]);
      }
    });
  };

  const stopDrawing = () => {
    if (isDraggingText) {
      setIsDraggingText(false);
      setTextDragStartPos(null);
      setSelectedTextIndex(null); // Seçimi kaldır, border kalsın
      setIsDrawing(false); // Çizim modunu kapat
      saveToHistory();
      return;
    }

    if (isDraggingImage) {
      setIsDraggingImage(false);
      setDragStartPos(null);
      setSelectedPlacedImage(null); // Seçimi kaldır, border kalsın
      setIsDrawing(false); // Çizim modunu kapat
      saveToHistory();
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);
      // Şekil çizimi tamamlandıysa state'i temizle
      setStartPoint(null);
      setCurrentShape(null);
      // Çizim bittiğinde history'ye kaydet
      saveToHistory();
    }
  };

  // Şekil çizme fonksiyonu
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shapeType: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    // Çizgi stilini ayarla
    if (lineStyle === 'dashed') {
      ctx.setLineDash([10, 5]); // 10px çizgi, 5px boşluk
    } else if (lineStyle === 'dotted') {
      ctx.setLineDash([2, 5]); // 2px nokta, 5px boşluk
    } else {
      ctx.setLineDash([]); // Düz çizgi
    }

    ctx.beginPath();

    if (shapeType === 'line') {
      // Düz çizgi
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (shapeType === 'rectangle') {
      // Dikdörtgen
      const width = x2 - x1;
      const height = y2 - y1;
      if (fillShape) {
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1, width, height);
      }
      ctx.strokeRect(x1, y1, width, height);
    } else if (shapeType === 'circle') {
      // Daire (elips)
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
      // Ok
      const headLength = 20; // Ok başının uzunluğu
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

    // LineDash'i resetle
    ctx.setLineDash([]);
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Yapıştırılan fotoğrafları canvas'a çiz (kalıcı olarak)
    placedImages.forEach((imgData) => {
      ctx.drawImage(
        imgData.img,
        imgData.x,
        imgData.y,
        imgData.width,
        imgData.height
      );
    });

    const imageData = canvas.toDataURL();
    setHistory(prev => {
      // Eğer history'de geri gidilmişse, o noktadan sonrasını sil
      const newHistory = prev.slice(0, historyStep + 1);
      // Yeni state'i ekle
      newHistory.push(imageData);
      // Max 50 state tut (performans için)
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryStep(prev => {
      const newStep = prev + 1;
      return newStep >= 50 ? 49 : newStep;
    });
  };

  const undo = () => {
    if (historyStep <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newStep];
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newStep];
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  // Sayfa fonksiyonları
  const saveCurrentPage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    
    // Fotoğrafları data URL'lerine dönüştür
    const savedImages = placedImages.map(img => ({
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      imageData: img.img.src
    }));

    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      imageData,
      background,
      placedTexts: [...placedTexts],
      placedImages: savedImages
    };
    setPages(updatedPages);
  };

  const loadPage = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || index < 0 || index >= pages.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mevcut sayfayı kaydet
    saveCurrentPage();

    // Yeni sayfayı yükle
    const page = pages[index];
    setCurrentPageIndex(index);
    setBackground(page.background);
    
    // Metinleri ve fotoğrafları yükle
    setPlacedTexts(page.placedTexts || []);
    
    // Fotoğrafları yükle
    const loadedImages: typeof placedImages = [];
    if (page.placedImages && page.placedImages.length > 0) {
      let loadedCount = 0;
      page.placedImages.forEach((imgData) => {
        const img = new Image();
        img.onload = () => {
          loadedImages.push({
            img: img,
            x: imgData.x,
            y: imgData.y,
            width: imgData.width,
            height: imgData.height
          });
          loadedCount++;
          if (loadedCount === page.placedImages!.length) {
            setPlacedImages(loadedImages);
          }
        };
        img.src = imgData.imageData;
      });
    } else {
      setPlacedImages([]);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (page.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      img.src = page.imageData;
    } else {
      saveToHistory();
    }
  };

  const addNewPage = () => {
    saveCurrentPage();
    const newPage: Page = {
      id: Date.now().toString(),
      imageData: '',
      background: 'plain'
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    setBackground('plain');
    
    // Canvas'ı temizle
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return; // En az 1 sayfa olmalı

    const updatedPages = pages.filter((_, i) => i !== index);
    
    // Silinecek sayfa aktif sayfaysa
    if (index === currentPageIndex) {
      const newIndex = Math.max(0, index - 1);
      setPages(updatedPages);
      setCurrentPageIndex(newIndex);
      setBackground(updatedPages[newIndex]?.background || 'plain');
      
      // Canvas'ı yeni sayfaya göre yükle
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (updatedPages[newIndex]?.imageData) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              saveToHistory();
            };
            img.src = updatedPages[newIndex].imageData;
          } else {
            saveToHistory();
          }
        }
      }
    } else {
      // Silinen sayfa aktif değilse, sadece index'i güncelle
      setPages(updatedPages);
      if (index < currentPageIndex) {
        setCurrentPageIndex(currentPageIndex - 1);
      }
    }
  };

  const drawText = (text: string, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    
    saveToHistory();
  };

  const handleTextSubmit = () => {
    if (textInput && textInput.text.trim()) {
      // Metni placedTexts'e ekle (taşınabilir olacak)
      const newText = {
        id: `text-${Date.now()}`,
        x: textInput.x,
        y: textInput.y,
        text: textInput.text,
        fontSize: fontSize,
        fontFamily: fontFamily,
        color: color
      };
      const updatedTexts = [...placedTexts, newText];
      setPlacedTexts(updatedTexts);
      
      // Canvas'ı hemen güncelle (state güncellemesinin tamamlanmasını bekleme)
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Yeni metni direkt canvas'a çiz
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.fillStyle = color;
          ctx.textBaseline = 'top';
          ctx.fillText(newText.text, newText.x, newText.y);
        }
      }
      
      saveToHistory();
    }
    setTextInput(null);
    // Yeni eklenmiş yazıyı seç (hemen sürüklemek için)
    setSelectedTextIndex(placedTexts.length);
    // Text tool'u otomatik seç (sürükleme için hazır)
    setTool('text');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resmi canvas ortasına yerleştir, max 600px boyutunda
        const maxSize = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;

        setSelectedImage({ img, x, y, width, height });
        setTool('image');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const placeImage = () => {
    if (!selectedImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fotoğrafı yapıştırılan fotoğraflar listesine ekle
    setPlacedImages([...placedImages, selectedImage]);
    setSelectedImage(null);
    setSelectedPlacedImage(placedImages.length); // Yeni eklenen fotoğrafı seç
    setTool('image'); // Image modunda kal
    saveToHistory();
  };

  const handleSave = () => {
    // Önce mevcut sayfayı kaydet
    saveCurrentPage();
    
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    // İlk sayfayı kaydet (şimdilik tek sayfa gösteriyoruz)
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

  const exportAsPNG = () => {
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

    // PNG olarak indir
    const imageData = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `not_${new Date().getTime()}.png`;
    link.click();
  };

  const exportAsPDF = async () => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    try {
      // jsPDF'i dinamik import ile yükle
      const { jsPDF } = await import('jspdf');
      
      // Geçici canvas oluştur - arka plan + çizim birleştir
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(bgCanvas, 0, 0);
      tempCtx.drawImage(canvas, 0, 0);

      // Canvas'ı image olarak al
      const imgData = tempCanvas.toDataURL('image/png');
      
      // PDF oluştur - A4 boyutunda
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 boyutları: 210mm x 297mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Canvas oranını koru
      const canvasRatio = canvas.height / canvas.width;
      let imgWidth = pdfWidth;
      let imgHeight = pdfWidth * canvasRatio;
      
      // Eğer yükseklik A4'ü aşarsa, yüksekliğe göre ölçekle
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight / canvasRatio;
      }
      
      // Ortala
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      // PDF'e image ekle
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // PDF'i indir
      pdf.save(`not_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. PNG olarak indiriliyor.');
      exportAsPNG();
    }
  };

  const colors = [
    // Temel renkler
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    // Pastel tonlar
    '#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD',
    // Canlı renkler
    '#FF1493', '#FF4500', '#32CD32', '#1E90FF', '#9370DB',
    // Fosforlu/Highlighter renkler
    '#FFFF00', '#FF69B4', '#00FFFF', '#FF8C00', '#FFA500'
  ];

  const highlighterColors = [
    '#FFFF00', // Sarı
    '#00FF00', // Yeşil
    '#FF69B4', // Pembe
    '#00FFFF', // Cyan
    '#FF8C00', // Turuncu
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f5f5]">
      {/* Toolbar - iPad Optimized with Horizontal Scroll */}
      <div className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-3 px-3 py-2.5 min-w-max">
          {/* Çizim Araçları */}
          <div className="flex items-center gap-2">
          {/* Çizim Araçları Grubu */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {/* Normal Kalem - İyi tanımlanmış çizgi */}
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-md transition-all ${
                tool === 'pen' 
                  ? 'bg-blue-500 text-white shadow-lg scale-110' 
                  : 'text-gray-700 hover:bg-white/70 hover:scale-105'
              }`}
              title="Normal Kalem (Net çizgiler)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Fosforlu Kalem - Yarı saydam fosforlu renk */}
            <button
              onClick={() => setTool('highlighter')}
              className={`p-2 rounded-md transition-all ${
                tool === 'highlighter' 
                  ? 'bg-yellow-400 text-white shadow-lg scale-110' 
                  : 'text-yellow-500 hover:bg-yellow-100/70 hover:scale-105'
              }`}
              title="Fosforlu Kalem (Yarı saydam parlak)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z" opacity="0.7"/>
              </svg>
            </button>

            {/* Kalın Marker - Çok kalın çizgi */}
            <button
              onClick={() => setTool('marker')}
              className={`p-2 rounded-md transition-all ${
                tool === 'marker' 
                  ? 'bg-orange-500 text-white shadow-lg scale-110' 
                  : 'text-orange-600 hover:bg-orange-100/70 hover:scale-105'
              }`}
              title="Kalın Marker (Çok kalın, opak)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* İnce Kalem - Ince çizgi */}
            <button
              onClick={() => setTool('pencil')}
              className={`p-2 rounded-md transition-all ${
                tool === 'pencil' 
                  ? 'bg-amber-600 text-white shadow-lg scale-110' 
                  : 'text-amber-700 hover:bg-amber-100/70 hover:scale-105'
              }`}
              title="İnce Kalem (Çok ince ve doğal)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* Soft Pastel - Yumuşak, saydam çizgi */}
            <button
              onClick={() => setTool('crayon')}
              className={`p-2 rounded-md transition-all ${
                tool === 'crayon' 
                  ? 'bg-red-500 text-white shadow-lg scale-110' 
                  : 'text-red-500 hover:bg-red-100/70 hover:scale-105'
              }`}
              title="Soft Pastel (Yumuşak, yarı saydam)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" opacity="0.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
            
            {/* Silgi - Çizgileri siler */}
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-md transition-all ${
                tool === 'eraser' 
                  ? 'bg-purple-600 text-white shadow-lg scale-110' 
                  : 'text-purple-700 hover:bg-purple-100/70 hover:scale-105'
              }`}
              title="Silgi (Çizgileri siler)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Metin Aracı - Yazı ekle */}
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-md transition-all ${
                tool === 'text' 
                  ? 'bg-green-600 text-white shadow-lg scale-110' 
                  : 'text-green-700 hover:bg-green-100/70 hover:scale-105'
              }`}
              title="Metin (Yazı ekle)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </button>
            
            {/* Fotoğraf Aracı - Resim ekle */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-md transition-all ${
                tool === 'image' 
                  ? 'bg-indigo-600 text-white shadow-lg scale-110' 
                  : 'text-indigo-700 hover:bg-indigo-100/70 hover:scale-105'
              }`}
              title="Fotoğraf Ekle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Şekil Araçları - iPad Optimized */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShapeMenu(!showShapeMenu);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                ['line', 'rectangle', 'circle', 'arrow'].includes(tool)
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Şekiller"
            >
              {tool === 'line' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20 L20 4" />
                </svg>
              )}
              {tool === 'rectangle' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" strokeWidth={2} />
                </svg>
              )}
              {tool === 'circle' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                </svg>
              )}
              {tool === 'arrow' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
              {!['line', 'rectangle', 'circle', 'arrow'].includes(tool) && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" strokeWidth={2} />
                </svg>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Şekil Menüsü Modal - Fixed position for iPad */}
          {showShapeMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowShapeMenu(false)}
              />
              {/* Shape Menu Panel */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-3 z-50 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Şekil Seç</h3>
                  <button
                    onClick={() => setShowShapeMenu(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-1">
                <button
                  onClick={() => { setTool('line'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20 L20 4" />
                  </svg>
                  <span className="font-semibold text-gray-800">Çizgi</span>
                </button>
                <button
                  onClick={() => { setTool('rectangle'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" strokeWidth={2} />
                  </svg>
                  <span className="font-semibold text-gray-800">Dikdörtgen</span>
                </button>
                <button
                  onClick={() => { setTool('circle'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  </svg>
                  <span className="font-semibold text-gray-800">Daire</span>
                </button>
                <button
                  onClick={() => { setTool('arrow'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold text-gray-800">Ok</span>
                </button>
                </div>

                {/* Şekil Özellikleri */}
                {['rectangle', 'circle'].includes(tool) && (
                  <>
                    <div className="h-px bg-gray-200 my-3"></div>
                    <button
                      onClick={() => setFillShape(!fillShape)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill={fillShape ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" strokeWidth={2} />
                      </svg>
                      <span className="font-semibold text-gray-800">{fillShape ? 'Boş Şekil' : 'Dolu Şekil'}</span>
                    </button>
                  </>
                )}

                {/* Çizgi Stili */}
                <div className="h-px bg-gray-200 my-3"></div>
                <div className="px-2 py-1 text-sm text-gray-700 font-bold uppercase tracking-wide">Çizgi Stili</div>
                <div className="grid grid-cols-3 gap-2 p-2">
                  <button
                    onClick={() => setLineStyle('solid')}
                    className={`p-4 rounded-lg transition-all border-2 ${
                      lineStyle === 'solid' 
                        ? 'bg-blue-500 border-blue-600 shadow-lg' 
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                    title="Düz Çizgi"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-full h-6" fill="none" stroke={lineStyle === 'solid' ? '#ffffff' : '#1f2937'} viewBox="0 0 40 10">
                        <line x1="2" y1="5" x2="38" y2="5" strokeWidth={3} strokeLinecap="round" />
                      </svg>
                      <span className={`text-xs font-bold ${lineStyle === 'solid' ? 'text-white' : 'text-gray-700'}`}>
                        Düz
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setLineStyle('dashed')}
                    className={`p-4 rounded-lg transition-all border-2 ${
                      lineStyle === 'dashed' 
                        ? 'bg-blue-500 border-blue-600 shadow-lg' 
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                    title="Kesikli Çizgi"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-full h-6" fill="none" stroke={lineStyle === 'dashed' ? '#ffffff' : '#1f2937'} viewBox="0 0 40 10">
                        <line x1="2" y1="5" x2="38" y2="5" strokeWidth={3} strokeDasharray="6 3" strokeLinecap="round" />
                      </svg>
                      <span className={`text-xs font-bold ${lineStyle === 'dashed' ? 'text-white' : 'text-gray-700'}`}>
                        Kesikli
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setLineStyle('dotted')}
                    className={`p-4 rounded-lg transition-all border-2 ${
                      lineStyle === 'dotted' 
                        ? 'bg-blue-500 border-blue-600 shadow-lg' 
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                    title="Noktalı Çizgi"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-full h-6" fill="none" stroke={lineStyle === 'dotted' ? '#ffffff' : '#1f2937'} viewBox="0 0 40 10">
                        <line x1="2" y1="5" x2="38" y2="5" strokeWidth={3} strokeDasharray="1 4" strokeLinecap="round" />
                      </svg>
                      <span className={`text-xs font-bold ${lineStyle === 'dotted' ? 'text-white' : 'text-gray-700'}`}>
                        Noktalı
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Renk Seçici - iPad Optimized */}
          <div className="relative">
            <button 
              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:border-gray-400 transition-colors"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              title="Renk"
            />
          </div>

          {/* Renk Seçici Modal - Fixed position for iPad */}
          {showColorPicker && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowColorPicker(false)}
              />
              {/* Color Picker Panel */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-w-xs w-full mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Renk Seç</h3>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        color === c ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="border-t pt-3">
                  <label className="block text-xs font-bold text-gray-600 mb-2">Özel Renk</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                </div>
              </div>
            </>
          )}

          {/* Kalınlık Slider - Kompakt */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2" />
            </svg>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(lineWidth / 20) * 100}%, #d1d5db ${(lineWidth / 20) * 100}%, #d1d5db 100%)`
              }}
            />
            <span className="text-sm font-medium text-gray-600 w-6">{lineWidth}</span>
          </div>
        </div>

        {/* Orta - Undo/Redo */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className={`p-2 rounded-md transition-all ${
              historyStep <= 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            title="Geri Al (Ctrl+Z)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className={`p-2 rounded-md transition-all ${
              historyStep >= history.length - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            title="İleri Al (Ctrl+Y)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Sayfa Navigasyonu */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => loadPage(currentPageIndex - 1)}
            disabled={currentPageIndex === 0}
            className={`p-2 rounded-md transition-all ${
              currentPageIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            title="Önceki Sayfa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-700 px-2">
            {currentPageIndex + 1} / {pages.length}
          </span>
          
          <button
            onClick={() => loadPage(currentPageIndex + 1)}
            disabled={currentPageIndex === pages.length - 1}
            className={`p-2 rounded-md transition-all ${
              currentPageIndex === pages.length - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-white/50'
            }`}
            title="Sonraki Sayfa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={addNewPage}
            className="p-2 rounded-md text-blue-600 hover:bg-white/50 transition-all"
            title="Yeni Sayfa Ekle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {pages.length > 1 && (
            <button
              onClick={() => deletePage(currentPageIndex)}
              className="p-2 rounded-md text-red-600 hover:bg-white/50 transition-all"
              title="Bu Sayfayı Sil"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

          <div className="w-px h-8 bg-gray-300 mx-1" />

          {/* Arka Plan Seçimi */}
          <div className="flex items-center gap-1">
          <button
            onClick={() => setBackground('plain')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              background === 'plain' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Düz
          </button>
          <button
            onClick={() => setBackground('lined')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              background === 'lined' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Çizgili
          </button>
          <button
            onClick={() => setBackground('grid')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              background === 'grid' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kareli
          </button>

          <div className="w-px h-8 bg-gray-300 mx-2" />

          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Temizle
          </button>
          <button
            onClick={exportAsPNG}
            className="px-3 py-1.5 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center gap-1"
            title="PNG olarak indir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PNG
          </button>
          <button
            onClick={exportAsPDF}
            className="px-3 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-1"
            title="PDF olarak indir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
          >
            Kaydet
          </button>
          </div>
        </div>
      </div>

      {/* Zoom Reset Butonu */}
      {scale !== 1 && (
        <button
          onClick={() => setScale(1)}
          className="fixed bottom-6 right-6 px-4 py-3 rounded-full bg-blue-500 text-white shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-2 z-30 font-bold"
          title="Zoom'u Sıfırla"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
          Sıfırla
        </button>
      )}

      {/* Zoom Seviyesi */}
      {scale !== 1 && (
        <div className="fixed top-20 right-6 px-3 py-2 rounded-lg bg-black/70 text-white text-sm font-bold z-30">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Canvas - Zoom ve scroll */}
      <div ref={containerRef} className="flex-1 overflow-auto relative bg-gray-100" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-5 flex items-center justify-center min-h-full" style={{ 
          minWidth: `${800 * scale}px`,
          minHeight: `${1000 * scale}px`
        }}>
          <div 
            className="relative" 
            style={{ 
              width: '800px', 
              height: '1000px',
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out'
            }}
          >
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
            
            {/* Fotoğraf Önizleme */}
            {selectedImage && (
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src={selectedImage.img.src}
                  alt="Preview"
                  className="absolute border-2 border-blue-500 shadow-lg"
                  style={{
                    left: `${(selectedImage.x / canvasRef.current!.width) * 100}%`,
                    top: `${(selectedImage.y / canvasRef.current!.height) * 100}%`,
                    width: `${(selectedImage.width / canvasRef.current!.width) * 100}%`,
                    height: `${(selectedImage.height / canvasRef.current!.height) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fotoğraf Yerleştirme Modal */}
      {selectedImage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 z-50 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-gray-900">Boyut:</label>
            <input
              type="range"
              min="50"
              max="1000"
              value={selectedImage.width}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                const ratio = selectedImage.img.height / selectedImage.img.width;
                setSelectedImage({
                  ...selectedImage,
                  width: newWidth,
                  height: newWidth * ratio
                });
              }}
              className="w-40 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-700 min-w-12">{Math.round(selectedImage.width)}px</span>
          </div>
          
          <button
            onClick={placeImage}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            Yapıştır
          </button>
          <button
            onClick={() => { setSelectedImage(null); setTool('pen'); }}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
        </div>
      )}

      {/* Metin Input Modal */}
      {textInput !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTextInput(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90%]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Metin Ekle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Metin</label>
                <textarea
                  value={textInput.text}
                  onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 font-medium"
                  rows={3}
                  placeholder="Metni buraya yazın..."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Yazı Boyutu</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    min="8"
                    max="72"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Yazı Tipi</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-700">
                  <span className="font-bold">İpucu:</span> Yazıyı ekledikten sonra silmek için <span className="font-semibold text-blue-600">Silgi</span> aracını seçin veya <span className="font-semibold text-blue-600">Geri Al</span> butonuna basın.
                </p>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setTextInput(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-900 text-gray-900 hover:bg-gray-100 transition-colors font-semibold"
                >
                  İptal
                </button>
                <button
                  onClick={handleTextSubmit}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
