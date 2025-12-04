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

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onDateChange?: (date: Date) => void;
}

export default function MonthView({ currentDate, events, onDateClick, onEventClick, onDateChange }: MonthViewProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = [];

  // Önceki ayın son günlerini ekle
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Mevcut ayın günlerini ekle
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onDateChange?.(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    onDateChange?.(new Date());
  };

  return (
    <div className="bg-[var(--background-secondary)] rounded-xl p-4 md:p-6 border border-[var(--border)]">
      {/* Ay ve Yıl Başlığı */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={goToPreviousMonth}
            className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            ← Önceki
          </button>
          <button 
            onClick={goToToday}
            className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            Bugün
          </button>
          <button 
            onClick={goToNextMonth}
            className="px-4 py-2 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors"
          >
            Sonraki →
          </button>
        </div>
      </div>

      {/* Haftanın Günleri */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-sm py-2 text-[var(--foreground-secondary)]">
            {day}
          </div>
        ))}
      </div>

      {/* Takvim Günleri */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayEvents = getEventsForDate(date);
          const today = isToday(date);

          return (
            <div
              key={day}
              onClick={() => onDateClick(date)}
              className={`
                aspect-square p-2 rounded-lg cursor-pointer transition-all
                bg-[var(--background-tertiary)] hover:bg-[var(--border)]
                ${today ? 'ring-2 ring-[var(--accent)]' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${today ? 'text-[var(--accent)]' : ''}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`text-xs px-1 py-0.5 rounded truncate`}
                    style={{ backgroundColor: event.color + '40', color: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-[var(--foreground-secondary)] px-1">
                    +{dayEvents.length - 2} daha
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
