'use client';

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
}

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDateChange?: (date: Date) => void;
  onTimeSlotClick?: (hour: number) => void;
}

export default function DayView({ 
  currentDate, 
  events, 
  onEventClick, 
  onDateChange,
  onTimeSlotClick 
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const isSameDay = 
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear();
      
      if (!isSameDay) return false;
      
      if (event.startTime) {
        const eventHour = parseInt(event.startTime.split(':')[0]);
        return eventHour === hour;
      }
      
      return hour === 9; // Default saat
    });
  };

  const getTodayEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange?.(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    onDateChange?.(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getCurrentHour = () => {
    return isToday() ? new Date().getHours() : -1;
  };

  const todayEvents = getTodayEvents();

  return (
    <div className="grid gap-6">
      {/* Ana Bilgi Kartı */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-1">
              {currentDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
            </h2>
            <p className="text-lg text-[var(--foreground-secondary)]">
              {currentDate.toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={goToPreviousDay}
              className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
            >
              ← Önceki Gün
            </button>
            <button 
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isToday() 
                  ? 'bg-[var(--accent)] cursor-default' 
                  : 'bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
              }`}
            >
              Bugün
            </button>
            <button 
              onClick={goToNextDay}
              className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
            >
              Sonraki Gün →
            </button>
          </div>
        </div>

        {/* Özet Bilgi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--background-tertiary)] rounded-lg p-4">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-2xl font-bold">{todayEvents.length}</div>
            <div className="text-sm text-[var(--foreground-secondary)]">Etkinlik</div>
          </div>
          <div className="bg-[var(--background-tertiary)] rounded-lg p-4">
            <div className="text-2xl mb-1">⏰</div>
            <div className="text-2xl font-bold">
              {todayEvents.filter(e => e.startTime).length}
            </div>
            <div className="text-sm text-[var(--foreground-secondary)]">Zamanlanmış</div>
          </div>
          <div className="bg-[var(--background-tertiary)] rounded-lg p-4">
            <div className="text-2xl mb-1">🔔</div>
            <div className="text-2xl font-bold">
              {todayEvents.filter(e => e.notificationEnabled).length}
            </div>
            <div className="text-sm text-[var(--foreground-secondary)]">Bildirim Aktif</div>
          </div>
          <div className="bg-[var(--background-tertiary)] rounded-lg p-4">
            <div className="text-2xl mb-1">{isToday() ? '☀️' : '📅'}</div>
            <div className="text-2xl font-bold">
              {isToday() ? new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0') : '--:--'}
            </div>
            <div className="text-sm text-[var(--foreground-secondary)]">
              {isToday() ? 'Şu an' : 'Geçmiş/Gelecek'}
            </div>
          </div>
        </div>
      </div>

      {/* Saatlik Program */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="text-xl font-semibold mb-4">📋 Günlük Program</h3>
        
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <div className="space-y-1">
            {hours.map(hour => {
              const hourEvents = getEventsForHour(hour);
              const isCurrentHour = getCurrentHour() === hour;
              
              return (
                <div 
                  key={hour}
                  className={`flex gap-3 min-h-[80px] rounded-lg transition-all ${
                    isCurrentHour 
                      ? 'bg-[var(--accent)]/10 border-l-4 border-[var(--accent)]' 
                      : 'hover:bg-[var(--background-tertiary)]'
                  }`}
                >
                  {/* Saat Etiketi */}
                  <div className="flex-shrink-0 w-20 pt-3 pr-3 text-right">
                    <div className={`font-semibold ${isCurrentHour ? 'text-[var(--accent)]' : 'text-[var(--foreground-secondary)]'}`}>
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {isCurrentHour && (
                      <div className="text-xs text-[var(--accent)] font-medium mt-1">
                        Şimdi
                      </div>
                    )}
                  </div>

                  {/* Etkinlik Alanı */}
                  <div 
                    className="flex-1 py-3 cursor-pointer"
                    onClick={() => onTimeSlotClick?.(hour)}
                  >
                    {hourEvents.length > 0 ? (
                      <div className="space-y-2">
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            className="group p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                            style={{ 
                              backgroundColor: event.color + '20',
                              borderLeft: `4px solid ${event.color}`
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-semibold text-lg mb-1" style={{ color: event.color }}>
                                  {event.title}
                                </div>
                                {event.description && (
                                  <div className="text-sm text-[var(--foreground-secondary)] mb-2 line-clamp-2">
                                    {event.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                  {event.startTime && event.endTime && (
                                    <div className="flex items-center gap-1 text-[var(--foreground-secondary)]">
                                      <span>⏰</span>
                                      <span>{event.startTime} - {event.endTime}</span>
                                    </div>
                                  )}
                                  {event.notificationEnabled && (
                                    <div className="flex items-center gap-1" style={{ color: event.color }}>
                                      <span>🔔</span>
                                      <span className="text-xs">Bildirim aktif</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: event.color + '30' }}
                              >
                                {event.title.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center text-sm text-[var(--foreground-secondary)]/50 italic">
                        Etkinlik eklemek için tıkla
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tüm Gün Etkinlikleri (Saati olmayanlar) */}
      {todayEvents.filter(e => !e.startTime).length > 0 && (
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-xl font-semibold mb-4">📌 Tüm Gün Etkinlikleri</h3>
          <div className="grid gap-3">
            {todayEvents.filter(e => !e.startTime).map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
                style={{ 
                  backgroundColor: event.color + '20',
                  borderLeft: `4px solid ${event.color}`
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: event.color + '40' }}
                  >
                    {event.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: event.color }}>
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-sm text-[var(--foreground-secondary)] line-clamp-1">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
