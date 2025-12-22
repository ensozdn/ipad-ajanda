'use client';

import { ToolType, LineStyleType, BackgroundType } from '../types';
import { COLORS } from '../utils/constants';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  background: BackgroundType;
  setBackground: (bg: BackgroundType) => void;
  fillShape: boolean;
  setFillShape: (fill: boolean) => void;
  lineStyle: LineStyleType;
  setLineStyle: (style: LineStyleType) => void;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  showShapeMenu: boolean;
  setShowShapeMenu: (show: boolean) => void;
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

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  background,
  setBackground,
  fillShape,
  setFillShape,
  lineStyle,
  setLineStyle,
  showColorPicker,
  setShowColorPicker,
  showShapeMenu,
  setShowShapeMenu,
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
}: ToolbarProps) {
  return (
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
              title="Normal Kalem"
            >
              <img src="/pen-goodnotes.svg" alt="Kalem" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('highlighter')}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'highlighter' ? 'bg-yellow-400 text-white' : 'text-yellow-600 hover:bg-white'
              }`}
              title="Fosforlu"
            >
              <img src="/highlighter-goodnotes.svg" alt="Fosforlu" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('marker')}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'marker' ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-white'
              }`}
              title="Kalın Marker"
            >
              <img src="/marker-goodnotes.svg" alt="Marker" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('pencil')}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'pencil' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-white'
              }`}
              title="İnce Kalem"
            >
              <img src="/pencil-goodnotes.svg" alt="İnce Kalem" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('crayon')}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'crayon' ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-white'
              }`}
              title="Soft Pastel"
            >
              <img src="/crayon-goodnotes.svg" alt="Soft Pastel" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'eraser' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-white'
              }`}
              title="Silgi"
            >
              <img src="/eraser-goodnotes.svg" alt="Silgi" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'text' ? 'bg-green-600 text-white' : 'text-green-700 hover:bg-white'
              }`}
              title="Metin"
            >
              <img src="/text-goodnotes.svg" alt="Metin" className="w-5 h-5" />
            </button>
            <button
              onClick={onFileUpload}
              className={`p-2.5 rounded-md transition-all ${
                tool === 'image' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-white'
              }`}
              title="Fotoğraf"
            >
              <img src="/image-goodnotes.svg" alt="Fotoğraf" className="w-5 h-5" />
            </button>
          </div>

          {/* Şekil Araçları */}
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" strokeWidth={2} />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Renk Seçici */}
          <div className="relative">
            <button 
              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:border-gray-400 transition-colors"
              style={{ backgroundColor: color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Renk"
            />
          </div>

          {/* Kalınlık */}
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
            />
            <span className="text-sm font-medium text-gray-600 w-6">{lineWidth}</span>
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
              title="Geri Al"
            >
              <img src="/undo-goodnotes.svg" alt="Geri Al" className="w-5 h-5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-md ${
                canRedo ? 'text-gray-700 hover:bg-white' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="İleri Al"
            >
              <img src="/redo-goodnotes.svg" alt="İleri Al" className="w-5 h-5" />
            </button>
          </div>

          <div className="w-px h-8 bg-gray-300"></div>

          {/* Sayfa Navigasyonu */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={onPrevPage}
              disabled={currentPage === 0}
              className={`p-2 rounded-md ${
                currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white'
              }`}
              title="Önceki Sayfa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded-md ${
                currentPage === totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white'
              }`}
              title="Sonraki Sayfa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={onAddPage}
              className="p-2 rounded-md text-blue-600 hover:bg-white transition-all"
              title="Yeni Sayfa"
            >
              <img src="/addpage-goodnotes.svg" alt="Yeni Sayfa" className="w-5 h-5" />
            </button>
            {totalPages > 1 && (
              <button
                onClick={onDeletePage}
                className="p-2 rounded-md text-red-600 hover:bg-white transition-all"
                title="Bu Sayfayı Sil"
              >
                <img src="/deletepage-goodnotes.svg" alt="Sayfa Sil" className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="w-px h-8 bg-gray-300"></div>

          {/* Arka Plan */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBackground('plain')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                background === 'plain' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Düz
            </button>
            <button
              onClick={() => setBackground('lined')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                background === 'lined' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Çizgili
            </button>
            <button
              onClick={() => setBackground('grid')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                background === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kareli
            </button>
          </div>

          <div className="w-px h-8 bg-gray-300 mx-2"></div>

          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <img src="/clear-goodnotes.svg" alt="Temizle" className="w-4 h-4" />
            Temizle
          </button>
          <button
            onClick={onExportPNG}
            className="px-3 py-1.5 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center gap-1"
            title="PNG olarak indir"
          >
            <img src="/png-goodnotes.svg" alt="PNG" className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={onExportPDF}
            className="px-3 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-1"
            title="PDF olarak indir"
          >
            <img src="/pdf-goodnotes.svg" alt="PDF" className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium flex items-center gap-1"
          >
            <img src="/save-goodnotes.svg" alt="Kaydet" className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowColorPicker(false)}
          />
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
              {COLORS.map((c) => (
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

      {/* Shape Menu Modal */}
      {showShapeMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowShapeMenu(false)}
          />
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
                <img src="/line-goodnotes.svg" alt="Çizgi" className="w-6 h-6" />
                <span className="font-semibold text-gray-800">Çizgi</span>
              </button>
              <button
                onClick={() => { setTool('rectangle'); setShowShapeMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img src="/rectangle-goodnotes.svg" alt="Dikdörtgen" className="w-6 h-6" />
                <span className="font-semibold text-gray-800">Dikdörtgen</span>
              </button>
              <button
                onClick={() => { setTool('circle'); setShowShapeMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img src="/circle-goodnotes.svg" alt="Daire" className="w-6 h-6" />
                <span className="font-semibold text-gray-800">Daire</span>
              </button>
              <button
                onClick={() => { setTool('arrow'); setShowShapeMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img src="/arrow-goodnotes.svg" alt="Ok" className="w-6 h-6" />
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
    </div>
  );
}
