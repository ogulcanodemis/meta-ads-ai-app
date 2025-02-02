export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Impressions', 'Clicks', 'CTR', 'Conversions'].map((metric) => (
          <div key={metric} className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric}</h3>
            <p className="text-2xl font-semibold mt-2">0</p>
            <span className="text-sm text-green-500">+0% vs last period</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-4">Performance Over Time</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart will be implemented
          </div>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-4">Campaign Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart will be implemented
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <h3 className="text-lg font-medium">Recent Campaigns</h3>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  No campaigns yet
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 