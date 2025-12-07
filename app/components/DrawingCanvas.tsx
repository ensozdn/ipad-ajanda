'use client';

import { useRef, useEffect, useState } from 'react';

type BackgroundType = 'plain' | 'lined' | 'grid';

interface Page {
  id: string;
  imageData: string;
  background: BackgroundType;
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
  const [tool, setTool] = useState<'pen' | 'eraser' | 'highlighter' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'image'>('pen');
  const [background, setBackground] = useState<BackgroundType>(initialBackground);
  const [scale, setScale] = useState(1);
  const [originX, setOriginX] = useState(50); // Transform origin X (%)
  const [originY, setOriginY] = useState(50); // Transform origin Y (%)
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
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  
  // Metin aracı için
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  
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

  // Pinch-to-zoom handler for canvas container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        
        // İki parmağın ortası - zoom merkezi
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        // Container'a göre pozisyon
        const rect = container.getBoundingClientRect();
        const relativeX = centerX - rect.left;
        const relativeY = centerY - rect.top;
        
        // Yüzde olarak transform origin
        const percentX = (relativeX / rect.width) * 100;
        const percentY = (relativeY / rect.height) * 100;
        
        setOriginX(percentX);
        setOriginY(percentY);
        
        initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
        lastScaleRef.current = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const ratio = currentDistance / initialDistanceRef.current;
        const newScale = lastScaleRef.current * ratio;
        const clampedScale = Math.min(Math.max(0.5, newScale), 3);
        setScale(clampedScale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastScaleRef.current = scale;
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
      setTextInput({ x, y, text: '' });
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
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
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
  };

  const stopDrawing = () => {
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
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      imageData,
      background
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
    setPages(updatedPages);
    
    // Eğer silinen sayfa aktif sayfaysa, bir öncekine git
    if (index === currentPageIndex) {
      const newIndex = Math.max(0, index - 1);
      loadPage(newIndex);
    } else if (index < currentPageIndex) {
      setCurrentPageIndex(currentPageIndex - 1);
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
      drawText(textInput.text, textInput.x, textInput.y);
    }
    setTextInput(null);
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

        // Resmi canvas ortasına yerleştir, max 400px boyutunda
        const maxSize = 400;
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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      selectedImage.img,
      selectedImage.x,
      selectedImage.y,
      selectedImage.width,
      selectedImage.height
    );

    setSelectedImage(null);
    setTool('pen');
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
    '#FFFF00', '#00FF00', '#FF69B4', '#00FFFF', '#FF8C00'
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
      {/* Toolbar - Modern & Compact */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        {/* Sol taraf - Ana Araçlar */}
        <div className="flex items-center gap-2">
          {/* Çizim Araçları Grubu */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-md transition-all ${
                tool === 'pen' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              title="Kalem"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            <button
              onClick={() => setTool('highlighter')}
              className={`p-2 rounded-md transition-all ${
                tool === 'highlighter' 
                  ? 'bg-white text-yellow-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              title="Fosforlu Kalem"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 1.15c-.53 0-1.04.21-1.41.59l-8.84 8.84c-.37.37-.59.88-.59 1.41 0 .53.21 1.04.59 1.41l2.83 2.83c.78.78 2.05.78 2.83 0l8.84-8.84c.37-.37.59-.88.59-1.41 0-.53-.21-1.04-.59-1.41l-2.83-2.83c-.37-.38-.88-.59-1.42-.59" opacity="0.7"/>
              </svg>
            </button>
            
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-md transition-all ${
                tool === 'eraser' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              title="Silgi"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0"/>
              </svg>
            </button>
            
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-md transition-all ${
                tool === 'text' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              title="Metin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-md transition-all ${
                tool === 'image' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
              title="Fotoğraf Ekle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

          {/* Şekil Araçları - Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShapeMenu(!showShapeMenu)}
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

            {/* Şekil Dropdown Menu */}
            {showShapeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 min-w-[200px]">
                <button
                  onClick={() => { setTool('line'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20 L20 4" />
                  </svg>
                  <span className="font-semibold text-gray-800">Çizgi</span>
                </button>
                <button
                  onClick={() => { setTool('rectangle'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" strokeWidth={2} />
                  </svg>
                  <span className="font-semibold text-gray-800">Dikdörtgen</span>
                </button>
                <button
                  onClick={() => { setTool('circle'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  </svg>
                  <span className="font-semibold text-gray-800">Daire</span>
                </button>
                <button
                  onClick={() => { setTool('arrow'); setShowShapeMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold text-gray-800">Ok</span>
                </button>

                {/* Şekil Özellikleri */}
                {['rectangle', 'circle'].includes(tool) && (
                  <>
                    <div className="h-px bg-gray-200 my-2"></div>
                    <button
                      onClick={() => setFillShape(!fillShape)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill={fillShape ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" strokeWidth={2} />
                      </svg>
                      <span className="font-semibold text-gray-800">{fillShape ? 'Boş Şekil' : 'Dolu Şekil'}</span>
                    </button>
                  </>
                )}

                {/* Çizgi Stili */}
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="px-2 py-1 text-xs text-gray-600 font-bold uppercase tracking-wide">Çizgi Stili</div>
                <div className="flex gap-1 p-1">
                  <button
                    onClick={() => setLineStyle('solid')}
                    className={`flex-1 p-2 rounded-md transition-colors ${
                      lineStyle === 'solid' ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    title="Düz"
                  >
                    <svg className="w-full h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="2" y1="12" x2="22" y2="12" strokeWidth={2} />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLineStyle('dashed')}
                    className={`flex-1 p-2 rounded-md transition-colors ${
                      lineStyle === 'dashed' ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    title="Kesikli"
                  >
                    <svg className="w-full h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="2" y1="12" x2="22" y2="12" strokeWidth={2} strokeDasharray="4 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLineStyle('dotted')}
                    className={`flex-1 p-2 rounded-md transition-colors ${
                      lineStyle === 'dotted' ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    title="Noktalı"
                  >
                    <svg className="w-full h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="2" y1="12" x2="22" y2="12" strokeWidth={2} strokeDasharray="1 3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Renk Seçici - Kompakt */}
          <div className="relative">
            <button 
              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:border-gray-400 transition-colors"
              style={{ backgroundColor: color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Renk"
            />
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white p-3 rounded-lg shadow-xl border z-50">
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        color === c ? 'border-blue-500 scale-110' : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

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

        {/* Sağ taraf - Aksiyonlar */}
        <div className="flex items-center gap-2">
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

      {/* Canvas - Tam ekran, pinch-to-zoom */}
      <div ref={containerRef} className="flex-1 overflow-auto relative bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-5 flex items-center justify-center min-h-full">
          <div 
            className="relative" 
            style={{ 
              width: '800px', 
              height: '1000px',
              transform: `scale(${scale})`,
              transformOrigin: `${originX}% ${originY}%`
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 z-50 flex gap-3">
          <button
            onClick={placeImage}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
          >
            Fotoğrafı Yapıştır
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
            <h3 className="text-lg font-semibold mb-4">Metin Ekle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metin</label>
                <textarea
                  value={textInput.text}
                  onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Metni buraya yazın..."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yazı Boyutu</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="8"
                    max="72"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yazı Tipi</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setTextInput(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleTextSubmit}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
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
