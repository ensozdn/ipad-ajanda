'use client';

import { useState, useEffect } from 'react';
import { Event } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  selectedDate?: Date | null;
  editingEvent?: Event | null;
}

const eventColors = [
  { name: 'Mor', value: '#6366f1' },
  { name: 'Yeşil', value: '#10b981' },
  { name: 'Mavi', value: '#3b82f6' },
  { name: 'Kırmızı', value: '#ef4444' },
  { name: 'Sarı', value: '#f59e0b' },
  { name: 'Pembe', value: '#ec4899' },
  { name: 'Turuncu', value: '#f97316' },
  { name: 'Camgöbeği', value: '#06b6d4' },
];

export default function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  selectedDate, 
  editingEvent 
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#6366f1');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState(15);

  useEffect(() => {
    if (editingEvent) {
      // Düzenleme modu
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setDate(new Date(editingEvent.date).toISOString().split('T')[0]);
      setStartTime(editingEvent.startTime || '09:00');
      setEndTime(editingEvent.endTime || '10:00');
      setColor(editingEvent.color);
      setRecurring(editingEvent.recurring || 'none');
      setNotificationEnabled(editingEvent.notificationEnabled || false);
      setNotificationTime(editingEvent.notificationTime || 15);
    } else if (selectedDate) {
      // Yeni etkinlik - seçili tarih var
      setDate(selectedDate.toISOString().split('T')[0]);
      resetForm();
    } else {
      // Yeni etkinlik - bugün
      setDate(new Date().toISOString().split('T')[0]);
      resetForm();
    }
  }, [editingEvent, selectedDate, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('09:00');
    setEndTime('10:00');
    setColor('#6366f1');
    setRecurring('none');
    setNotificationEnabled(true);
    setNotificationTime(15);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Lütfen bir başlık girin');
      return;
    }

    const event: Event = {
      id: editingEvent?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      startTime,
      endTime,
      color,
      recurring,
      notificationEnabled,
      notificationTime,
    };

    onSave(event);
    onClose();
    resetForm();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      if (confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
        onDelete(editingEvent.id);
        onClose();
        resetForm();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--background-secondary)] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[var(--border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">
            {editingEvent ? '✏️ Etkinliği Düzenle' : '➕ Yeni Etkinlik'}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium mb-2">Başlık *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              placeholder="Etkinlik başlığı"
              autoFocus
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium mb-2">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
              placeholder="Detaylar ekle..."
              rows={3}
            />
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-sm font-medium mb-2">Tarih *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>

          {/* Saat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Başlangıç</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bitiş</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Renk Seçimi */}
          <div>
            <label className="block text-sm font-medium mb-3">Renk</label>
            <div className="grid grid-cols-8 gap-2">
              {eventColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--background-secondary)] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Tekrarlama */}
          <div>
            <label className="block text-sm font-medium mb-2">Tekrarlama</label>
            <select
              value={recurring}
              onChange={(e) => setRecurring(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            >
              <option value="none">Tekrarlanmaz</option>
              <option value="daily">Her gün</option>
              <option value="weekly">Her hafta</option>
              <option value="monthly">Her ay</option>
            </select>
          </div>

          {/* Bildirim */}
          <div className="bg-[var(--background-tertiary)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">🔔 Bildirim</label>
              <button
                type="button"
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {notificationEnabled && (
              <select
                value={notificationTime}
                onChange={(e) => setNotificationTime(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
              >
                <option value={5}>5 dakika önce</option>
                <option value={15}>15 dakika önce</option>
                <option value={30}>30 dakika önce</option>
                <option value={60}>1 saat önce</option>
                <option value={120}>2 saat önce</option>
                <option value={1440}>1 gün önce</option>
              </select>
            )}
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 pt-4">
            {editingEvent && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 rounded-lg bg-[var(--error)] hover:opacity-90 transition-opacity font-medium"
              >
                🗑️ Sil
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
            >
              {editingEvent ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
