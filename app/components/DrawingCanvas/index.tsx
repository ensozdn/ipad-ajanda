
'use client';



import { useRef, useEffect, useState } from 'react';
import { BackgroundType } from './types';
import { useCanvasSetup } from './hooks/useCanvasSetup';
import { useHistory } from './hooks/useHistory';
import { useZoom } from './hooks/useZoom';
import { usePageManager } from './hooks/usePageManager';
import { useDrawingTools } from './hooks/useDrawingTools';
import { useTextTool } from './hooks/useTextTool';
import { useImageTool } from './hooks/useImageTool';
import { drawBackground } from './utils/canvasUtils';
import { exportAsPNG, exportAsPDF } from './utils/exportUtils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants';
import TextInputModal from './components/TextInputModal';
import ImagePlacementModal from './components/ImagePlacementModal';
import ZoomControls from './components/ZoomControls';
import Toolbar from './components/Toolbar';

interface DrawingCanvasProps {
  onSave: (imageData: string) => void;
  initialData?: string;
  initialBackground?: BackgroundType;
}

export default function DrawingCanvas({
  onSave,
  initialData,
  initialBackground = 'plain'
}: DrawingCanvasProps) {
  // Zoom ve çizim çakışmasını önlemek için
  const [isZooming, setIsZooming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas setup
  const { canvasRef, backgroundCanvasRef } = useCanvasSetup(
    initialData,
    initialBackground,
    () => saveToHistory()
  );

  // History (undo/redo)
  const { saveToHistory, undo, redo, canUndo, canRedo } = useHistory(canvasRef);

  // Zoom
  const { scale, resetZoom } = useZoom(containerRef);

  // Page management
  const {
    pages,
    currentPageIndex,
    saveCurrentPage,
    loadPage,
    addNewPage,
    deletePage
  } = usePageManager(canvasRef, initialBackground);

  // Drawing tools
  const {
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
  } = useDrawingTools(canvasRef, saveToHistory);

  // Text tool
  const {
    placedTexts,
    setPlacedTexts,
    textInput,
    setTextInput,
    selectedTextIndex,
    isDraggingText,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    handleTextClick,
    handleTextDrag,
    stopTextDrag,
    handleTextSubmit,
    deleteTextAtPosition
  } = useTextTool(canvasRef, color, saveToHistory);

  // Image tool
  const {
    fileInputRef,
    placedImages,
    setPlacedImages,
    selectedImage,
    setSelectedImage,
    selectedPlacedImage,
    isDraggingImage,
    handleImageUpload,
    placeImage,
    handleImageClick,
    handleImageDrag,
    stopImageDrag,
    loadPlacedImages,
    getPlacedImagesData
  } = useImageTool(canvasRef, saveToHistory);

  const [background, setBackground] = useState<BackgroundType>(initialBackground);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  // Background değiştiğinde yeniden çiz
  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current;
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    drawBackground(bgCtx, bgCanvas.width, bgCanvas.height, background);
  }, [background, backgroundCanvasRef]);

  // PlacedTexts ve placedImages değiştiğinde canvas'ı redraw et
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ÖNEMLİ: Canvas'ı temizle (sadece çizim katmanını, background'u değil)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Metinleri çiz
    placedTexts.forEach((txt, index) => {
      ctx.font = `${txt.fontSize}px ${txt.fontFamily}`;
      ctx.fillStyle = txt.color;
      ctx.textBaseline = 'top';
      ctx.fillText(txt.text, txt.x, txt.y);

      // Seçili metin için mavi kenarlık
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
      ctx.drawImage(imgData.img, imgData.x, imgData.y, imgData.width, imgData.height);

      // Seçili fotoğraf için mavi kenarlık
      if (selectedPlacedImage === index) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
        ctx.setLineDash([]);
      }
    });
  }, [placedTexts, placedImages, selectedTextIndex, selectedPlacedImage, canvasRef]);

  // Klavye kısayolları
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
  }, [undo, redo]);

  // Touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        setIsZooming(true);
        return;
      }
      if (!isZooming) handleCanvasPointerDown(e as any);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isZooming) return;
      handleCanvasPointerMove(e as any);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isZooming && (!e.touches || e.touches.length < 2)) {
        setIsZooming(false);
        return;
      }
      handleCanvasPointerUp();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [tool, placedTexts, placedImages, isDraggingText, isDraggingImage]);

  const handleCanvasPointerDown = (
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Eğer zoom aktifse çizim başlatma
    if (isZooming) return;

    // İki parmakla dokunma varsa (zoom için) çıkış yap
    if ('touches' in e && e.touches.length > 1) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    // Text tool - Önce var olan metne tıklandı mı kontrol et
    if (tool === 'text') {
      if (handleTextClick(x, y)) {
        e.preventDefault(); // Çizim yapılmasını engelle
        return;
      }
    }

    // Image tool - Önce var olan fotoğrafa tıklandı mı kontrol et
    if (tool === 'image') {
      if (handleImageClick(x, y)) {
        e.preventDefault(); // Çizim yapılmasını engelle
        return;
      }
    }

    // Eraser - metin/fotoğraf silme
    if (tool === 'eraser') {
      if (deleteTextAtPosition(x, y)) return;
    }

    // Normal çizim (sadece text/image tool değilse veya yeni ekleme yapılıyorsa)
    if (tool !== 'text' && tool !== 'image') {
      startDrawing(e);
    }
  };

  const handleCanvasPointerMove = (
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    // Text taşıma - Öncelik 1
    if (isDraggingText) {
      e.preventDefault(); // Çizim yapılmasını engelle
      handleTextDrag(x, y);
      return;
    }

    // Image taşıma - Öncelik 2
    if (isDraggingImage) {
      e.preventDefault(); // Çizim yapılmasını engelle
      handleImageDrag(x, y);
      return;
    }

    // Normal çizim (sadece text/image tool değilse)
    if (tool !== 'text' && tool !== 'image') {
      draw(e);
    }
  };

  const handleCanvasPointerUp = () => {
    stopTextDrag();
    stopImageDrag();
    stopDrawing();
  };

  const handleSave = () => {
    saveCurrentPage(
      canvasRef.current?.toDataURL() || '',
      background,
      placedTexts,
      getPlacedImagesData()
    );

    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(bgCanvas, 0, 0);
    tempCtx.drawImage(canvas, 0, 0);

    const imageData = tempCanvas.toDataURL('image/png');
    onSave(imageData);
  };

  const handlePageChange = (index: number) => {
    saveCurrentPage(
      canvasRef.current?.toDataURL() || '',
      background,
      placedTexts,
      getPlacedImagesData()
    );

    loadPage(index, (page) => {
      setBackground(page.background);
      setPlacedTexts(page.placedTexts || []);
      loadPlacedImages(page.placedImages || []);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f5f5]">
      {/* Toolbar */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        background={background}
        setBackground={setBackground}
        fillShape={fillShape}
        setFillShape={setFillShape}
        lineStyle={lineStyle}
        setLineStyle={setLineStyle}
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        showShapeMenu={showShapeMenu}
        setShowShapeMenu={setShowShapeMenu}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onExportPNG={() => exportAsPNG(canvasRef.current!, backgroundCanvasRef.current!)}
        onExportPDF={() => exportAsPDF(canvasRef.current!, backgroundCanvasRef.current!)}
        canUndo={canUndo}
        canRedo={canRedo}
        currentPage={currentPageIndex}
        totalPages={pages.length}
        onPrevPage={() => handlePageChange(currentPageIndex - 1)}
        onNextPage={() => handlePageChange(currentPageIndex + 1)}
        onAddPage={addNewPage}
        onDeletePage={() => {
          const deletedPage = deletePage(currentPageIndex);
          if (deletedPage) {
            setBackground(deletedPage.background);
            setPlacedTexts(deletedPage.placedTexts || []);
            loadPlacedImages(deletedPage.placedImages || []);
          }
        }}
        onFileUpload={() => fileInputRef.current?.click()}
      />

      {/* Zoom Controls */}
      <ZoomControls scale={scale} onReset={resetZoom} />

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto relative bg-gray-100">
        <div className="p-5 flex items-center justify-center min-h-full">
          <div
            className="relative"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out'
            }}
          >
            <canvas
              ref={backgroundCanvasRef}
              className="absolute inset-0 w-full h-full shadow-lg"
              style={{ pointerEvents: 'none' }}
            />
            <canvas
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
              className="absolute inset-0 w-full h-full shadow-lg"
            />

            {/* Image Preview */}
            {selectedImage && (
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src={selectedImage.img.src}
                  alt="Preview"
                  className="absolute border-2 border-blue-500 shadow-lg"
                  style={{
                    left: `${(selectedImage.x / (canvasRef.current?.width || 1)) * 100}%`,
                    top: `${(selectedImage.y / (canvasRef.current?.height || 1)) * 100}%`,
                    width: `${(selectedImage.width / (canvasRef.current?.width || 1)) * 100}%`,
                    height: `${(selectedImage.height / (canvasRef.current?.height || 1)) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TextInputModal
        isOpen={textInput !== null}
        initialText={textInput?.text || ''}
        fontSize={fontSize}
        fontFamily={fontFamily}
        onFontSizeChange={setFontSize}
        onFontFamilyChange={setFontFamily}
        onSubmit={handleTextSubmit}
        onCancel={() => setTextInput(null)}
      />

      {selectedImage && (
        <ImagePlacementModal
          imageWidth={selectedImage.width}
          onWidthChange={(width) => {
            const ratio = selectedImage.img.height / selectedImage.img.width;
            setSelectedImage({
              ...selectedImage,
              width,
              height: width * ratio
            });
          }}
          onPlace={placeImage}
          onCancel={() => {
            setSelectedImage(null);
            setTool('pen');
          }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
