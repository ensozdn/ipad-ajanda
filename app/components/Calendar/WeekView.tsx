'use client';

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
}

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onTimeClick?: (date: Date, hour: number) => void;
  onDateChange?: (date: Date) => void;
}

export default function WeekView({ currentDate, events, onEventClick, onTimeClick, onDateChange }: WeekViewProps) {
  const getWeekDays = (date: Date) => {
    const days = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'den başlat
    
    current.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = getWeekDays(currentDate);

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange?.(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange?.(newDate);
  };

  const handleThisWeek = () => {
    onDateChange?.(new Date());
  };

  const getEventsForDateTime = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const isSameDay = 
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear();
      
      if (!isSameDay) return false;
      
      if (event.startTime) {
        const eventHour = parseInt(event.startTime.split(':')[0]);
        return eventHour === hour;
      }
      
      return hour === 9; // Default saat
    });
  };

  return (
    <div className="bg-[var(--background-secondary)] rounded-xl p-4 md:p-6 border border-[var(--border)]">
      {/* Hafta Başlığı */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Hafta Görünümü
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handlePreviousWeek}
            className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            ← Önceki Hafta
          </button>
          <button 
            onClick={handleThisWeek}
            className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            Bu Hafta
          </button>
          <button 
            onClick={handleNextWeek}
            className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            Sonraki Hafta →
          </button>
        </div>
      </div>

      {/* Hafta Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Gün Başlıkları */}
          <div className="grid grid-cols-8 gap-2 mb-2 sticky top-0 bg-[var(--background-secondary)] z-10 pb-2">
            <div className="text-sm font-semibold"></div>
            {weekDays.map((day, index) => {
              const isToday = new Date().toDateString() === day.toDateString();
              return (
                <div key={index} className="text-center">
                  <div className={`font-semibold ${isToday ? 'text-[var(--accent)]' : ''}`}>
                    {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm ${isToday ? 'text-[var(--accent)]' : 'text-[var(--foreground-secondary)]'}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Saat Grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-2 mb-1">
                <div className="text-sm text-[var(--foreground-secondary)] pr-2 text-right py-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = getEventsForDateTime(day, hour);
                  return (
                    <div
                      key={dayIndex}
                      onClick={() => onTimeClick?.(day, hour)}
                      className="bg-[var(--background-tertiary)] rounded p-2 min-h-[60px] hover:bg-[var(--border)] transition-colors cursor-pointer"
                    >
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className="text-xs px-2 py-1 rounded mb-1 cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: event.color, color: '#fff' }}
                        >
                          <div className="font-medium">{event.title}</div>
                          {event.startTime && (
                            <div className="opacity-90">{event.startTime}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
