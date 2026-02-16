import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sprintService } from '../services/sprintService';
import { SprintForm } from './SprintForm';
import { SprintTable } from './SprintTable';

export const SprintsView = ({ userRole }) => {
  const { user } = useContext(AuthContext);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const response = await sprintService.getSprints();
      setSprints(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sprints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async (formData) => {
    try {
      setSubmitting(true);
      await sprintService.createSprint(formData);
      setShowForm(false);
      fetchSprints();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprints</h1>
          <p className="text-gray-600 text-sm mt-1">Manage sprints and their associated team plans</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          {showForm ? 'Cancel' : '+ New Sprint'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
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
        onRefresh={fetchSprints}
        userRole={userRole}
      />
    </div>
  );
};
