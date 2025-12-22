'use client';

interface TextInputModalProps {
  isOpen: boolean;
  initialText: string;
  fontSize: number;
  fontFamily: string;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const FONT_FAMILIES = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

export default function TextInputModal({
  isOpen,
  initialText,
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
  onSubmit,
  onCancel
}: TextInputModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('text') as string;
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90%]" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Metin Ekle</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Metin</label>
            <textarea
              name="text"
              defaultValue={initialText}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 font-medium"
              rows={3}
              placeholder="Metni buraya yazın..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Yazı Boyutu</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                min="8"
                max="72"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Yazı Tipi</label>
              <select
                value={fontFamily}
                onChange={(e) => onFontFamilyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-700">
              <span className="font-bold">İpucu:</span> Yazıyı ekledikten sonra silmek için{' '}
              <span className="font-semibold text-blue-600">Silgi</span> aracını seçin veya{' '}
              <span className="font-semibold text-blue-600">Geri Al</span> butonuna basın.
            </p>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-900 text-gray-900 hover:bg-gray-100 transition-colors font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
