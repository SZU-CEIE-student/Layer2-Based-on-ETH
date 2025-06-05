'use client'

import App from './app';
import { Providers } from './providers';
import { useEffect } from 'react';
export default function Page() {
  useEffect(() => {
    document.title = "跨链桥";
  }, []);
  return (
    <Providers>
      <App />
    </Providers>
  );
}
