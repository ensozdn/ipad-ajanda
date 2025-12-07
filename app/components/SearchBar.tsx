'use client';

import { useState, useEffect } from 'react';
import { Event, Document } from '../types';

interface SearchBarProps {
  events: Event[];
  documents: Document[];
  onEventSelect: (event: Event) => void;
  onDocumentSelect: (document: Document) => void;
}

interface SearchResult {
  type: 'event' | 'document';
  item: Event | Document;
  title: string;
  description?: string;
  date?: Date;
}

export default function SearchBar({ events, documents, onEventSelect, onDocumentSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'events' | 'documents'>('all');

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Event'lerde ara
    if (activeFilter === 'all' || activeFilter === 'events') {
      events.forEach(event => {
        const titleMatch = event.title.toLowerCase().includes(query);
        const descriptionMatch = event.description?.toLowerCase().includes(query);
        
        if (titleMatch || descriptionMatch) {
          results.push({
            type: 'event',
            item: event,
            title: event.title,
            description: event.description,
            date: new Date(event.date)
          });
        }
      });
    }

    // Notlarda ara
    if (activeFilter === 'all' || activeFilter === 'documents') {
      documents.forEach(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query);
        
        if (titleMatch) {
          results.push({
            type: 'document',
            item: doc,
            title: doc.title,
            date: new Date(doc.updatedAt)
          });
        }
      });
    }

    // Tarihe göre sırala (en yeni en üstte)
    results.sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;
      return dateB - dateA;
    });

    setSearchResults(results);
  }, [searchQuery, events, documents, activeFilter]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'event') {
      onEventSelect(result.item as Event);
    } else {
      onDocumentSelect(result.item as Document);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark>
        : part
    );
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Etkinlik veya not ara..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {searchQuery && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Tümü ({events.length + documents.length})
          </button>
          <button
            onClick={() => setActiveFilter('events')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilter === 'events'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Etkinlikler ({events.length})
          </button>
          <button
            onClick={() => setActiveFilter('documents')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilter === 'documents'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Notlar ({documents.length})
          </button>
        </div>
      )}

      {/* Search Results */}
      {showResults && searchQuery && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${(result.item as any).id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left flex items-start gap-3"
                >
                  {/* Icon */}
                  <div className={`mt-1 ${result.type === 'event' ? 'text-blue-500' : 'text-green-500'}`}>
                    {result.type === 'event' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {highlightMatch(result.title, searchQuery)}
                    </div>
                    {result.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {highlightMatch(result.description, searchQuery)}
                      </div>
                    )}
                    {result.date && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {result.date.toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          ...(result.type === 'event' && {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        })}
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    result.type === 'event'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  }`}>
                    {result.type === 'event' ? 'Etkinlik' : 'Not'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Sonuç bulunamadı</p>
              <p className="text-sm mt-1">"{searchQuery}" için hiçbir şey bulunamadı</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
