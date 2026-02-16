import { useState } from 'react';

export const SprintForm = ({ sprint = null, onSubmit, loading = false, onCancel }) => {
  const [formData, setFormData] = useState({
    sprintNumber: sprint?.sprintNumber || '',
    color: sprint?.color || ''
  });

  const [teamPlanInput, setTeamPlanInput] = useState('');
  const [selectedTeamPlans, setSelectedTeamPlans] = useState(sprint?.teamPlans || []);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTeamPlan = () => {
    if (!teamPlanInput.trim()) {
      setErrors(prev => ({ ...prev, teamPlan: 'Team plan cannot be empty' }));
      return;
    }

    if (selectedTeamPlans.some(p => p.team_plan === teamPlanInput.trim())) {
      setErrors(prev => ({ ...prev, teamPlan: 'This team plan already exists' }));
      return;
    }

    setSelectedTeamPlans([...selectedTeamPlans, { team_plan: teamPlanInput.trim() }]);
    setTeamPlanInput('');
    setErrors(prev => ({ ...prev, teamPlan: '' }));
  };

  const handleRemoveTeamPlan = (index) => {
    setSelectedTeamPlans(selectedTeamPlans.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.sprintNumber.trim()) {
      newErrors.sprintNumber = 'Sprint number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      sprintNumber: formData.sprintNumber.trim(),
      color: formData.color || undefined,
      teamPlans: selectedTeamPlans.map(p => p.team_plan)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {sprint ? 'Edit Sprint' : 'Create New Sprint'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sprint Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sprint Number *
          </label>
          <input
            type="text"
            name="sprintNumber"
            value={formData.sprintNumber}
            onChange={handleInputChange}
            placeholder="e.g., Sprint 1, Sprint 2.5"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
              errors.sprintNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.sprintNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.sprintNumber}</p>
          )}
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sprint Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="color"
              value={formData.color || '#3B82F6'}
              onChange={handleInputChange}
              className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
            />
            <span className="text-sm text-gray-600">
              {formData.color ? formData.color : 'Random color will be assigned'}
            </span>
          </div>
        </div>

        {/* Team Plans */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Associated Team Plans
          </label>

          {/* Add Team Plan Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={teamPlanInput}
              onChange={(e) => {
                setTeamPlanInput(e.target.value);
                if (errors.teamPlan) {
                  setErrors(prev => ({ ...prev, teamPlan: '' }));
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeamPlan()}
              placeholder="Enter team plan details"
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                errors.teamPlan ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={handleAddTeamPlan}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              Add
            </button>
          </div>
          {errors.teamPlan && (
            <p className="text-xs text-red-500 mb-3">{errors.teamPlan}</p>
          )}

          {/* Team Plans List */}
          {selectedTeamPlans.length > 0 ? (
            <div className="space-y-2">
              {selectedTeamPlans.map((plan, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-800">{plan.team_plan}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeamPlan(index)}
                    className="text-red-500 hover:text-red-700 font-medium text-sm transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No team plans added yet</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:bg-blue-400"
          >
            {loading ? 'Saving...' : sprint ? 'Update Sprint' : 'Create Sprint'}
          </button>
        </div>
      </form>
    </div>
  );
};
