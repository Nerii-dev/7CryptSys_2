import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (Navegação Lateral) */}
      <Sidebar />

      {/* Conteúdo Principal (Navbar + Página) */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Navbar (Topo) */}
        <Navbar />

        {/* Área de Conteúdo da Página (com scroll) */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};