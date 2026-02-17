import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { sprintService } from '../services/sprintService';
import { SprintBadge } from './SprintBadge';
import { getBadgeStyle } from '../utils/badgeStyles';

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

export const ProgressReportTable = ({
  reports = [],
  loading = false,
  error = '',
  onDelete,
  onUpdate,
  currentUserId,
  userRole
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    sprintNo: '',
    teamPlan: '',
    category: '',
    taskDone: '',
    imageUrl: null
  });
  const [editErrors, setEditErrors] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState(false);
  const [sprints, setSprints] = useState([]);

  // Fetch sprints from database
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await sprintService.getSprints();
        setSprints(response.data.data || []);
      } catch (err) {
        console.log('Failed to fetch sprints');
      }
    };
    fetchSprints();
  }, []);

  // Get sprint index by name for consistent coloring
  const getSprintIndex = (sprintName) => {
    if (!sprintName || !Array.isArray(sprints)) return undefined;
    const index = sprints.findIndex(s => s.sprintNumber === sprintName);
    return index >= 0 ? index : undefined;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Software Development': 'bg-green-100 text-green-800',
      'Research': 'bg-orange-100 text-orange-800',
      'Operations': 'bg-blue-100 text-blue-800',
      'Project Management': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };



  const getMemberColor = (memberId) => {
    const colors = [
      'bg-red-100 text-red-900',
      'bg-blue-100 text-blue-900',
      'bg-green-100 text-green-900',
      'bg-purple-100 text-purple-900',
    ];
    // Create consistent color mapping based on memberId hash
    const hash = memberId ? memberId.charCodeAt(0) + memberId.charCodeAt(memberId.length - 1) : 0;
    return colors[hash % colors.length];
  };



  const canEditReport = (report) => {
    return userRole === 'ADMIN' || (report.createdBy && currentUserId && String(report.createdBy) === String(currentUserId));
  };

  const canDeleteReport = (report) => {
    return userRole === 'ADMIN' || (report.createdBy && currentUserId && String(report.createdBy) === String(currentUserId));
  };

  const handleDelete = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report entry?')) {
      onDelete(reportId);
    }
  };

  const handleEditClick = (report) => {
    setEditingId(report.id);
    setEditForm({
      date: report.date,
      sprintNo: report.sprintNo,
      teamPlan: report.teamPlan || '',
      category: report.category,
      taskDone: report.taskDone,
      imageUrl: report.imageUrl
    });
    setEditImagePreview(report.imageUrl || null);
    setEditImageFile(null);
    setEditErrors({});
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({
      date: '',
      sprintNo: '',
      teamPlan: '',
      category: '',
      taskDone: '',
      imageUrl: null
    });
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditErrors({});
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setEditErrors(prev => ({ ...prev, image: 'Please upload a valid image file' }));
      return;
    }

    setEditImageFile(file);
    setEditErrors(prev => ({ ...prev, image: '' }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (!editForm.date) newErrors.date = 'Date is required';
    if (!editForm.sprintNo) newErrors.sprintNo = 'Sprint is required';
    if (!editForm.category) newErrors.category = 'Category is required';
    if (!editForm.taskDone.trim()) newErrors.taskDone = 'Task Done is required';
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      setSubmittingEdit(true);
      let imageUrl = editForm.imageUrl;

      if (editImageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(editImageFile);
        });
      }

      const submitData = {
        date: editForm.date,
        sprintNo: editForm.sprintNo,
        teamPlan: editForm.teamPlan,
        category: editForm.category,
        taskDone: editForm.taskDone,
        imageUrl: imageUrl
      };

      await onUpdate(editingId, submitData);
      handleEditCancel();
    } catch (err) {
      setEditErrors(prev => ({ ...prev, submit: err.message || 'Failed to update' }));
    } finally {
      setSubmittingEdit(false);
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

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 mb-2">No progress reports yet.</p>
        <p className="text-gray-500 text-sm">Create your first entry above to get started!</p>
      </div>
    );
  }

  // Filter reports based on user role and permissions
  const filteredReports = reports.filter(report => {
    // Ensure we have necessary data
    if (!userRole || !currentUserId) return false;
    
    const isAdmin = userRole === 'ADMIN';
    const isOwnEntry = report.createdBy && String(report.createdBy) === String(currentUserId);
    
    // Show entry if: user is admin OR user created the entry
    return isAdmin || isOwnEntry;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredReports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-card-soft p-8 text-center border border-gray-100">
        <p className="text-gray-600 mb-2">You haven't created any progress reports yet.</p>
        <p className="text-gray-500 text-sm">Create your first entry above to get started! Your entries will appear here.</p>
      </div>
    );
  }

  // Get unique members for color assignment
  const memberColorMap = {};
  filteredReports.forEach(report => {
    if (report.memberId && !memberColorMap[report.memberId]) {
      memberColorMap[report.memberId] = getMemberColor(report.memberId);
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-hero border-b border-forest-green">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Member</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Sprint #</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Team Plan</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">What I Did Today</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReports.map(report => (
              <tr
                key={report.id}
                className="hover:bg-surface-ground transition duration-200"
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeStyle('member', report.memberName)}`}>
                    {report.memberName}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <SprintBadge label={report.sprintNo} index={getSprintIndex(report.sprintNo)} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {report.teamPlan || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeStyle('category', report.category)}`}>
                    {report.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-2xs">
                  <div className="truncate" title={report.taskDone}>
                    {report.taskDone && report.taskDone.length > 30 
                      ? `${report.taskDone.substring(0, 30)}...` 
                      : report.taskDone || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-left">
                  <div className="flex gap-2 justify-start">
                    {canEditReport(report) && (
                      <button
                        onClick={() => handleEditClick(report)}
                        className="text-forest-green hover:text-emerald-deep font-medium px-3 py-1 rounded hover:bg-green-50 transition"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteReport(report) && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-card-elevated max-w-2xl w-full max-h-96 overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-gradient-hero border-b border-emerald-deep px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Edit Progress Report</h3>
              <button
                onClick={handleEditCancel}
                className="text-white hover:text-gray-100 text-2xl transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {editErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, date: e.target.value }));
                      if (editErrors.date) setEditErrors(prev => ({ ...prev, date: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none text-sm transition ${
                      editErrors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.date && <p className="mt-1 text-xs text-red-500">{editErrors.date}</p>}
                </div>

                {/* Sprint */}
                <div>
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">
                    Sprint *
                  </label>
                  <select
                    value={editForm.sprintNo}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, sprintNo: e.target.value }));
                      if (editErrors.sprintNo) setEditErrors(prev => ({ ...prev, sprintNo: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none text-sm transition ${
                      editErrors.sprintNo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {sprints.map(sprint => (
                      <option key={sprint.id} value={sprint.sprintNumber}>
                        {sprint.sprintNumber.startsWith('Sprint ') ? sprint.sprintNumber : `Sprint ${sprint.sprintNumber}`}
                      </option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {editErrors.sprintNo && <p className="mt-1 text-xs text-red-500">{editErrors.sprintNo}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, category: e.target.value }));
                      if (editErrors.category) setEditErrors(prev => ({ ...prev, category: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none text-sm transition ${
                      editErrors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editErrors.category && <p className="mt-1 text-xs text-red-500">{editErrors.category}</p>}
                </div>

                {/* Team Plan */}
                <div>
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">
                    Team Plan
                  </label>
                  <input
                    type="text"
                    value={editForm.teamPlan}
                    onChange={(e) => setEditForm(prev => ({ ...prev, teamPlan: e.target.value }))}
                    placeholder="Enter team plan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none text-sm transition"
                  />
                </div>

                {/* Task Done */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">
                    Task Done *
                  </label>
                  <textarea
                    value={editForm.taskDone}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, taskDone: e.target.value }));
                      if (editErrors.taskDone) setEditErrors(prev => ({ ...prev, taskDone: '' }));
                    }}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none resize-none text-sm transition ${
                      editErrors.taskDone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.taskDone && <p className="mt-1 text-xs text-red-500">{editErrors.taskDone}</p>}
                </div>

                {/* Image */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">
                    Image (optional, max 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-forest-green hover:file:bg-green-100 transition"
                  />
                  {editErrors.image && <p className="mt-1 text-xs text-red-500">{editErrors.image}</p>}
                  {editImagePreview && (
                    <div className="mt-3">
                      <div className="relative inline-block">
                        <img src={editImagePreview} alt="Preview" className="h-32 w-auto rounded-lg border border-gray-300" />
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteImage(true)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-dark-charcoal hover:bg-gray-50 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-gradient-action hover:opacity-90 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Image Deletion */}
      {confirmDeleteImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-card-elevated p-6 max-w-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-dark-charcoal mb-2">Remove Image?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteImage(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-dark-charcoal font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditImageFile(null);
                  setEditImagePreview(null);
                  setEditForm(prev => ({ ...prev, imageUrl: null }));
                  setConfirmDeleteImage(false);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

