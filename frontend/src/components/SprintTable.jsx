import { useState } from 'react';
import { sprintService } from '../services/sprintService';
import { SprintBadge } from './SprintBadge';

export const SprintTable = ({ sprints = [], loading = false, onRefresh, userRole }) => {
  const [expandedSprints, setExpandedSprints] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const toggleExpanded = (sprintId) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const handleDeleteTeamPlan = async (teamPlanId, sprintId) => {
    try {
      await sprintService.removeTeamPlan(teamPlanId);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team plan');
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm('Are you sure you want to delete this sprint? This will also delete all associated team plans.')) {
      return;
    }

    try {
      setDeletingId(sprintId);
      await sprintService.deleteSprint(sprintId);
      onRefresh();
      setDeletingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sprint');
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading sprints...</div>;
  }

  if (sprints.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 text-lg">No sprints created yet</p>
        <p className="text-gray-500 text-sm">Create your first sprint to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {sprints.map((sprint) => (
        <div key={sprint.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
          {/* Sprint Header */}
          <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer" onClick={() => toggleExpanded(sprint.id)}>
            <div className="flex items-center gap-4">
              <SprintBadge label={sprint.sprintNumber} />
              <div>
                <p className="text-sm text-gray-600">
                  {sprint.teamPlans.length} team plan{sprint.teamPlans.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                {expandedSprints[sprint.id] ? '▼' : '▶'}
              </span>
              {userRole === 'ADMIN' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSprint(sprint.id);
                  }}
                  disabled={deletingId === sprint.id}
                  className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded transition disabled:opacity-50"
                >
                  {deletingId === sprint.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {/* Sprint Details (Expanded) */}
          {expandedSprints[sprint.id] && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
              {sprint.teamPlans.length > 0 ? (
                <div className="space-y-2">
                  {sprint.teamPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                    >
                      <span className="text-gray-800 flex-1">{plan.team_plan}</span>
                      {userRole === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteTeamPlan(plan.id, sprint.id)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No team plans associated yet</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
