import { useState, useMemo } from 'react';

export const ProgressReportViewOnly = ({ reports = [], loading = false, error = '' }) => {
  const [dateFilter, setDateFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const getCategoryColor = (category) => {
    const colors = {
      'Software Development': 'bg-green-100 text-green-800',
      'Research': 'bg-orange-100 text-orange-800',
      'Operations': 'bg-blue-100 text-blue-800',
      'Project Management': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSprintColor = (sprint) => {
    if (sprint === 'Others') return 'bg-gray-200 text-gray-900';
    if (sprint.includes('1.5') || sprint.includes('3.5') || sprint.includes('4.5')) {
      return 'bg-yellow-200 text-yellow-900';
    }
    return 'bg-blue-200 text-blue-900';
  };

  const getMemberColor = (index) => {
    const colors = [
      'bg-red-100 text-red-900',
      'bg-blue-100 text-blue-900',
      'bg-green-100 text-green-900',
      'bg-purple-100 text-purple-900',
      'bg-pink-100 text-pink-900',
      'bg-indigo-100 text-indigo-900'
    ];
    return colors[index % colors.length];
  };

  // Get unique sprints and categories for filters
  const uniqueSprints = [...new Set(reports.map(r => r.sprintNo))].sort();
  const uniqueCategories = [...new Set(reports.map(r => r.category))].sort();

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Date filter
      if (dateFilter !== 'all') {
        const reportDate = new Date(report.date);
        const now = new Date();
        let daysAgo = 0;

        if (dateFilter === '1week') daysAgo = 7;
        else if (dateFilter === '2weeks') daysAgo = 14;
        else if (dateFilter === '3weeks') daysAgo = 21;
        else if (dateFilter === '1month') daysAgo = 30;

        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        if (reportDate < cutoffDate) return false;
      }

      // Sprint filter
      if (sprintFilter !== 'all' && report.sprintNo !== sprintFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && report.category !== categoryFilter) return false;

      return true;
    });
  }, [reports, dateFilter, sprintFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading progress reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Date Range</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('1week')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '1week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Last 1 Week
            </button>
            <button
              onClick={() => setDateFilter('2weeks')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '2weeks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Last 2 Weeks
            </button>
            <button
              onClick={() => setDateFilter('3weeks')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '3weeks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Last 3 Weeks
            </button>
            <button
              onClick={() => setDateFilter('1month')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '1month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Last Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sprint Filter */}
          <div>
            <label htmlFor="sprintFilter" className="block text-sm font-semibold text-gray-900 mb-2">
              Sprint Number
            </label>
            <select
              id="sprintFilter"
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Sprints</option>
              {uniqueSprints.map(sprint => (
                <option key={sprint} value={sprint}>
                  {sprint}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredReports.length} of {reports.length} entries
        </div>
      </div>

      {/* Table */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-2">No progress reports match your filters.</p>
          <p className="text-gray-500 text-sm">Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-6 py-3 text-left text-sm font-bold border border-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-bold border border-gray-600">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-bold border border-gray-600">Sprint #</th>
                  <th className="px-6 py-3 text-left text-sm font-bold border border-gray-600">Team Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-bold border border-gray-600">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-bold border border-gray-600">What I Did Today</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200 whitespace-nowrap">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm border border-gray-200">
                      <span
                        className={`px-3 py-1 rounded font-medium text-sm inline-block ${getMemberColor(
                          index
                        )}`}
                      >
                        {report.memberName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm border border-gray-200">
                      <span
                        className={`px-3 py-1 rounded font-medium text-sm inline-block ${getSprintColor(
                          report.sprintNo
                        )}`}
                      >
                        {report.sprintNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">
                      {report.teamPlan || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm border border-gray-200">
                      <span
                        className={`px-3 py-1 rounded font-medium text-sm inline-block ${getCategoryColor(
                          report.category
                        )}`}
                      >
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200 max-w-md">
                      <div className="max-h-20 overflow-y-auto">{report.taskDone}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
