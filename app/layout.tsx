import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'SD Bandara Trading | Smart Inventory & Billing',
  description: 'Modern Inventory & Billing System',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#fff', minHeight: '100vh', margin: 0, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
} 