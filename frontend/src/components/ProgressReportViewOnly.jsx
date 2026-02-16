export const ProgressReportViewOnly = ({ reports = [], loading = false, error = '' }) => {
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

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 mb-2">No progress reports yet.</p>
        <p className="text-gray-500 text-sm">Check back later for entries!</p>
      </div>
    );
  }

  return (
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
            {reports.map((report, index) => (
              <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200 whitespace-nowrap">
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm border border-gray-200">
                  <select
                    disabled
                    value={report.memberName}
                    className={`px-3 py-1 rounded font-medium text-sm cursor-not-allowed ${getMemberColor(
                      index
                    )}`}
                  >
                    <option>{report.memberName}</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm border border-gray-200">
                  <select
                    disabled
                    value={report.sprintNo}
                    className={`px-3 py-1 rounded font-medium text-sm cursor-not-allowed ${getSprintColor(
                      report.sprintNo
                    )}`}
                  >
                    <option>{report.sprintNo}</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">
                  {report.teamPlan || '-'}
                </td>
                <td className="px-6 py-4 text-sm border border-gray-200">
                  <select
                    disabled
                    value={report.category}
                    className={`px-3 py-1 rounded font-medium text-sm cursor-not-allowed ${getCategoryColor(
                      report.category
                    )}`}
                  >
                    <option>{report.category}</option>
                  </select>
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
  );
};
