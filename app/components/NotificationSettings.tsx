'use client';

import { useState, useEffect } from 'react';
import { sendTestNotification } from '../hooks/useNotifications';

interface NotificationSettingsProps {
  hasPermission: boolean;
  onRequestPermission: () => Promise<boolean>;
}

export default function NotificationSettings({ hasPermission, onRequestPermission }: NotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPermission(hasPermission);
  }, [hasPermission]);

  const handleRequestPermission = async () => {
    const granted = await onRequestPermission();
    setPermission(granted);
    
    if (granted) {
      // Test bildirimi gönder
      setTimeout(() => {
        sendTestNotification();
      }, 500);
    }
  };

  const handleTestNotification = () => {
    console.log('Test butonu tıklandı');
    console.log('Notification API var mı?', 'Notification' in window);
    console.log('Permission durumu:', typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'N/A');
    
    const success = sendTestNotification();
    console.log('Test sonucu:', success);
    
    if (!success) {
      alert('Bildirim izni verilmemiş. Lütfen önce izin verin.');
    } else {
      console.log('Test bildirimi başarıyla gönderildi');
    }
  };

  return (
    <>
      {/* Bildirim Durumu Badge */}
      {mounted && (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-lg transition-colors font-medium ${
            permission 
              ? 'bg-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)]/30' 
              : 'bg-[var(--warning)]/20 text-[var(--warning)] hover:bg-[var(--warning)]/30'
          }`}
          title="Bildirim Ayarları"
        >
          🔔 {permission ? 'Bildirimler Aktif' : 'Bildirimler Kapalı'}
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-[var(--background-secondary)] rounded-2xl p-6 max-w-md w-full border border-[var(--border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">🔔 Bildirim Ayarları</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Durum */}
              <div className={`p-4 rounded-lg ${
                permission 
                  ? 'bg-[var(--success)]/10 border border-[var(--success)]/30' 
                  : 'bg-[var(--warning)]/10 border border-[var(--warning)]/30'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`text-3xl ${permission ? '' : 'animate-pulse'}`}>
                    {permission ? '✅' : '⚠️'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">
                      {permission ? 'Bildirimler Aktif' : 'Bildirimler Kapalı'}
                    </div>
                    <div className="text-sm text-[var(--foreground-secondary)]">
                      {permission 
                        ? 'Etkinlik hatırlatmaları alacaksınız' 
                        : 'Etkinlik hatırlatmaları almıyorsunuz'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Bilgi */}
              <div className="space-y-3 text-sm text-[var(--foreground-secondary)]">
                <p>
                  <strong>📱 Nasıl çalışır?</strong><br />
                  Etkinlik saatinden belirttiğiniz süre önce bildirim alırsınız.
                </p>
                <p>
                  <strong>⏰ Bildirim Zamanı:</strong><br />
                  Her etkinlik için ayrı ayrı ayarlayabilirsiniz (5dk, 15dk, 30dk, 1 saat, vb.)
                </p>
                <p>
                  <strong>🔕 Kapatma:</strong><br />
                  Etkinlik eklerken/düzenlerken bildirimi kapatabilirsiniz.
                </p>
                {permission && (
                  <p className="text-xs bg-[var(--background-tertiary)] p-3 rounded-lg">
                    <strong>ℹ️ Bildirimleri tamamen kapatmak için:</strong><br />
                    Tarayıcı ayarlarından bu sitenin bildirim iznini kaldırın.
                  </p>
                )}
              </div>

              {/* Butonlar */}
              <div className="space-y-3">
                {!permission ? (
                  <button
                    onClick={handleRequestPermission}
                    className="w-full px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
                  >
                    ✅ Bildirimleri Aç
                  </button>
                ) : (
                  <button
                    onClick={handleTestNotification}
                    className="w-full px-6 py-3 rounded-lg bg-[var(--success)] hover:opacity-90 transition-opacity font-medium"
                  >
                    🧪 Test Bildirimi Gönder
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-6 py-3 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors font-medium"
                >
                  Kapat
                </button>
              </div>

              {/* Uyarı */}
              {!permission && (
                <div className="text-xs text-[var(--foreground-secondary)] bg-[var(--background-tertiary)] p-3 rounded-lg">
                  <strong>💡 İpucu:</strong> Safari'de bildirimleri açtıktan sonra, bu siteyi ana ekrana eklerseniz daha iyi çalışır.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
