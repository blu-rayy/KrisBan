import { useState } from 'react';

export const ProgressReportTable = ({
  reports = [],
  loading = false,
  error = '',
  onDelete,
  currentUserId,
  userRole
}) => {
  const [expandedId, setExpandedId] = useState(null);

  const canDeleteReport = (report) => {
    return userRole === 'ADMIN' || report.createdBy === currentUserId;
  };

  const handleDelete = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report entry?')) {
      onDelete(reportId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">Loading progress reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 mb-2">No progress reports yet.</p>
        <p className="text-gray-500 text-sm">Create your first entry above to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Member</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sprint</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Team Plan</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Task Done</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Image</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map(report => (
              <tr
                key={report.id}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>
                    <p className="font-medium">{report.memberName}</p>
                    <p className="text-xs text-gray-500">{report.memberEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {report.sprintNo}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {report.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {report.teamPlan || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <button
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                    className="text-blue-600 hover:text-blue-800 underline max-w-xs truncate"
                  >
                    {expandedId === report.id ? 'Hide' : 'View'}
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  {report.imageUrl ? (
                    <button
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      ✓
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {canDeleteReport(report) && (
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Row Details */}
      {expandedId && reports.find(r => r.id === expandedId) && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="max-w-4xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reports.find(r => r.id === expandedId).memberName} - {new Date(reports.find(r => r.id === expandedId).date).toLocaleDateString()}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Done */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Task Done:</h4>
                <p className="text-gray-900 whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                  {reports.find(r => r.id === expandedId).taskDone}
                </p>
              </div>

              {/* Image */}
              {reports.find(r => r.id === expandedId).imageUrl && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Image:</h4>
                  <img
                    src={reports.find(r => r.id === expandedId).imageUrl}
                    alt="Progress report attachment"
                    className="max-h-96 rounded border border-gray-200 bg-white p-2"
                  />
                </div>
              )}

              {/* Additional Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Created:</h4>
                <p className="text-sm text-gray-600">
                  {new Date(reports.find(r => r.id === expandedId).createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Last Updated:</h4>
                <p className="text-sm text-gray-600">
                  {new Date(reports.find(r => r.id === expandedId).updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setExpandedId(null)}
              className="mt-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium"
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
