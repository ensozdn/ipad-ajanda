'use client';

interface ImagePlacementModalProps {
  imageWidth: number;
  onWidthChange: (width: number) => void;
  onPlace: () => void;
  onCancel: () => void;
}

export default function ImagePlacementModal({
  imageWidth,
  onWidthChange,
  onPlace,
  onCancel
}: ImagePlacementModalProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 z-50 flex items-center gap-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-gray-900">Boyut:</label>
        <input
          type="range"
          min="50"
          max="1000"
          value={imageWidth}
          onChange={(e) => onWidthChange(Number(e.target.value))}
          className="w-40 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-semibold text-gray-700 min-w-12">
          {Math.round(imageWidth)}px
        </span>
      </div>
      
      <button
        onClick={onPlace}
        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
      >
        Yapıştır
      </button>
      <button
        onClick={onCancel}
        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        İptal
      </button>
    </div>
  );
}
