'use client';

import { useState, useEffect } from 'react';
import MonthView from './components/Calendar/MonthView';
import WeekView from './components/Calendar/WeekView';
import DayView from './components/Calendar/DayView';
import ListView from './components/Calendar/ListView';
import EventModal from './components/EventModal';
import { Event, ViewMode } from './types';
import NotificationSettings from './components/NotificationSettings';
import { useNotifications } from './hooks/useNotifications';


export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Bildirimler
  const { requestPermission, hasPermission } = useNotifications(events);


  useEffect(() => {
    const savedEvents = localStorage.getItem('ajanda-events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents);
      const eventsWithDates = parsedEvents.map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(eventsWithDates);
    } else {
      const demoEvents: Event[] = [
        {
          id: '1',
          title: 'Toplantı',
          date: new Date(),
          startTime: '10:00',
          endTime: '11:00',
          color: '#6366f1',
          description: 'Ekip toplantısı',
          notificationEnabled: true,
          notificationTime: 15
        },
        {
          id: '2',
          title: 'Spor',
          date: new Date(new Date().setDate(new Date().getDate() + 1)),
          startTime: '18:00',
          endTime: '19:00',
          color: '#10b981',
          description: 'Spor salonu',
        }
      ];
      setEvents(demoEvents);
      localStorage.setItem('ajanda-events', JSON.stringify(demoEvents));
    }
  }, []);

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem('ajanda-events', JSON.stringify(newEvents));
  };

  const handleSaveEvent = (event: Event) => {
    if (editingEvent) {
      const updatedEvents = events.map(e => e.id === event.id ? event : e);
      saveEvents(updatedEvents);
    } else {
      saveEvents([...events, event]);
    }
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    const filteredEvents = events.filter(e => e.id !== eventId);
    saveEvents(filteredEvents);
    setEditingEvent(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setSelectedDate(null);
    setShowEventModal(true);
  };

  const handleTimeSlotClick = (hour: number) => {
    const newDate = new Date(currentDate);
    newDate.setHours(hour, 0, 0, 0);
    setSelectedDate(newDate);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">📅 Ajanda</h1>
            <p className="text-[var(--foreground-secondary)]">
              {new Date().toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button 
            onClick={() => {
              setSelectedDate(null);
              setEditingEvent(null);
              setShowEventModal(true);
            }}
            className="px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium shadow-lg"
          >
            + Yeni Etkinlik
          </button>
          <NotificationSettings 
            hasPermission={hasPermission}
            onRequestPermission={requestPermission}
          />
        </div>
      </header>

      <main className="grid gap-6">
        <div className="flex gap-2 p-1 bg-[var(--background-secondary)] rounded-lg w-fit overflow-x-auto">
          <button 
            onClick={() => setViewMode('month')}
            className={`px-6 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${viewMode === 'month' ? 'bg-[var(--accent)]' : 'hover:bg-[var(--background-tertiary)]'}`}
          >
            Ay
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`px-6 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${viewMode === 'week' ? 'bg-[var(--accent)]' : 'hover:bg-[var(--background-tertiary)]'}`}
          >
            Hafta
          </button>
          <button 
            onClick={() => setViewMode('day')}
            className={`px-6 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${viewMode === 'day' ? 'bg-[var(--accent)]' : 'hover:bg-[var(--background-tertiary)]'}`}
          >
            Gün
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-6 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${viewMode === 'list' ? 'bg-[var(--accent)]' : 'hover:bg-[var(--background-tertiary)]'}`}
          >
            Liste
          </button>
        </div>

        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onDateChange={setCurrentDate}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onDateChange={setCurrentDate}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            events={events}
            onEventClick={handleEventClick}
          />
        )}

        <div className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-xl font-semibold mb-4">⏰ Yaklaşan Etkinlikler</h2>
          {getUpcomingEvents().length > 0 ? (
            <div className="space-y-3">
              {getUpcomingEvents().map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer"
                >
                  <div 
                    className="w-1 h-12 rounded"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-[var(--foreground-secondary)]">
                      {new Date(event.date).toLocaleDateString('tr-TR', { 
                        day: 'numeric', 
                        month: 'long',
                        weekday: 'short'
                      })}
                      {event.startTime && ` • ${event.startTime}`}
                    </div>
                  </div>
                  {event.notificationEnabled && (
                    <div className="text-[var(--accent)]">🔔</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--foreground-secondary)] text-sm">
              Henüz yaklaşan etkinlik yok
            </p>
          )}
        </div>
      </main>

      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
      />
    </div>
  );
}
