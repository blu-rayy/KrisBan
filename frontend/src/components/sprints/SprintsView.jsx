import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { sprintService } from '../../services/sprintService';
import { SprintForm } from './SprintForm';
import { SprintTable } from './SprintTable';
import { useSprints } from '../../hooks/useSprints';
import { useQueryClient } from '@tanstack/react-query';

export const SprintsView = ({ userRole }) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const {
    data: sprints = [],
    isLoading: loading,
    isError,
    error
  } = useSprints();
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isError) {
      setErrorMessage(error?.message || 'Failed to load sprints');
    } else {
      setErrorMessage('');
    }
  }, [isError, error?.message]);

  const refreshSprintsAndRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sprints'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardRecentActivity'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboardLastWeekProgressStats'] })
    ]);
  };

  const handleCreateSprint = async (formData) => {
    try {
      setSubmitting(true);
      await sprintService.createSprint(formData);
      setShowForm(false);
      await refreshSprintsAndRelated();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-6 lg:p-8 space-y-6 dark:bg-dm-ground min-h-full">
      {/* Header - Forest Gradient Theme */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text">Sprints</h1>
          <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base lg:text-lg">Manage sprints and their associated team plans</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 sm:px-6 py-2 bg-gradient-action hover:shadow-lg text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 w-full sm:w-auto"
          >
            + New Sprint
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-[24px] shadow-card-soft">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <SprintForm
          onSubmit={handleCreateSprint}
          loading={submitting}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <SprintTable
        sprints={sprints}
        loading={loading}
        onRefresh={refreshSprintsAndRelated}
        userRole={userRole}
      />
    </div>
  );
};
