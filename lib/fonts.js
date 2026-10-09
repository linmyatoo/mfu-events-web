import { Inter } from 'next/font/google';

/** Single app-wide font — headings and body both use this. */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});
