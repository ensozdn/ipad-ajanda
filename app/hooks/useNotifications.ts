'use client';

import { useEffect, useRef } from 'react';
import { Event } from '../types';

export function useNotifications(events: Event[]) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Bildirim izni iste
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Bu tarayıcı bildirimleri desteklemiyor');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Bildirim gönder
  const sendNotification = (event: Event) => {
    // Notification API yoksa (Safari mobil gibi) çık
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notification API desteklenmiyor');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('Bildirim izni yok');
      return;
    }

    console.log('Bildirim gönderiliyor:', event.title);

    try {
      const notification = new Notification(event.title, {
        body: event.description || `${event.startTime || ''} ${event.endTime ? '- ' + event.endTime : ''}`.trim() || 'Etkinlik zamanı',
        tag: event.id,
        requireInteraction: false,
        silent: false,
      });

      console.log('Bildirim oluşturuldu');

      notification.onclick = () => {
        console.log('Bildirime tıklandı');
        window.focus();
        notification.close();
      };

      notification.onerror = (e) => {
        console.error('Bildirim hatası:', e);
      };

      notification.onshow = () => {
        console.log('Bildirim gösterildi');
      };

      // Vibrasyon (mobil cihazlarda)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Ses çal
      try {
        const audio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
        audio.volume = 0.5;
        audio.play().catch((e) => {
          console.log('Ses çalma hatası:', e);
        });
      } catch (e) {
        console.log('Ses hatası:', e);
      }
    } catch (e) {
      console.error('Bildirim oluşturma hatası:', e);
    }
  };

  // Etkinlikleri kontrol et
  const checkEvents = () => {
    // Notification API yoksa (Safari mobil gibi) çık
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notification API desteklenmiyor');
      return;
    }
    
    if (Notification.permission !== 'granted') return;

    const now = new Date();

    events.forEach(event => {
      if (!event.notificationEnabled) return;
      if (notifiedEventsRef.current.has(event.id)) return;

      const eventDate = new Date(event.date);
      
      // Etkinlik saati varsa kullan
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      }

      // Bildirim zamanını hesapla
      const notificationTime = new Date(eventDate);
      notificationTime.setMinutes(
        notificationTime.getMinutes() - (event.notificationTime || 15)
      );

      // Bildirim zamanı geldiyse ve etkinlik geçmemişse
      if (now >= notificationTime && now < eventDate) {
        sendNotification(event);
        notifiedEventsRef.current.add(event.id);
        
        // localStorage'a kaydet (sayfa yenilenince tekrar bildirim göndermesin)
        try {
          const notified = JSON.parse(localStorage.getItem('notified-events') || '[]');
          notified.push(event.id);
          localStorage.setItem('notified-events', JSON.stringify(notified));
        } catch (e) {
          console.error('localStorage hatası:', e);
        }
      }
    });
  };

  // Component mount olunca
  useEffect(() => {
    // localStorage'dan bildirilen etkinlikleri yükle
    try {
      const notified = JSON.parse(localStorage.getItem('notified-events') || '[]');
      notifiedEventsRef.current = new Set(notified);
    } catch (e) {
      console.error('localStorage hatası:', e);
    }

    // Notification API yoksa (Safari mobil gibi) çık
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notification API bu cihazda desteklenmiyor (PWA olarak yükleyebilirsin)');
      return;
    }

    // İzin iste
    requestPermission();

    // Her 30 saniyede bir kontrol et
    intervalRef.current = setInterval(checkEvents, 30000);

    // İlk kontrolü hemen yap
    checkEvents();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [events]);

  return {
    requestPermission,
    hasPermission: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
  };
}

// Test bildirimi gönder
export const sendTestNotification = () => {
  // Notification API yoksa (Safari mobil)
  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('⚠️ Safari mobilde bildirimler desteklenmiyor.\n\n📱 Çözüm: Uygulamayı PWA olarak home screen\'e ekleyin!\n\n1. Safari\'de Share butonuna tıklayın\n2. "Add to Home Screen" seçin\n3. Oradan açtığınızda bildirimler çalışacak!');
    return false;
  }

  if (Notification.permission !== 'granted') {
    alert('⚠️ Bildirim izni verilmemiş. Lütfen önce izin verin.');
    return false;
  }

  try {
    const notification = new Notification('🎉 Test Bildirimi', {
      body: 'Bildirimler çalışıyor! Artık etkinlik hatırlatmaları alacaksınız.',
      requireInteraction: false,
      silent: false,
    });

    // Vibrasyon
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    notification.onclick = () => {
      console.log('Test bildirimine tıklandı');
      notification.close();
    };

    return true;
  } catch (e) {
    console.error('Bildirim hatası:', e);
    alert('❌ Bildirim gönderilemedi: ' + e);
    return false;
  }
};
