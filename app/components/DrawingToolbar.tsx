'use client';

interface DrawingToolbarProps {
  tool: string;
  setTool: (tool: string) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  background: 'plain' | 'lined' | 'grid';
  setBackground: (bg: 'plain' | 'lined' | 'grid') => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onFileUpload: () => void;
}

export default function DrawingToolbar({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  background,
  setBackground,
  onClear,
  onUndo,
  onRedo,
  onSave,
  onExportPNG,
  onExportPDF,
  canUndo,
  canRedo,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddPage,
  onDeletePage,
  onFileUpload,
}: DrawingToolbarProps) {
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD',
  ];

  return (
    <>
      {/* Ana Toolbar - Sabit */}
      <div className="bg-white border-b border-gray-200 shadow-md flex-shrink-0">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-2 min-w-max">
            {/* Araçlar */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-2.5 rounded-md transition-all ${
                  tool === 'pen' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-white'
                }`}
                title="Kalem"
              >
                ✏️
              </button>
              <button
                onClick={() => setTool('highlighter')}
                className={`p-2.5 rounded-md transition-all ${
                  tool === 'highlighter' ? 'bg-yellow-400 text-white' : 'text-yellow-600 hover:bg-white'
                }`}
                title="Fosforlu"
              >
                🖍️
              </button>
              <button
                onClick={() => setTool('marker')}
                className={`p-2.5 rounded-md transition-all ${
                  tool === 'marker' ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-white'
                }`}
                title="Marker"
              >
                🖊️
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2.5 rounded-md transition-all ${
                  tool === 'eraser' ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-white'
                }`}
                title="Silgi"
              >
                🧹
              </button>
              <button
                onClick={() => setTool('text')}
                className={`p-2.5 rounded-md transition-all ${
                  tool === 'text' ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-white'
                }`}
                title="Metin"
              >
                📝
              </button>
              <button
                onClick={onFileUpload}
                className={`p-2.5 rounded-md transition-all ${
                  tool === 'image' ? 'bg-indigo-500 text-white' : 'text-indigo-600 hover:bg-white'
                }`}
                title="Fotoğraf"
              >
                📷
              </button>
            </div>

            {/* Renk */}
            <div className="flex items-center gap-1">
              <div 
                className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                style={{ backgroundColor: color }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.value = color;
                  input.onchange = (e) => setColor((e.target as HTMLInputElement).value);
                  input.click();
                }}
              />
              <div className="flex gap-1">
                {colors.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-md border-2 ${
                      color === c ? 'border-blue-500 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Kalınlık */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-gray-600">Kalınlık</span>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-20 h-2 bg-gray-300 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800 w-6">{lineWidth}</span>
            </div>

            <div className="w-px h-8 bg-gray-300"></div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-md ${
                  canUndo ? 'text-gray-700 hover:bg-white' : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                ↶
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 rounded-md ${
                  canRedo ? 'text-gray-700 hover:bg-white' : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                ↷
              </button>
            </div>

            <div className="w-px h-8 bg-gray-300"></div>

            {/* Sayfa Navigasyonu */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={onPrevPage}
                disabled={currentPage === 0}
                className={`p-2 rounded-md ${
                  currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-white'
                }`}
              >
                ◀
              </button>
              <span className="text-sm font-bold text-gray-700 px-2">
                {currentPage + 1}/{totalPages}
              </span>
              <button
                onClick={onNextPage}
                disabled={currentPage === totalPages - 1}
                className={`p-2 rounded-md ${
                  currentPage === totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-white'
                }`}
              >
                ▶
              </button>
              <button
                onClick={onAddPage}
                className="p-2 rounded-md text-blue-600 hover:bg-white"
                title="Yeni Sayfa"
              >
                ➕
              </button>
              {totalPages > 1 && (
                <button
                  onClick={onDeletePage}
                  className="p-2 rounded-md text-red-600 hover:bg-white"
                  title="Sayfayı Sil"
                >
                  🗑️
                </button>
              )}
            </div>

            <div className="w-px h-8 bg-gray-300"></div>

            {/* Arka Plan */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBackground('plain')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md ${
                  background === 'plain' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Düz
              </button>
              <button
                onClick={() => setBackground('lined')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md ${
                  background === 'lined' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Çizgili
              </button>
              <button
                onClick={() => setBackground('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md ${
                  background === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Kareli
              </button>
            </div>

            <div className="w-px h-8 bg-gray-300"></div>

            {/* Aksiyonlar */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClear}
                className="px-3 py-1.5 text-sm font-bold rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Temizle
              </button>
              <button
                onClick={onExportPNG}
                className="px-3 py-1.5 text-sm font-bold rounded-lg bg-purple-500 text-white hover:bg-purple-600"
              >
                PNG
              </button>
              <button
                onClick={onExportPDF}
                className="px-3 py-1.5 text-sm font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600"
              >
                PDF
              </button>
              <button
                onClick={onSave}
                className="px-4 py-1.5 text-sm font-bold rounded-lg bg-green-500 text-white hover:bg-green-600"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
