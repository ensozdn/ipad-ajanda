import { useState, useCallback } from 'react';
import { Page, PlacedText, PlacedImageData, BackgroundType } from '../types';

export const usePageManager = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  initialBackground: BackgroundType
) => {
  const [pages, setPages] = useState<Page[]>([
    { id: '1', imageData: '', background: initialBackground }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const saveCurrentPage = useCallback((
    imageData: string,
    background: BackgroundType,
    placedTexts: PlacedText[],
    placedImages: PlacedImageData[]
  ) => {
    setPages(prev => {
      const updated = [...prev];
      updated[currentPageIndex] = {
        ...updated[currentPageIndex],
        imageData,
        background,
        placedTexts: [...placedTexts],
        placedImages
      };
      return updated;
    });
  }, [currentPageIndex]);

  const loadPage = useCallback((
    index: number,
    onLoad: (page: Page) => void
  ) => {
    if (index < 0 || index >= pages.length) return;
    
    const page = pages[index];
    setCurrentPageIndex(index);
    onLoad(page);
  }, [pages]);

  const addNewPage = useCallback(() => {
    const newPage: Page = {
      id: Date.now().toString(),
      imageData: '',
      background: 'plain'
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  }, [pages.length]);

  const deletePage = useCallback((index: number) => {
    if (pages.length <= 1) return;

    const updatedPages = pages.filter((_, i) => i !== index);
    setPages(updatedPages);

    if (index === currentPageIndex) {
      const newIndex = Math.max(0, index - 1);
      setCurrentPageIndex(newIndex);
      return updatedPages[newIndex];
    } else if (index < currentPageIndex) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
    
    return null;
  }, [pages, currentPageIndex]);

  return {
    pages,
    currentPageIndex,
    saveCurrentPage,
    loadPage,
    addNewPage,
    deletePage
  };
};
