import { useState, useCallback } from 'react';
import { PlacedText, TextInput } from '../types';

export const useTextTool = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  color: string,
  onSaveHistory: () => void
) => {
  const [placedTexts, setPlacedTexts] = useState<PlacedText[]>([]);
  const [textInput, setTextInput] = useState<TextInput | null>(null);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textDragStartPos, setTextDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');

  const handleTextClick = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

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
        return true;
      }
    }
    
    // Yeni metin ekleme
    setTextInput({ x, y, text: '' });
    return true;
  }, [placedTexts, canvasRef]);

  const handleTextDrag = useCallback((x: number, y: number) => {
    if (!isDraggingText || selectedTextIndex === null || !textDragStartPos) return;

    const deltaX = x - textDragStartPos.x;
    const deltaY = y - textDragStartPos.y;

    const txt = placedTexts[selectedTextIndex];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatedTexts = [...placedTexts];
    updatedTexts[selectedTextIndex] = {
      ...txt,
      x: Math.max(0, Math.min(canvas.width, txt.x + deltaX)),
      y: Math.max(0, Math.min(canvas.height, txt.y + deltaY))
    };
    setPlacedTexts(updatedTexts);
    setTextDragStartPos({ x, y });
  }, [isDraggingText, selectedTextIndex, textDragStartPos, placedTexts, canvasRef]);

  const stopTextDrag = useCallback(() => {
    if (isDraggingText) {
      setIsDraggingText(false);
      setTextDragStartPos(null);
      setSelectedTextIndex(null);
      onSaveHistory();
    }
  }, [isDraggingText, onSaveHistory]);

  const handleTextSubmit = useCallback((text: string) => {
    if (!textInput || !text.trim()) {
      setTextInput(null);
      return;
    }

    const newText: PlacedText = {
      id: `text-${Date.now()}`,
      x: textInput.x,
      y: textInput.y,
      text: text,
      fontSize: fontSize,
      fontFamily: fontFamily,
      color: color
    };

    setPlacedTexts(prev => [...prev, newText]);
    setTextInput(null);
    onSaveHistory();
  }, [textInput, fontSize, fontFamily, color, onSaveHistory]);

  const deleteTextAtPosition = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

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
        const updatedTexts = placedTexts.filter((_, index) => index !== i);
        setPlacedTexts(updatedTexts);
        setSelectedTextIndex(null);
        onSaveHistory();
        return true;
      }
    }
    return false;
  }, [placedTexts, canvasRef, onSaveHistory]);

  return {
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
  };
};
