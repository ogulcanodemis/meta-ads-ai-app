"use client";

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/utils/api';
import EditProfileModal from './edit-profile-modal';

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface ProfileData {
  user: {
    name: string;
    email: string;
    company: string;
    position: string;
    bio: string;
    expertise: string[];
    image: string | null;
  };
  stats: {
    activeCampaigns: number;
    totalBudget: number;
    performanceScore: number;
  };
  activities: Activity[];
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const result = await fetchWithAuth('/api/profile');
      if (result.error) {
        setError(result.error);
      } else {
        setProfileData(result.data);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!profileData) {
    return <div>No profile data available</div>;
  }

  const { user, stats, activities = [] } = profileData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              '👤'
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {user.position} at {user.company}
            </p>
            {user.bio && (
              <p className="mt-2 text-gray-600 dark:text-gray-300">{user.bio}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {user.expertise.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="col-span-1">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-medium">Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</p>
                <p className="text-2xl font-semibold">{stats.activeCampaigns}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
                <p className="text-2xl font-semibold">
                  ${stats.totalBudget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performance Score</p>
                <p className="text-2xl font-semibold text-green-500">
                  {stats.performanceScore}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 md:col-span-2">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {activity.type === 'campaign_update' ? '📊' : '🔔'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedData) => {
            try {
              const result = await fetchWithAuth('/api/profile', {
                method: 'PUT',
                body: JSON.stringify(updatedData),
              });

              if (result.error) {
                throw new Error(result.error);
              }

              // Refresh profile data
              await fetchProfile();
              setShowEditModal(false);
            } catch (err) {
              console.error('Failed to update profile:', err);
              // Handle error (show message to user)
            }
          }}
        />
      )}
    </div>
  );
} 