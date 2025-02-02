"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '📈', label: 'Campaigns', href: '/campaigns' },
    { icon: '🤖', label: 'AI Analysis', href: '/analysis' },
    { icon: '📑', label: 'Reports', href: '/reports' },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 p-4 min-h-screen bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg" />
        <span className="font-semibold text-lg">Meta AI</span>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar; 