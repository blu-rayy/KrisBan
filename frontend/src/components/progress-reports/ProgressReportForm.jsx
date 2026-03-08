import { useState, useEffect, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { SprintBadge } from '../sprints/SprintBadge';
import { useSprints } from '../../hooks/useSprints';
import { CustomSelect } from '../shared/CustomSelect';

const SPRINT_OPTIONS = [
  'Sprint 1',
  'Sprint 1.5',
  'Sprint 2',
  'Sprint 3',
  'Sprint 3.5',
  'Sprint 4',
  'Sprint 4.5',
  'Sprint 5',
  'Sprint 6',
  'Others'
];

const CATEGORY_OPTIONS = [
  'Software Development',
  'Research',
  'Operations',
  'Project Management'
];

const parseSprintSortNumber = (label) => {
  const value = String(label || '').trim();
  const lower = value.toLowerCase();

  if (lower === 'others' || lower === 'other') {
    return Number.POSITIVE_INFINITY;
  }

  const match = lower.match(/(?:sprint\s*)?(\d+(?:\.\d+)?)/i);
  if (!match) return Number.NEGATIVE_INFINITY;

  const parsed = Number.parseFloat(match[1]);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const sprintLabelComparator = (a, b) => {
  const aLabel = String(a || '');
  const bLabel = String(b || '');

  const aLower = aLabel.toLowerCase();
  const bLower = bLabel.toLowerCase();

  const aIsOthers = aLower === 'others' || aLower === 'other';
  const bIsOthers = bLower === 'others' || bLower === 'other';

  if (aIsOthers && !bIsOthers) return -1;
  if (!aIsOthers && bIsOthers) return 1;

  const numDiff = parseSprintSortNumber(bLabel) - parseSprintSortNumber(aLabel);
  if (numDiff !== 0) return numDiff;

  return bLabel.localeCompare(aLabel, undefined, { numeric: true, sensitivity: 'base' });
};

export const ProgressReportForm = ({ members = [], reports = [], onSubmit, loading = false, userRole = 'USER' }) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { data: sprints = [] } = useSprints();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    memberId: '',
    sprintNo: 'Sprint 1',
    teamPlan: '',
    category: 'Software Development',
    taskDone: '',
    imageUrl: null
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sprintTeamPlans, setSprintTeamPlans] = useState([]);
  const [refreshingSprints, setRefreshingSprints] = useState(false);

  const teamPlanSuggestions = useMemo(() => {
    return [...new Set(
      (reports || [])
        .filter((report) => report.teamPlan && report.teamPlan.trim())
        .map((report) => report.teamPlan.trim())
    )].sort();
  }, [reports]);

  const sortedSprintLabels = [...new Set([
    ...sprints.map((sprint) => sprint.sprintNumber),
    ...SPRINT_OPTIONS
  ])].sort(sprintLabelComparator);

  // Set member to logged-in user (default for all users, including admins)
  useEffect(() => {
    if (user && user.id) {
      setFormData(prev => ({ ...prev, memberId: user.id }));
    }
  }, [user]);

  useEffect(() => {
    if (sprints.length > 0 && !sprints.some((sprint) => sprint.sprintNumber === formData.sprintNo)) {
      setFormData((prev) => ({ ...prev, sprintNo: sprints[0].sprintNumber }));
    }
  }, [sprints, formData.sprintNo]);

  // Update team plans when sprint changes
  useEffect(() => {
    const selectedSprint = sprints.find(s => s.sprintNumber === formData.sprintNo);
    if (selectedSprint && selectedSprint.teamPlans) {
      const normalizedPlans = selectedSprint.teamPlans
        .map((plan) => (typeof plan === 'string' ? plan : plan?.team_plan))
        .filter((plan) => typeof plan === 'string' && plan.trim())
        .map((plan) => plan.trim());

      setSprintTeamPlans(normalizedPlans);
    } else {
      setSprintTeamPlans([]);
    }
  }, [formData.sprintNo, sprints]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Show suggestions for team plan
    if (name === 'teamPlan' && value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleTeamPlanSuggestionClick = (suggestion) => {
    setFormData(prev => ({ ...prev, teamPlan: suggestion }));
    setShowSuggestions(false);
  };

  const handleRefreshSprints = async () => {
    try {
      setRefreshingSprints(true);
      await queryClient.invalidateQueries({ queryKey: ['sprints'] });
    } catch (err) {
      setError('Failed to refresh sprints');
    } finally {
      setRefreshingSprints(false);
    }
  };

  const getAllTeamPlanSuggestions = () => {
    const combinedSuggestions = [...new Set([...sprintTeamPlans, ...teamPlanSuggestions])];
    return combinedSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(formData.teamPlan.toLowerCase())
    );
  };

  const filteredSuggestions = getAllTeamPlanSuggestions();

  const processImageFile = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setImageFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    processImageFile(file);
  };

  const handlePasteImage = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        processImageFile(file);
        return;
      }
    }
  };

  const uploadImage = async (file) => {
    // For now, we'll use base64 encoding
    // In production, you might want to upload to a cloud storage service
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result); // Return base64 data URL
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.memberId) newErrors.memberId = 'Member is required';
    if (!formData.sprintNo) newErrors.sprintNo = 'Sprint is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.taskDone.trim()) newErrors.taskDone = 'Task Done is required';
    if (!imageFile && !formData.imageUrl) newErrors.image = 'Image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile && !formData.imageUrl) {
        setUploadingImage(true);
        imageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      const submitData = {
        date: formData.date,
        memberId: formData.memberId,
        sprintNo: formData.sprintNo,
        teamPlan: formData.teamPlan || '',
        category: formData.category,
        taskDone: formData.taskDone,
        imageUrl: imageUrl
      };

      await onSubmit(submitData);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        memberId: members.length > 0 ? members[0].id : '',
        sprintNo: 'Sprint 1',
        teamPlan: '',
        category: 'Software Development',
        taskDone: '',
        imageUrl: null
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.message || 'Failed to submit progress report');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card-soft p-6 mb-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-dark-charcoal mb-6">Add Progress Report Entry</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-dark-charcoal mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none transition ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
        </div>

        {/* Member */}
        <div>
          <label htmlFor="memberId" className="block text-sm font-medium text-dark-charcoal mb-2">
            Member <span className="text-red-500">*</span>
          </label>
          {userRole === 'ADMIN' && members.length > 1 ? (
            <CustomSelect
              id="memberId"
              value={String(formData.memberId)}
              onChange={(val) => handleInputChange({ target: { name: 'memberId', value: val } })}
              options={[
                { value: '', label: 'Select a member...' },
                ...members.map(member => ({ value: String(member.id), label: member.username || member.name || 'Unknown' }))
              ]}
              placeholder="Select a member..."
              error={!!errors.memberId}
            />
          ) : (
            <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-surface-ground text-dark-charcoal font-medium">
              {user?.username || 'Current User'}
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'ADMIN' && members.length > 1
              ? 'Select which team member to create an entry for'
              : 'Entry will be created for your account only'}
          </p>
          {errors.memberId && <p className="mt-1 text-sm text-red-500">{errors.memberId}</p>}
        </div>

        {/* Sprint No. */}
        <div>
          <label htmlFor="sprintNo" className="block text-sm font-medium text-dark-charcoal mb-2">
            Sprint No. <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <CustomSelect
              id="sprintNo"
              value={formData.sprintNo}
              onChange={(val) => handleInputChange({ target: { name: 'sprintNo', value: val } })}
              options={sortedSprintLabels.map((label) => ({
                value: label,
                label: label.startsWith('Sprint ') || label.toLowerCase() === 'others' ? label : `Sprint ${label}`
              }))}
              error={!!errors.sprintNo}
              className="flex-1"
            />
            <SprintBadge label={formData.sprintNo} />
          </div>
          {errors.sprintNo && <p className="mt-1 text-sm text-red-500">{errors.sprintNo}</p>}
        </div>

        {/* Team Plan */}
        <div className="relative">
          <label htmlFor="teamPlan" className="block text-sm font-medium text-dark-charcoal mb-2">
            Team Plan
          </label>
          <input
            type="text"
            id="teamPlan"
            name="teamPlan"
            value={formData.teamPlan}
            onChange={handleInputChange}
            onFocus={() => formData.teamPlan && setShowSuggestions(true)}
            placeholder="Enter team plan details or select from suggestions"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none transition"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-card-soft max-h-48 overflow-y-auto scrollbar-hide">
              <div className="p-2 text-xs text-gray-600 bg-surface-ground font-semibold">Suggestions for this sprint</div>
              {filteredSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTeamPlanSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm text-dark-charcoal border-b border-gray-100 last:border-b-0 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-dark-charcoal mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            id="category"
            value={formData.category}
            onChange={(val) => handleInputChange({ target: { name: 'category', value: val } })}
            options={CATEGORY_OPTIONS.map(cat => ({ value: cat, label: cat }))}
            error={!!errors.category}
          />
          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
        </div>

        {/* Task Done */}
        <div className="md:col-span-2">
          <label htmlFor="taskDone" className="block text-sm font-medium text-dark-charcoal mb-2">
            Task Done <span className="text-red-500">*</span>
          </label>
          <textarea
            id="taskDone"
            name="taskDone"
            value={formData.taskDone}
            onChange={handleInputChange}
            placeholder="Describe the task completed"
            rows="4"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none resize-none transition ${
              errors.taskDone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.taskDone && <p className="mt-1 text-sm text-red-500">{errors.taskDone}</p>}
        </div>

        {/* Image Upload */}
        <div className="md:col-span-2">
          <label htmlFor="image" className="block text-sm font-medium text-dark-charcoal mb-2">
            Image <span className="text-red-500">*</span> (Max 5MB)
          </label>
          {errors.image && <p className="mb-2 text-sm text-red-500">{errors.image}</p>}
          <div className="space-y-3">
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-forest-green hover:file:bg-green-100 disabled:opacity-50 transition"
            />
            {!imagePreview && (
              <div
                onPaste={handlePasteImage}
                tabIndex={0}
                className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 cursor-pointer hover:border-forest-green hover:text-forest-green focus:outline-none focus:border-forest-green transition select-none"
              >
                Click here and press Ctrl+V to paste a screenshot
              </div>
            )}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-40 w-auto rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            setFormData({
              date: new Date().toISOString().split('T')[0],
              memberId: user?.id || '',
              sprintNo: 'Sprint 1',
              teamPlan: '',
              category: 'Software Development',
              taskDone: '',
              imageUrl: null
            });
            setImageFile(null);
            setImagePreview(null);
            setErrors({});
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg text-dark-charcoal hover:bg-gray-50 font-medium transition"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="px-6 py-2 bg-gradient-action hover:opacity-90 text-white rounded-lg font-medium transition disabled:opacity-50"
        >
          {loading || uploadingImage ? 'Submitting...' : 'Submit Entry'}
        </button>
      </div>
    </form>
  );
};
