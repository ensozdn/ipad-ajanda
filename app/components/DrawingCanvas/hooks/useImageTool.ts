import { useState, useCallback, useRef } from 'react';
import { PlacedImage, PlacedImageData, SelectedImage } from '../types';

export const useImageTool = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onSaveHistory: () => void
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [placedImages, setPlacedImages] = useState<PlacedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedPlacedImage, setSelectedPlacedImage] = useState<number | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

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
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [canvasRef]);

  const placeImage = useCallback(() => {
    if (!selectedImage) return;

    setPlacedImages(prev => [...prev, selectedImage]);
    setSelectedImage(null);
    setSelectedPlacedImage(placedImages.length);
    onSaveHistory();
  }, [selectedImage, placedImages.length, onSaveHistory]);

  const handleImageClick = useCallback((x: number, y: number) => {
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
        setDragStartPos({ x, y });
        return true;
      }
    }
    return false;
  }, [placedImages]);

  const handleImageDrag = useCallback((x: number, y: number) => {
    if (!isDraggingImage || selectedPlacedImage === null || !dragStartPos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const deltaX = x - dragStartPos.x;
    const deltaY = y - dragStartPos.y;

    const img = placedImages[selectedPlacedImage];
    const updatedImages = [...placedImages];
    updatedImages[selectedPlacedImage] = {
      ...img,
      x: Math.max(0, Math.min(canvas.width - img.width, img.x + deltaX)),
      y: Math.max(0, Math.min(canvas.height - img.height, img.y + deltaY))
    };
    setPlacedImages(updatedImages);
    setDragStartPos({ x, y });
  }, [isDraggingImage, selectedPlacedImage, dragStartPos, placedImages, canvasRef]);

  const stopImageDrag = useCallback(() => {
    if (isDraggingImage) {
      setIsDraggingImage(false);
      setDragStartPos(null);
      setSelectedPlacedImage(null);
      onSaveHistory();
    }
  }, [isDraggingImage, onSaveHistory]);

  const loadPlacedImages = useCallback((imageDataArray: PlacedImageData[]) => {
    const loadedImages: PlacedImage[] = [];
    let loadedCount = 0;

    if (!imageDataArray || imageDataArray.length === 0) {
      setPlacedImages([]);
      return;
    }

    imageDataArray.forEach((imgData) => {
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
        if (loadedCount === imageDataArray.length) {
          setPlacedImages(loadedImages);
        }
      };
      img.src = imgData.imageData;
    });
  }, []);

  const getPlacedImagesData = useCallback((): PlacedImageData[] => {
    return placedImages.map(img => ({
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      imageData: img.img.src
    }));
  }, [placedImages]);

  return {
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
  };
};
