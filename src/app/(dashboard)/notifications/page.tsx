export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {/* Notification Groups */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">New</h2>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                    📊
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Campaign Performance Update
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your campaign "Summer Sale" has reached 1000 impressions
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      2 hours ago
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    •••
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Earlier</h2>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors opacity-60"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                    🔔
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      System Update
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      We've added new features to improve your experience
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      2 days ago
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    •••
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 