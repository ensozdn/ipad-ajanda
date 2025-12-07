'use client';

import { useEffect } from 'react';

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker kayıtlı:', registration.scope);
          })
          .catch((error) => {
            console.log('Service Worker kayıt hatası:', error);
          });
      });
    }
  }, []);

  return null;
}
