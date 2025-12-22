import { useState, useCallback } from 'react';
import { MAX_HISTORY_STEPS } from '../utils/constants';

export const useHistory = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(imageData);
      if (newHistory.length > MAX_HISTORY_STEPS) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryStep(prev => {
      const newStep = prev + 1;
      return newStep >= MAX_HISTORY_STEPS ? MAX_HISTORY_STEPS - 1 : newStep;
    });
  }, [canvasRef, historyStep]);

  const undo = useCallback(() => {
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
  }, [canvasRef, history, historyStep]);

  const redo = useCallback(() => {
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
  }, [canvasRef, history, historyStep]);

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return { saveToHistory, undo, redo, canUndo, canRedo };
};
