"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/utils/api';

interface Settings {
  // Meta API Settings
  metaApiToken?: string;
  metaAccountName?: string;
  lastSynced?: string;
  updatedAt?: string;

  // App Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;

  // Notification Settings
  emailNotifications: boolean;
  campaignAlerts: boolean;
  budgetAlerts: boolean;
  performanceAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;

  // AI Settings
  autoAnalysis: boolean;
  analysisFrequency: 'daily' | 'weekly' | 'monthly';
  performanceThresholds: {
    roas: number;
    cpc: number;
    ctr: number;
  };
  aiSuggestions: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
  emailNotifications: true,
  campaignAlerts: true,
  budgetAlerts: true,
  performanceAlerts: true,
  dailyReports: false,
  weeklyReports: true,
  autoAnalysis: true,
  analysisFrequency: 'daily',
  performanceThresholds: {
    roas: 2,
    cpc: 1,
    ctr: 1
  },
  aiSuggestions: true
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'meta' | 'app' | 'notifications' | 'ai'>('meta');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching settings...');
      
      const response = await fetchWithAuth('/api/settings');
      console.log('Settings response:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Merge the response with default settings to ensure all properties exist
      setSettings({
        ...DEFAULT_SETTINGS,
        ...response,
        performanceThresholds: {
          ...DEFAULT_SETTINGS.performanceThresholds,
          ...(response.performanceThresholds || {})
        }
      });
      console.log('Settings updated:', response);
    } catch (err) {
      console.error('Settings error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      console.log('Saving settings:', settings);

      const response = await fetchWithAuth('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSettings(response);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings?.metaApiToken) {
      setError('Please enter a Meta API token first');
      return;
    }

    try {
      setIsTestingApi(true);
      setError(null);
      console.log('Testing connection...');

      const response = await fetchWithAuth('/api/meta/test', {
        method: 'POST',
        body: JSON.stringify({ token: settings.metaApiToken }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccessMessage('Connection successful!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchSettings();
    } catch (err) {
      console.error('Test connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    } finally {
      setIsTestingApi(false);
    }
  };

  const renderMetaSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Meta API Token
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="password"
            value={settings?.metaApiToken || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, metaApiToken: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter your Meta API token"
          />
          <button
            type="button"
            onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Get Token
          </button>
        </div>
      </div>

      {settings?.metaAccountName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Connected Account
          </label>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {settings.metaAccountName}
          </p>
        </div>
      )}

      {settings?.lastSynced && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Synced
          </label>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {new Date(settings.lastSynced).toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isTestingApi || !settings?.metaApiToken}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isTestingApi ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  );

  const renderAppSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme
        </label>
        <select
          value={settings.theme}
          onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as Settings['theme'] }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Language
        </label>
        <select
          value={settings.language}
          onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="tr">Türkçe</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Timezone
        </label>
        <select
          value={settings.timezone}
          onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Istanbul">Istanbul</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date Format
        </label>
        <select
          value={settings.dateFormat}
          onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Currency
        </label>
        <select
          value={settings.currency}
          onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="TRY">TRY (₺)</option>
        </select>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Notifications
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receive important updates via email
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.emailNotifications}
          onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Campaign Alerts
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get notified about campaign status changes
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.campaignAlerts}
          onChange={(e) => setSettings(prev => ({ ...prev, campaignAlerts: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget Alerts
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get notified when budget thresholds are reached
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.budgetAlerts}
          onChange={(e) => setSettings(prev => ({ ...prev, budgetAlerts: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Performance Alerts
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get notified about significant performance changes
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.performanceAlerts}
          onChange={(e) => setSettings(prev => ({ ...prev, performanceAlerts: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Daily Reports
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receive daily performance reports
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.dailyReports}
          onChange={(e) => setSettings(prev => ({ ...prev, dailyReports: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Weekly Reports
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receive weekly performance summaries
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.weeklyReports}
          onChange={(e) => setSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderAISettings = () => {
    // Ensure performanceThresholds exists with default values
    const thresholds = settings?.performanceThresholds || DEFAULT_SETTINGS.performanceThresholds;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Automatic Analysis
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Let AI analyze your campaigns automatically
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings?.autoAnalysis ?? DEFAULT_SETTINGS.autoAnalysis}
            onChange={(e) => setSettings(prev => ({ ...prev, autoAnalysis: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Analysis Frequency
          </label>
          <select
            value={settings?.analysisFrequency ?? DEFAULT_SETTINGS.analysisFrequency}
            onChange={(e) => setSettings(prev => ({ ...prev, analysisFrequency: e.target.value as Settings['analysisFrequency'] }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Performance Thresholds
          </label>
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">ROAS Target</label>
              <input
                type="number"
                value={thresholds.roas}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  performanceThresholds: {
                    ...thresholds,
                    roas: parseFloat(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Max CPC ($)</label>
              <input
                type="number"
                value={thresholds.cpc}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  performanceThresholds: {
                    ...thresholds,
                    cpc: parseFloat(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Min CTR (%)</label>
              <input
                type="number"
                value={thresholds.ctr}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  performanceThresholds: {
                    ...thresholds,
                    ctr: parseFloat(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Suggestions
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive AI-powered optimization suggestions
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings?.aiSuggestions ?? DEFAULT_SETTINGS.aiSuggestions}
            onChange={(e) => setSettings(prev => ({ ...prev, aiSuggestions: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Settings tabs">
          <button
            onClick={() => setActiveTab('meta')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'meta'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Meta API
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'app'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            App Settings
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            AI Settings
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {activeTab === 'meta' && renderMetaSettings()}
          {activeTab === 'app' && renderAppSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'ai' && renderAISettings()}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 