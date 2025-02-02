export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">AI Analysis</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Analysis */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-4">Performance Analysis</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            AI insights will be displayed here
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-4">AI Recommendations</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No recommendations yet. Start an analysis to get AI-powered insights.
              </p>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-4">Trend Analysis</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Trend data will be displayed here
          </div>
        </div>

        {/* Audience Insights */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-4">Audience Insights</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Audience data will be displayed here
          </div>
        </div>
      </div>
    </div>
  );
} 