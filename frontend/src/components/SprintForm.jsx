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
    <div className="bg-white rounded-xl shadow-card-soft p-8 w-full border border-gray-100">
      <h2 className="text-2xl font-bold text-dark-charcoal mb-6">
        {sprint ? 'Edit Sprint' : 'Create New Sprint'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Row: Sprint Number and Color */}
        <div className="grid grid-cols-2 gap-6">
          {/* Sprint Number */}
          <div>
            <label className="block text-sm font-medium text-dark-charcoal mb-2">
              Sprint Number *
            </label>
            <input
              type="text"
              name="sprintNumber"
              value={formData.sprintNumber}
              onChange={handleInputChange}
              placeholder="e.g., Sprint 1, Sprint 2.5"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green outline-none transition ${
                errors.sprintNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.sprintNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.sprintNumber}</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-charcoal mb-2">
              Sprint Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={formData.color || '#15803d'}
                onChange={handleInputChange}
                className="w-14 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-forest-green transition"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {formData.color ? formData.color : 'Random color'}
              </span>
            </div>
          </div>
        </div>

        {/* Team Plans */}
        <div>
          <label className="block text-sm font-medium text-dark-charcoal mb-3">
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
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green outline-none transition ${
                errors.teamPlan ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={handleAddTeamPlan}
              className="px-4 py-2 bg-gradient-action hover:opacity-90 text-white rounded-lg font-medium transition"
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
                  className="flex justify-between items-center bg-surface-ground p-3 rounded-lg border border-gray-200"
                >
                  <span className="text-dark-charcoal">{plan.team_plan}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeamPlan(index)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm transition"
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
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-dark-charcoal rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-action hover:opacity-90 text-white rounded-lg font-medium transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : sprint ? 'Update Sprint' : 'Create Sprint'}
          </button>
        </div>
      </form>
    </div>
  );
};
