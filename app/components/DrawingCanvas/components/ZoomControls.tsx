'use client';

interface ZoomControlsProps {
  scale: number;
  onReset: () => void;
}

export default function ZoomControls({ scale, onReset }: ZoomControlsProps) {
  if (scale === 1) return null;

  return (
    <>
      {/* Zoom Reset Butonu */}
      <button
        onClick={onReset}
        className="fixed bottom-6 right-6 px-4 py-3 rounded-full bg-blue-500 text-white shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-2 z-30 font-bold"
        title="Zoom'u Sıfırla"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
        Sıfırla
      </button>

      {/* Zoom Seviyesi */}
      <div className="fixed top-20 right-6 px-3 py-2 rounded-lg bg-black/70 text-white text-sm font-bold z-30">
        {Math.round(scale * 100)}%
      </div>
    </>
  );
}
