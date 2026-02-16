import { useState, useEffect, useContext } from 'react';
import { dashboardService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

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

export const ProgressReportForm = ({ members = [], onSubmit, loading = false }) => {
  const { user } = useContext(AuthContext);
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
  const [teamPlanSuggestions, setTeamPlanSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Set member to logged-in user only
  useEffect(() => {
    if (user && user.id) {
      setFormData(prev => ({ ...prev, memberId: user.id }));
    }
  }, [user]);

  // Fetch team plan history from progress reports
  useEffect(() => {
    const fetchTeamPlanHistory = async () => {
      try {
        const response = await dashboardService.getProgressReports();
        const uniquePlans = [...new Set(
          (response.data.data || [])
            .filter(r => r.teamPlan && r.teamPlan.trim())
            .map(r => r.teamPlan.trim())
        )].sort();
        setTeamPlanSuggestions(uniquePlans);
      } catch (err) {
        console.log('Failed to fetch team plan history');
      }
    };
    fetchTeamPlanHistory();
  }, []);

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

  const filteredSuggestions = teamPlanSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(formData.teamPlan.toLowerCase())
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (less than 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Progress Report Entry</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
        </div>

        {/* Member */}
        <div>
          <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-2">
            Member <span className="text-red-500">*</span>
          </label>
          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium">
            {user?.username || 'Current User'}
          </div>
          <p className="mt-1 text-sm text-gray-500">Entry will be created for your account only</p>
        </div>

        {/* Sprint No. */}
        <div>
          <label htmlFor="sprintNo" className="block text-sm font-medium text-gray-700 mb-2">
            Sprint No. <span className="text-red-500">*</span>
          </label>
          <select
            id="sprintNo"
            name="sprintNo"
            value={formData.sprintNo}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.sprintNo ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {SPRINT_OPTIONS.map(sprint => (
              <option key={sprint} value={sprint}>
                {sprint}
              </option>
            ))}
          </select>
          {errors.sprintNo && <p className="mt-1 text-sm text-red-500">{errors.sprintNo}</p>}
        </div>

        {/* Team Plan */}
        <div className="relative">
          <label htmlFor="teamPlan" className="block text-sm font-medium text-gray-700 mb-2">
            Team Plan
          </label>
          <input
            type="text"
            id="teamPlan"
            name="teamPlan"
            value={formData.teamPlan}
            onChange={handleInputChange}
            onFocus={() => formData.teamPlan && setShowSuggestions(true)}
            placeholder="Enter team plan details"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 text-xs text-gray-500 bg-gray-50">Previous entries</div>
              {filteredSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTeamPlanSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {CATEGORY_OPTIONS.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
        </div>

        {/* Task Done */}
        <div className="md:col-span-2">
          <label htmlFor="taskDone" className="block text-sm font-medium text-gray-700 mb-2">
            Task Done <span className="text-red-500">*</span>
          </label>
          <textarea
            id="taskDone"
            name="taskDone"
            value={formData.taskDone}
            onChange={handleInputChange}
            placeholder="Describe the task completed"
            rows="4"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
              errors.taskDone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.taskDone && <p className="mt-1 text-sm text-red-500">{errors.taskDone}</p>}
        </div>

        {/* Image Upload */}
        <div className="md:col-span-2">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Image <span className="text-red-500">*</span> (Max 5MB)
          </label>
          {errors.image && <p className="mb-2 text-sm text-red-500">{errors.image}</p>}
          <div className="space-y-4">
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {imagePreview && (
              <div className="relative">
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
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  Remove
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
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {loading || uploadingImage ? 'Submitting...' : 'Submit Entry'}
        </button>
      </div>
    </form>
  );
};
