"use client";

import { RocketIcon } from 'lucide-react';

export default function HubspotAutomation() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">HubSpot Automation</h1>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
            <RocketIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Coming Soon
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            We're working on powerful automation features to help you streamline your Meta Ads and HubSpot integration.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-500">Planned features include:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Automated Campaign to Deal Matching</li>
              <li>• Smart ROI-based Campaign Management</li>
              <li>• Custom Notification Rules</li>
              <li>• Advanced Workflow Automation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 