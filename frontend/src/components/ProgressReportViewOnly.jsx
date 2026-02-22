import { useState, useMemo, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SprintBadge } from './SprintBadge';
import { getBadgeStyle } from '../utils/badgeStyles';
import { useSprints } from '../hooks/useSprints';

export const ProgressReportViewOnly = ({ reports = [], loading = false, error = '', onDelete, onUpdate, currentUserId, userRole }) => {
  const { user } = useContext(AuthContext);
  const [dateFilter, setDateFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
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
  const { data: sprints = [] } = useSprints();

  const SPRINT_OPTIONS = [
    'Sprint 1', 'Sprint 1.5', 'Sprint 2', 'Sprint 3', 'Sprint 3.5', 'Sprint 4', 'Sprint 4.5', 'Sprint 5', 'Sprint 6', 'Others'
  ];

  const CATEGORY_OPTIONS = [
    'Software Development', 'Research', 'Operations', 'Project Management'
  ];

  // Get sprint index by name for consistent coloring
  const getSprintIndex = (sprintName) => {
    if (!sprintName || !Array.isArray(sprints)) return undefined;
    const index = sprints.findIndex(s => s.sprintNumber === sprintName);
    return index >= 0 ? index : undefined;
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
      date: report.date?.split('T')[0] || '',
      sprintNo: report.sprintNo || '',
      teamPlan: report.teamPlan || '',
      category: report.category || '',
      taskDone: report.taskDone || '',
      imageUrl: report.imageUrl || null
    });
    setEditImagePreview(report.imageUrl || null);
    setEditImageFile(null);
    setEditErrors({});
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ date: '', sprintNo: '', teamPlan: '', category: '', taskDone: '', imageUrl: null });
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
    if (!editForm.taskDone) newErrors.taskDone = 'Task Done is required';
    return newErrors;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateEditForm();
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    setSubmittingEdit(true);
    try {
      const formData = {
        date: editForm.date,
        sprintNo: editForm.sprintNo,
        teamPlan: editForm.teamPlan,
        category: editForm.category,
        taskDone: editForm.taskDone
      };

      if (editImageFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          formData.imageUrl = reader.result;
          await onUpdate(editingId, formData);
          handleEditCancel();
        };
        reader.readAsDataURL(editImageFile);
      } else if (editImagePreview) {
        formData.imageUrl = editImagePreview;
        await onUpdate(editingId, formData);
        handleEditCancel();
      }
    } catch (err) {
      setEditErrors({ submit: err.message || 'Failed to update report' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Software Development': 'bg-green-100 text-green-800',
      'Research': 'bg-orange-100 text-orange-800',
      'Operations': 'bg-blue-100 text-blue-800',
      'Project Management': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };;

  // Get unique sprints and categories for filters
  const uniqueSprints = [...new Set(reports.map(r => r.sprintNo))].sort();
  const uniqueCategories = [...new Set(reports.map(r => r.category))].sort();

  // Filter reports
  const filteredReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    
    return reports.filter(report => {
      // View Entries shows ALL entries (no user filtering)

      // Date filter
      if (dateFilter !== 'all') {
        const reportDate = new Date(report.date);
        const now = new Date();
        let daysAgo = 0;

        if (dateFilter === '1week') daysAgo = 7;
        else if (dateFilter === '2weeks') daysAgo = 14;
        else if (dateFilter === '3weeks') daysAgo = 21;
        else if (dateFilter === '1month') daysAgo = 30;

        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        if (reportDate < cutoffDate) return false;
      }

      // Sprint filter
      if (sprintFilter !== 'all' && report.sprintNo !== sprintFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && report.category !== categoryFilter) return false;

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reports, dateFilter, sprintFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading progress reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card-soft p-6 space-y-4 border border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-dark-charcoal mb-3">Date Range</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === 'all'
                  ? 'bg-gradient-action text-white'
                  : 'bg-gray-100 text-dark-charcoal hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('1week')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '1week'
                  ? 'bg-gradient-action text-white'
                  : 'bg-gray-100 text-dark-charcoal hover:bg-gray-200'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setDateFilter('2weeks')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '2weeks'
                  ? 'bg-gradient-action text-white'
                  : 'bg-gray-100 text-dark-charcoal hover:bg-gray-200'
              }`}
            >
              Last 2 Weeks
            </button>
            <button
              onClick={() => setDateFilter('3weeks')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '3weeks'
                  ? 'bg-gradient-action text-white'
                  : 'bg-gray-100 text-dark-charcoal hover:bg-gray-200'
              }`}
            >
              Last 3 Weeks
            </button>
            <button
              onClick={() => setDateFilter('1month')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateFilter === '1month'
                  ? 'bg-gradient-action text-white'
                  : 'bg-gray-100 text-dark-charcoal hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sprint Filter */}
          <div>
            <label htmlFor="sprintFilter" className="block text-sm font-semibold text-dark-charcoal mb-2">
              Sprint Number
            </label>
            <select
              id="sprintFilter"
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none transition"
            >
              <option value="all">All Sprints</option>
              {uniqueSprints.map(sprint => (
                <option key={sprint} value={sprint}>
                  {sprint}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-semibold text-dark-charcoal mb-2">
              Category
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none transition"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredReports.length} of {reports.length} entries
        </div>
      </div>

      {/* Table */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card-soft p-8 text-center border border-gray-100">
          {reports.length === 0 ? (
            <>
              <p className="text-gray-600 mb-2">No progress reports yet.</p>
              <p className="text-gray-500 text-sm">Check back later for team progress entries!</p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">No progress reports match your filters.</p>
              <p className="text-gray-500 text-sm">Try adjusting your filter criteria.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card-soft overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-hero h-14">
                  <th className="px-6 py-3 text-left text-sm font-bold text-white border-b-2 border-white">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-white border-b-2 border-white">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-white border-b-2 border-white">Sprint #</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-white border-b-2 border-white">Team Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-white border-b-2 border-white">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-white border-b-2 border-white">What I Did Today</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-surface-ground transition duration-200">
                    <td className="px-6 py-4 text-sm text-dark-charcoal border border-gray-100 whitespace-nowrap">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm border border-gray-100">
                      <span
                        className={`px-3 py-1 rounded-full font-medium text-sm inline-block ${getBadgeStyle('member', report.memberName)}`}
                      >
                        {report.memberName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm border border-gray-100">
                      <SprintBadge label={report.sprintNo} index={getSprintIndex(report.sprintNo)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-charcoal border border-gray-100">
                      {report.teamPlan || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm border border-gray-100">
                      <span
                        className={`px-3 py-1 rounded-full font-medium text-sm inline-block ${getBadgeStyle('category', report.category)}`}
                      >
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-charcoal border border-gray-100" title={report.taskDone}>
                      {report.taskDone.substring(0, 50)}{report.taskDone.length > 50 ? '...' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-card-elevated max-w-2xl w-full max-h-96 overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-gradient-to-r from-dark-emerald to-forest-green border-b border-emerald-deep px-6 py-4 flex justify-between items-center">
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
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">Date *</label>
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
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">Sprint *</label>
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
                    <option value="">Select Sprint</option>
                    {SPRINT_OPTIONS.map(sprint => (
                      <option key={sprint} value={sprint}>{sprint}</option>
                    ))}
                  </select>
                  {editErrors.sprintNo && <p className="mt-1 text-xs text-red-500">{editErrors.sprintNo}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">Category *</label>
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
                    <option value="">Select Category</option>
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editErrors.category && <p className="mt-1 text-xs text-red-500">{editErrors.category}</p>}
                </div>

                {/* Team Plan */}
                <div>
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">Team Plan</label>
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
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">Task Done *</label>
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
                    placeholder="Describe what you did today"
                  />
                  {editErrors.taskDone && <p className="mt-1 text-xs text-red-500">{editErrors.taskDone}</p>}
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-charcoal mb-1">Progress Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none text-sm transition"
                  />
                  {editErrors.image && <p className="mt-1 text-xs text-red-500">{editErrors.image}</p>}
                  {editImagePreview && (
                    <div className="mt-3">
                      <div className="relative inline-block">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="h-32 w-auto rounded-lg border border-gray-300"
                        />
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

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-dark-charcoal font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-gradient-action hover:opacity-90 text-white font-medium rounded-lg transition disabled:opacity-50"
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
