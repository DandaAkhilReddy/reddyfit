import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {children}
      </main>
      <footer className="bg-green-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xl font-bold mb-2">Islanders Cricket Club</p>
          <p className="text-green-200 mb-4">Corpus Christi, Texas</p>
          <p className="text-sm text-green-300">
            <a href="mailto:" className="underline hover:text-white"></a>
          </p>
        </div>
      </footer>
    </div>
  );
}
