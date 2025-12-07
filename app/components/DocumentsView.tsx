'use client';

import { useState } from 'react';
import { Document, Category } from '../types';
import DrawingCanvas from './DrawingCanvas';

interface DocumentsViewProps {
  documents: Document[];
  onSaveDocument: (document: Document) => void;
  onDeleteDocument: (id: string) => void;
}

type BackgroundType = 'plain' | 'lined' | 'grid';

// Default kategoriler
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tümü', color: '#6366f1', icon: '📚' },
  { id: 'work', name: 'İş', color: '#3b82f6', icon: '💼' },
  { id: 'personal', name: 'Kişisel', color: '#10b981', icon: '✨' },
  { id: 'school', name: 'Okul', color: '#f59e0b', icon: '🎓' },
  { id: 'ideas', name: 'Fikirler', color: '#ec4899', icon: '💡' },
  { id: 'shopping', name: 'Alışveriş', color: '#8b5cf6', icon: '🛒' },
  { id: 'travel', name: 'Seyahat', color: '#06b6d4', icon: '✈️' },
];

export default function DocumentsView({ documents, onSaveDocument, onDeleteDocument }: DocumentsViewProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundType>('plain');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleCreateNew = () => {
    setShowBackgroundModal(true);
  };

  const handleBackgroundSelect = (background: BackgroundType) => {
    setSelectedBackground(background);
    setShowBackgroundModal(false);
    
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'Yeni Not',
      createdAt: new Date(),
      updatedAt: new Date(),
      imageData: '',
      background, // Arka plan tipini kaydet
    };
    setSelectedDocument(newDoc);
    setIsCreating(true);
  };

  const handleSaveDrawing = (imageData: string) => {
    if (!selectedDocument) return;

    const updatedDoc: Document = {
      ...selectedDocument,
      imageData,
      updatedAt: new Date(),
    };

    onSaveDocument(updatedDoc);
    setSelectedDocument(null);
    setIsCreating(false);
  };

  const handleOpenDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsCreating(false);
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
      onDeleteDocument(id);
      if (selectedDocument?.id === id) {
        setSelectedDocument(null);
        setIsCreating(false);
      }
    }
  };

  const handleToggleFavorite = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedDoc = {
      ...doc,
      isFavorite: !doc.isFavorite,
      updatedAt: new Date(),
    };
    onSaveDocument(updatedDoc);
  };

  const handleCategoryChange = (categoryId: string) => {
    if (!selectedDocument) return;
    const updatedDoc = {
      ...selectedDocument,
      category: categoryId === 'all' ? undefined : categoryId,
      updatedAt: new Date(),
    };
    setSelectedDocument(updatedDoc);
    onSaveDocument(updatedDoc);
    setShowCategoryModal(false);
  };

  const handleBack = () => {
    if (isCreating && !selectedDocument?.imageData) {
      // Yeni belge oluşturulurken geri dönülürse kaydetme
      setSelectedDocument(null);
      setIsCreating(false);
      return;
    }
    setSelectedDocument(null);
    setIsCreating(false);
  };

  // Filtrelenmiş notları al
  const filteredDocuments = documents.filter(doc => {
    // Favori filtresi
    if (filterMode === 'favorites' && !doc.isFavorite) return false;
    
    // Kategori filtresi
    if (selectedCategory !== 'all') {
      if (!doc.category && selectedCategory !== 'all') return false;
      if (doc.category !== selectedCategory) return false;
    }
    
    return true;
  });

  const favoriteCount = documents.filter(doc => doc.isFavorite).length;

  // Her kategorideki not sayısını hesapla
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return documents.length;
    return documents.filter(doc => doc.category === categoryId).length;
  };

  // Çizim modunda
  if (selectedDocument || isCreating) {
    const currentCategory = DEFAULT_CATEGORIES.find(cat => cat.id === selectedDocument?.category) || DEFAULT_CATEGORIES[0];
    
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] transition-colors"
          >
            ← Geri
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2 rounded-lg bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] transition-colors flex items-center gap-2"
              title="Kategori değiştir"
            >
              <span className="text-lg">{currentCategory.icon}</span>
              <span className="text-sm">{currentCategory.name}</span>
            </button>
            <input
              type="text"
              value={selectedDocument?.title || 'Yeni Not'}
              onChange={(e) => {
                if (selectedDocument) {
                  setSelectedDocument({
                    ...selectedDocument,
                    title: e.target.value,
                  });
                }
              }}
              placeholder="Not başlığı"
              className="px-4 py-2 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-center font-medium"
            />
          </div>
          <div className="w-20"></div>
        </div>

        {/* Kategori Seçim Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCategoryModal(false)}>
            <div className="bg-[var(--background-secondary)] rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Kategori Seçin</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_CATEGORIES.slice(1).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`p-4 rounded-lg transition-all flex items-center gap-3 ${
                      selectedDocument?.category === category.id
                        ? 'ring-2 ring-offset-2 scale-105'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: category.color + '20',
                      borderColor: category.color,
                      borderWidth: selectedDocument?.category === category.id ? '2px' : '1px',
                    }}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleCategoryChange('all')}
                className="w-full mt-3 p-3 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background-hover)] transition-colors"
              >
                Kategorisiz
              </button>
            </div>
          </div>
        )}

        <DrawingCanvas
          onSave={handleSaveDrawing}
          initialData={selectedDocument?.imageData}
          initialBackground={selectedDocument?.background || 'plain'}
        />
      </div>
    );
  }

  // Belge listesi
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notlarım</h2>
        <button
          onClick={handleCreateNew}
          className="px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
        >
          + Yeni Not
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterMode === 'all'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)]'
          }`}
        >
          Tüm Notlar ({documents.length})
        </button>
        <button
          onClick={() => setFilterMode('favorites')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filterMode === 'favorites'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)]'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          Favorilerim ({favoriteCount})
        </button>
      </div>

      {/* Kategori Filtreleri */}
      <div className="flex gap-2 flex-wrap">
        {DEFAULT_CATEGORIES.filter(cat => cat.id !== 'all').map((category) => {
          const count = getCategoryCount(category.id);
          if (count === 0) return null;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'scale-105 shadow-lg text-white'
                  : 'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)]'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : undefined,
              }}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
              <span className={`text-sm ${selectedCategory === category.id ? 'opacity-90' : 'opacity-60'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Sayfa Türü Seçim Modal */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBackgroundModal(false)}>
          <div className="bg-[var(--background-secondary)] rounded-lg p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6">Sayfa Türünü Seçin</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleBackgroundSelect('plain')}
                className="w-full p-4 rounded-lg bg-white hover:bg-gray-100 transition-colors text-gray-800 font-medium border-2 border-transparent hover:border-blue-500 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-white border border-gray-300 rounded"></div>
                <span>Düz Sayfa</span>
              </button>
              <button
                onClick={() => handleBackgroundSelect('lined')}
                className="w-full p-4 rounded-lg bg-white hover:bg-gray-100 transition-colors text-gray-800 font-medium border-2 border-transparent hover:border-blue-500 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-white border border-gray-300 rounded flex flex-col justify-around p-1">
                  <div className="h-px bg-gray-300"></div>
                  <div className="h-px bg-gray-300"></div>
                  <div className="h-px bg-gray-300"></div>
                  <div className="h-px bg-gray-300"></div>
                </div>
                <span>Çizgili Sayfa</span>
              </button>
              <button
                onClick={() => handleBackgroundSelect('grid')}
                className="w-full p-4 rounded-lg bg-white hover:bg-gray-100 transition-colors text-gray-800 font-medium border-2 border-transparent hover:border-blue-500 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-white border border-gray-300 rounded" style={{
                  backgroundImage: 'linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)',
                  backgroundSize: '8px 8px'
                }}></div>
                <span>Kareli Sayfa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--foreground-secondary)] text-lg">
            {filterMode === 'favorites' 
              ? 'Henüz favori notunuz yok'
              : 'Henüz not oluşturmadınız'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <div
                onClick={() => handleOpenDocument(doc)}
                className="aspect-square bg-white rounded-t-lg overflow-hidden relative group"
              >
                {doc.imageData ? (
                  <img
                    src={doc.imageData}
                    alt={doc.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Boş Not
                  </div>
                )}
                
                {/* Favori butonu - hover'da görünür */}
                <button
                  onClick={(e) => handleToggleFavorite(doc, e)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title={doc.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                  <svg 
                    className={`w-5 h-5 ${doc.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`} 
                    fill={doc.isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                    />
                  </svg>
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={doc.title}
                    onChange={(e) => {
                      const updatedDoc = {
                        ...doc,
                        title: e.target.value,
                        updatedAt: new Date(),
                      };
                      onSaveDocument(updatedDoc);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Not başlığı"
                    className="flex-1 font-medium text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1"
                  />
                  {doc.category && (
                    <span 
                      className="text-lg flex-shrink-0"
                      title={DEFAULT_CATEGORIES.find(c => c.id === doc.category)?.name}
                    >
                      {DEFAULT_CATEGORIES.find(c => c.id === doc.category)?.icon}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--foreground-secondary)]">
                  <span>
                    {new Date(doc.updatedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id);
                    }}
                    className="text-[var(--error)] hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
