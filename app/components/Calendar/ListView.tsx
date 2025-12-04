'use client';

import { useState } from 'react';

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
  notificationEnabled?: boolean;
  notificationTime?: number;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
}

interface ListViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export default function ListView({ events, onEventClick }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  const filterEvents = (events: Event[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filtered = events;

    // Filtre uygula
    switch (filterType) {
      case 'upcoming':
        filtered = events.filter(e => new Date(e.date) >= now);
        break;
      case 'past':
        filtered = events.filter(e => new Date(e.date) < now);
        break;
      case 'today':
        filtered = events.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      default:
        filtered = events;
    }

    // Arama uygula
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sıralama
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    }

    return filtered;
  };

  const groupByDate = (events: Event[]) => {
    const groups: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const dateKey = new Date(event.date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return groups;
  };

  const filteredEvents = filterEvents(events);
  const groupedEvents = sortBy === 'date' ? groupByDate(filteredEvents) : null;

  const getEventStats = () => {
    const now = new Date();
    const total = events.length;
    const upcoming = events.filter(e => new Date(e.date) >= now).length;
    const past = events.filter(e => new Date(e.date) < now).length;
    const today = events.filter(e => {
      const eventDate = new Date(e.date);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      return eventDate >= todayStart && eventDate < todayEnd;
    }).length;

    return { total, upcoming, past, today };
  };

  const stats = getEventStats();

  return (
    <div className="grid gap-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.total}</div>
          <div className="text-sm text-[var(--foreground-secondary)]">Toplam</div>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--success)]">{stats.upcoming}</div>
          <div className="text-sm text-[var(--foreground-secondary)]">Yaklaşan</div>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--warning)]">{stats.today}</div>
          <div className="text-sm text-[var(--foreground-secondary)]">Bugün</div>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--foreground-secondary)]">{stats.past}</div>
          <div className="text-sm text-[var(--foreground-secondary)]">Geçmiş</div>
        </div>
      </div>

      {/* Filtreler ve Arama */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border)]">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Arama */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">🔍 Ara</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Etkinlik başlığı veya açıklama ara..."
              className="w-full px-4 py-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>

          {/* Filtre */}
          <div>
            <label className="block text-sm font-medium mb-2">📁 Filtre</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            >
              <option value="all">Tümü</option>
              <option value="today">Bugün</option>
              <option value="upcoming">Yaklaşan</option>
              <option value="past">Geçmiş</option>
            </select>
          </div>
        </div>

        {/* Sıralama */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSortBy('date')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'date' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
            }`}
          >
            📅 Tarihe Göre
          </button>
          <button
            onClick={() => setSortBy('title')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'title' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
            }`}
          >
            🔤 İsme Göre
          </button>
        </div>
      </div>

      {/* Etkinlik Listesi */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border)]">
        <h2 className="text-xl font-semibold mb-4">
          📋 Etkinlikler ({filteredEvents.length})
        </h2>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-[var(--foreground-secondary)]">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Etkinlik bulunamadı'}
            </p>
          </div>
        ) : sortBy === 'date' && groupedEvents ? (
          // Tarihe göre gruplu görünüm
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-3 text-[var(--accent)]">
                  {date}
                </h3>
                <div className="space-y-2">
                  {dateEvents.map(event => (
                    <EventCard key={event.id} event={event} onClick={onEventClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Basit liste görünümü
          <div className="space-y-2">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={onEventClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Event Card Komponenti
function EventCard({ event, onClick }: { event: Event; onClick: (event: Event) => void }) {
  const isPast = new Date(event.date) < new Date();
  
  return (
    <div
      onClick={() => onClick(event)}
      className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
        isPast ? 'opacity-60' : ''
      }`}
      style={{ 
        backgroundColor: event.color + '15',
        borderLeft: `4px solid ${event.color}`
      }}
    >
      <div className="flex items-start gap-4">
        {/* Renk göstergesi ve zaman */}
        <div className="flex-shrink-0">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: event.color + '30', color: event.color }}
          >
            {new Date(event.date).getDate()}
          </div>
          {event.startTime && (
            <div className="text-xs text-center mt-1 text-[var(--foreground-secondary)]">
              {event.startTime}
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-1" style={{ color: event.color }}>
                {event.title}
              </h4>
              {event.description && (
                <p className="text-sm text-[var(--foreground-secondary)] mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-[var(--foreground-secondary)]">
                  📅 {new Date(event.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                {event.startTime && event.endTime && (
                  <span className="text-[var(--foreground-secondary)]">
                    ⏰ {event.startTime} - {event.endTime}
                  </span>
                )}
                {event.recurring && event.recurring !== 'none' && (
                  <span className="px-2 py-1 rounded bg-[var(--background-tertiary)] text-xs">
                    🔄 {event.recurring === 'daily' ? 'Günlük' : event.recurring === 'weekly' ? 'Haftalık' : 'Aylık'}
                  </span>
                )}
                {event.notificationEnabled && (
                  <span className="text-[var(--accent)]">🔔</span>
                )}
              </div>
            </div>
            
            {isPast && (
              <span className="px-2 py-1 rounded bg-[var(--background-tertiary)] text-xs text-[var(--foreground-secondary)]">
                Geçmiş
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
