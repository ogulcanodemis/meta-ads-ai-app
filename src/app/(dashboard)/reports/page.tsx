export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Report Types */}
        {[
          {
            title: 'Campaign Performance',
            description: 'Detailed analysis of your campaign metrics and ROI',
            icon: '📈'
          },
          {
            title: 'Audience Insights',
            description: 'Demographics and behavior patterns of your target audience',
            icon: '👥'
          },
          {
            title: 'Budget Analysis',
            description: 'Spending patterns and budget optimization recommendations',
            icon: '💰'
          },
          {
            title: 'A/B Test Results',
            description: 'Performance comparison of different ad variations',
            icon: '🔄'
          },
          {
            title: 'Custom Reports',
            description: 'Create reports with your selected metrics and dimensions',
            icon: '📊'
          },
          {
            title: 'Scheduled Reports',
            description: 'Set up automated reports on a regular basis',
            icon: '⏰'
          }
        ].map((report) => (
          <div
            key={report.title}
            className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
          >
            <div className="text-3xl mb-4">{report.icon}</div>
            <h3 className="text-lg font-medium mb-2">{report.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {report.description}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <h3 className="text-lg font-medium">Recent Reports</h3>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  No reports yet
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