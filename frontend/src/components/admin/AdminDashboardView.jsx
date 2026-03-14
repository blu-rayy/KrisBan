import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/api';

const INITIAL_FORM = {
  fullName: '',
  username: '',
  studentNumber: '',
  instituteEmail: '',
  personalEmail: ''
};

const ADMIN_FEATURES = [
  { id: 'add-member', label: 'Add member', description: 'Create a new member for your current team.' },
  { id: 'coming-soon', label: 'More features soon', description: 'Keep this dropdown for upcoming admin tools.' }
];

const ROLE_STYLES = {
  ADMIN: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  USER: 'bg-slate-100 text-slate-700 dark:bg-dm-elevated dark:text-dm-text'
};

export const AdminDashboardView = () => {
  const { user } = useContext(AuthContext);
  const [selectedFeature, setSelectedFeature] = useState('add-member');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await authService.getUsers();
      setMembers(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadMembers();
    }
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        studentNumber: formData.studentNumber.trim(),
        instituteEmail: formData.instituteEmail.trim(),
        personalEmail: formData.personalEmail.trim()
      };

      const response = await authService.createMember(payload);
      const temporaryPassword = response.data?.data?.temporaryPassword || 'password123';

      setFormData(INITIAL_FORM);
      setSuccessMessage(`Member created. Temporary password: ${temporaryPassword}. They will be forced to change it on first login.`);
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-surface-ground dark:bg-dm-ground p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base lg:text-lg">
            Create members for {user?.teamName || 'your team'} and keep access tidy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_360px] gap-6 items-start">
        <section className="rounded-3xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden">
          <div className="bg-gradient-hero px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Admin Tools</h3>
                <p className="text-sm text-emerald-100 mt-1">
                  Keep member creation in a dropdown now so other admin features can slot in later.
                </p>
              </div>
              <label className="block md:min-w-64">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/90">Select feature</span>
                <select
                  value={selectedFeature}
                  onChange={(event) => setSelectedFeature(event.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-medium text-white outline-none backdrop-blur placeholder:text-emerald-50 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                >
                  {ADMIN_FEATURES.map((feature) => (
                    <option key={feature.id} value={feature.id} className="text-slate-900">
                      {feature.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5 rounded-2xl bg-slate-50 dark:bg-dm-elevated px-4 py-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-dm-text">
                {ADMIN_FEATURES.find((feature) => feature.id === selectedFeature)?.label}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-dm-muted">
                {ADMIN_FEATURES.find((feature) => feature.id === selectedFeature)?.description}
              </p>
            </div>

            {selectedFeature === 'add-member' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                    {successMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 dark:text-dm-text mb-2">Full Name</span>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-4 py-3 text-sm text-slate-900 dark:text-dm-text outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Nicholas Wilde"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 dark:text-dm-text mb-2">Nickname</span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-4 py-3 text-sm text-slate-900 dark:text-dm-text outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="nick wilde"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 dark:text-dm-text mb-2">Student No.</span>
                    <input
                      type="text"
                      name="studentNumber"
                      value={formData.studentNumber}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-4 py-3 text-sm text-slate-900 dark:text-dm-text outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="202399999"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 dark:text-dm-text mb-2">Institute Email</span>
                    <input
                      type="email"
                      name="instituteEmail"
                      value={formData.instituteEmail}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-4 py-3 text-sm text-slate-900 dark:text-dm-text outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="nick.wilde@institute.edu"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 dark:text-dm-text mb-2">Personal Email</span>
                  <input
                    type="email"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-elevated px-4 py-3 text-sm text-slate-900 dark:text-dm-text outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="nick.wilde@gmail.com"
                  />
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-slate-50 dark:bg-dm-elevated px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-dm-text">Temporary password</p>
                    <p className="text-xs text-slate-500 dark:text-dm-muted">New members sign in with password123 and will be prompted to replace it immediately.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-forest-green px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Creating member...' : 'Add member'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-5 py-8 text-sm text-slate-500 dark:text-dm-muted">
                This slot is intentionally reserved for future admin features. The dropdown is now the entry point.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-dm-border">
              <p className="text-sm font-semibold text-slate-800 dark:text-dm-text">Essential</p>
              <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">Nick Wilde stays.</p>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              <img
                src="/nick-wilde-zootopia.gif"
                alt="Nick Wilde"
                className="rounded-2xl shadow-2xl w-full max-w-xs"
              />
              <p className="text-center text-sm italic text-slate-500 dark:text-dm-muted">
                "I'll get you a copy of the file. It'll take twenty minutes." - Nick Wilde
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft p-5">
            <p className="text-sm font-semibold text-slate-800 dark:text-dm-text">Member rules</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-dm-muted">
              <p>Full Name, Nickname, Student No., Institute Email, and Personal Email are enforced.</p>
              <p>New members are created under your current team automatically.</p>
              <p>Only admins can use this panel.</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-dm-border">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-dm-text">Members</h3>
            <p className="text-sm text-slate-500 dark:text-dm-muted">
              {members.length} member{members.length === 1 ? '' : 's'} in {user?.teamName || 'this workspace'}.
            </p>
          </div>
        </div>

        {loadingMembers ? (
          <div className="px-6 py-8 text-sm text-slate-500 dark:text-dm-muted">Loading members...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-dm-border">
            {members.map((member) => (
              <div key={member.id} className="px-6 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto] gap-4 items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-dm-text truncate">{member.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-dm-muted truncate">
                    {member.username} • {member.studentNumber}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 dark:text-dm-muted truncate">{member.instituteEmail}</p>
                  <p className="text-xs text-slate-500 dark:text-dm-muted truncate">{member.personalEmail}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLES[member.role] || ROLE_STYLES.USER}`}>
                  {member.role}
                </span>
              </div>
            ))}
            {!members.length && (
              <div className="px-6 py-8 text-sm text-slate-500 dark:text-dm-muted">No members found for this team yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
