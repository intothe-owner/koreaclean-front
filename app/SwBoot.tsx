'use client';
import { useEffect } from 'react';

export default function SwBoot() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(() => console.log('SW registered'))
        .catch(console.error);
    }
  }, []);
  return null;
}