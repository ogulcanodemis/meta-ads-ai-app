"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Route } from 'next';

type MenuItem = {
  icon: string;
  label: string;
  href: Route;
};

type HubspotItem = {
  label: string;
  href: Route;
};

const Sidebar = () => {
  const pathname = usePathname();
  const [isHubspotOpen, setIsHubspotOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' as Route },
    { icon: '📈', label: 'Campaigns', href: '/campaigns' as Route },
    { icon: '🤖', label: 'AI Analysis', href: '/analysis' as Route },
    { icon: '📑', label: 'Reports', href: '/reports' as Route },
  ];

  const hubspotItems: HubspotItem[] = [
    { label: 'Contacts', href: '/hubspot/contacts' as Route },
    { label: 'Deals', href: '/hubspot/deals' as Route },
    { label: 'Meta Ads Integration', href: '/hubspot/meta-ads' as Route },
    { label: 'Automation', href: '/hubspot/automation' as Route },
    { label: 'Analytics & Reports', href: '/hubspot/analytics' as Route },
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

        {/* HubSpot Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsHubspotOpen(!isHubspotOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith('/hubspot')
                ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔄</span>
              <span>HubSpot</span>
            </div>
            {isHubspotOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isHubspotOpen && (
            <div className="pl-10 mt-1 space-y-1">
              {hubspotItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-2 px-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar; 