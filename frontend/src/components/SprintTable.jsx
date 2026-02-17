import { useState } from 'react';
import { sprintService } from '../services/sprintService';
import { SprintBadge } from './SprintBadge';

export const SprintTable = ({ sprints = [], loading = false, onRefresh, userRole }) => {
  const [expandedSprints, setExpandedSprints] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [deletingTeamPlanId, setDeletingTeamPlanId] = useState(null);
  const [error, setError] = useState('');
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editSprintNumber, setEditSprintNumber] = useState('');
  const [editingTeamPlanId, setEditingTeamPlanId] = useState(null);
  const [editTeamPlan, setEditTeamPlan] = useState('');

  const toggleExpanded = (sprintId) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const handleEditSprint = (sprint) => {
    setEditingSprintId(sprint.id);
    setEditSprintNumber(sprint.sprintNumber);
  };

  const handleSaveSprintEdit = async (sprintId) => {
    try {
      await sprintService.updateSprint(sprintId, { sprintNumber: editSprintNumber });
      onRefresh();
      setEditingSprintId(null);
      setEditSprintNumber('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update sprint');
    }
  };

  const handleEditTeamPlan = (plan) => {
    setEditingTeamPlanId(plan.id);
    setEditTeamPlan(plan.team_plan);
  };

  const handleSaveTeamPlanEdit = async (teamPlanId) => {
    try {
      await sprintService.updateTeamPlan(teamPlanId, editTeamPlan);
      onRefresh();
      setEditingTeamPlanId(null);
      setEditTeamPlan('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update team plan');
    }
  };

  const handleDeleteTeamPlan = async (teamPlanId, sprintId) => {
    if (!window.confirm('Are you sure you want to delete this team plan?')) {
      return;
    }
    try {
      setDeletingTeamPlanId(teamPlanId);
      await sprintService.removeTeamPlan(teamPlanId);
      onRefresh();
      setDeletingTeamPlanId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team plan');
      setDeletingTeamPlanId(null);
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
      <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-card-soft">
        <p className="text-dark-charcoal text-lg font-medium">No sprints created yet</p>
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

      {sprints.map((sprint, index) => (
        <div key={sprint.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-card-soft hover:shadow-card-elevated transition duration-200">
          {/* Sprint Header */}
          <div className="p-4 flex items-center justify-between hover:bg-surface-ground transition cursor-pointer duration-200" onClick={() => toggleExpanded(sprint.id)}>
            <div className="flex items-center gap-4">
              <SprintBadge label={sprint.sprintNumber} colorName={sprint.color} index={index} />
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
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleEditSprint(sprint)}
                    className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 text-forest-green rounded-lg transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSprint(sprint.id)}
                    disabled={deletingId === sprint.id}
                    className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    {deletingId === sprint.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sprint Edit Modal */}
          {editingSprintId === sprint.id && (
            <div className="border-t border-gray-100 bg-surface-ground p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editSprintNumber}
                  onChange={(e) => setEditSprintNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green transition"
                  placeholder="Sprint number"
                />
                <button
                  onClick={() => handleSaveSprintEdit(sprint.id)}
                  className="px-4 py-2 bg-gradient-action hover:opacity-90 text-white rounded-lg transition font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSprintId(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-white rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sprint Details (Expanded) */}
          {expandedSprints[sprint.id] && editingSprintId !== sprint.id && (
            <div className="border-t border-gray-100 bg-surface-ground p-4 space-y-3">
              {sprint.teamPlans.length > 0 ? (
                <div className="space-y-2">
                  {sprint.teamPlans.map((plan) => (
                    <div key={plan.id}>
                      {editingTeamPlanId === plan.id ? (
                        <div className="flex gap-2 bg-white p-3 rounded-lg border border-gray-200">
                          <input
                            type="text"
                            value={editTeamPlan}
                            onChange={(e) => setEditTeamPlan(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green transition"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTeamPlanEdit(plan.id)}
                            className="px-3 py-1 bg-gradient-action hover:opacity-90 text-white rounded-lg text-sm transition font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTeamPlanId(null)}
                            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-white rounded-lg text-sm transition font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-dark-charcoal flex-1">{plan.team_plan}</span>
                          {userRole === 'ADMIN' && (
                            <div className="ml-2 flex gap-2">
                              <button
                                onClick={() => handleEditTeamPlan(plan)}
                                className="text-forest-green hover:text-emerald-deep text-sm font-medium transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTeamPlan(plan.id, sprint.id)}
                                disabled={deletingTeamPlanId === plan.id}
                                className="text-red-600 hover:text-red-800 text-sm font-medium transition disabled:opacity-50"
                              >
                                {deletingTeamPlanId === plan.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
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
