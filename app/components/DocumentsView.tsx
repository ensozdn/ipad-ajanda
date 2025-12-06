'use client';

import { useState } from 'react';
import { Document } from '../types';
import DrawingCanvas from './DrawingCanvas';

interface DocumentsViewProps {
  documents: Document[];
  onSaveDocument: (document: Document) => void;
  onDeleteDocument: (id: string) => void;
}

export default function DocumentsView({ documents, onSaveDocument, onDeleteDocument }: DocumentsViewProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'Yeni Belge',
      createdAt: new Date(),
      updatedAt: new Date(),
      imageData: '',
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

  // Çizim modunda
  if (selectedDocument || isCreating) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] transition-colors"
          >
            ← Geri
          </button>
          <input
            type="text"
            value={selectedDocument?.title || 'Yeni Belge'}
            onChange={(e) => {
              if (selectedDocument) {
                setSelectedDocument({
                  ...selectedDocument,
                  title: e.target.value,
                });
              }
            }}
            className="px-4 py-2 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-center font-medium"
          />
          <div className="w-20"></div>
        </div>

        <DrawingCanvas
          onSave={handleSaveDrawing}
          initialData={selectedDocument?.imageData}
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

      {documents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--foreground-secondary)] text-lg">
            Henüz not oluşturmadınız
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <div
                onClick={() => handleOpenDocument(doc)}
                className="aspect-square bg-white rounded-t-lg overflow-hidden"
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
              </div>
              <div className="p-3">
                <h3 className="font-medium mb-1 truncate text-sm" onClick={() => handleOpenDocument(doc)}>
                  {doc.title}
                </h3>
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
