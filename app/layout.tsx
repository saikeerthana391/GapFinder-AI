import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'GapFinder AI — Discover Your Knowledge Gaps',
  description: 'Discover your knowledge gaps. Study smarter with AI-powered diagnostic quizzes and personalized revision plans.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
