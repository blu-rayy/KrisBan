import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserIcon, LockPasswordIcon, UserGroupIcon } from '@hugeicons/core-free-icons';

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'account', label: 'Account', icon: LockPasswordIcon },
  { id: 'members', label: 'Members', icon: UserGroupIcon }
];

const ROLE_STYLES = {
  ADMIN: 'bg-emerald-50 text-emerald-700',
  USER: 'bg-slate-100 text-slate-600'
};

export const SettingsView = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');

  // --- Profile tab ---
  const fileInputRef = useRef(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setProfileError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setProfileError('Image must be less than 5MB'); return; }

    setProfileUploading(true);
    setProfileError('');
    setProfileSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await authService.updateProfile({ profile_picture: event.target.result });
        if (response.data?.data?.user) setUser(response.data.data.user);
        setProfileSuccess('Profile picture updated!');
        setTimeout(() => setProfileSuccess(''), 3000);
      } catch (err) {
        setProfileError(err.response?.data?.message || 'Failed to upload image');
      } finally {
        setProfileUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Account tab ---
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }

    setPwLoading(true);
    try {
      await authService.changePassword(pwForm.newPassword, pwForm.confirmPassword);
      setPwSuccess('Password changed successfully!');
      setPwForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  // --- Members tab ---
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');

  useEffect(() => {
    if (activeTab !== 'members') return;
    const load = async () => {
      setMembersLoading(true);
      setMembersError('');
      try {
        const response = await authService.getUsers();
        setMembers(response.data?.data || []);
      } catch (err) {
        setMembersError(err.response?.data?.message || 'Failed to load members');
      } finally {
        setMembersLoading(false);
      }
    };
    load();
  }, [activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 dark:bg-dm-ground min-h-full">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-charcoal dark:text-dm-text">Settings</h1>
        <p className="text-gray-600 dark:text-dm-muted text-sm sm:text-base lg:text-lg">
          Manage your profile, account security, and team members.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200 dark:border-dm-border">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
                activeTab === id
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-700 dark:text-dm-muted hover:text-slate-800 dark:hover:text-dm-text'
              }`}
            >
              <HugeiconsIcon icon={icon} size={18} color="currentColor" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden lg:col-span-2 h-full">
              <div className="bg-gradient-hero px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Your Profile</h2>
                <p className="text-xs text-emerald-100 mt-0.5">Update your avatar and view your account details.</p>
              </div>
              <div className="p-6 space-y-6 h-full">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden flex-shrink-0">
                    {user?.profilePicture
                      ? <img src={user.profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
                      : (user?.fullName || user?.username || 'U')[0].toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-dm-text">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-dm-muted mb-3">{user?.instituteEmail}</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={profileUploading}
                      className="rounded-lg bg-gradient-action px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
                    >
                      {profileUploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                  </div>
                </div>

                {profileError && (
                  <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-3 py-2">{profileError}</p>
                )}
                {profileSuccess && (
                  <p className="text-sm text-emerald-700 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">{profileSuccess}</p>
                )}

                <div className="rounded-lg border border-slate-100 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-dm-muted">Team</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-dm-text mt-1">{user?.teamName || 'Unassigned'}</p>
                </div>

                <div className="rounded-lg border border-slate-100 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-dm-muted">Role</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-dm-text mt-1">{user?.role || '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden lg:col-span-3 h-full">
              <div className="bg-gradient-hero px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Account Info</h2>
                <p className="text-xs text-emerald-100 mt-0.5">Your workspace profile details.</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { label: 'Username', value: user?.username },
                  { label: 'Student Number', value: user?.studentNumber },
                  { label: 'Institute Email', value: user?.instituteEmail },
                  { label: 'Personal Email', value: user?.personalEmail }
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-4 py-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-dm-muted">{label}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-dm-text">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden lg:col-span-3">
              <div className="bg-gradient-hero px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Account Security</h2>
                <p className="text-xs text-emerald-100 mt-0.5">Change your password at any time.</p>
              </div>
              <form className="p-6 space-y-4" onSubmit={handleChangePassword}>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-dm-border pb-1">Change Password</p>
                {pwError && (
                  <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-3 py-2">{pwError}</p>
                )}
                {pwSuccess && (
                  <p className="text-sm text-emerald-700 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">{pwSuccess}</p>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-muted mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswordFields ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm((c) => ({ ...c, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 pr-16 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:opacity-80"
                    >
                      {showPasswordFields ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-dm-muted mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswordFields ? 'text' : 'password'}
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-300 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-3 py-2 pr-16 text-sm text-slate-800 dark:text-dm-text focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:opacity-80"
                    >
                      {showPasswordFields ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="rounded-lg bg-gradient-action px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
                  >
                    {pwLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden lg:col-span-2">
              <div className="bg-gradient-hero px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Security Notes</h2>
                <p className="text-xs text-emerald-100 mt-0.5">Keep your account protected.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-lg border border-slate-100 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-dm-muted">Username</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-dm-text mt-1">{user?.username || '—'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-dm-muted">Institute Email</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-dm-text mt-1">{user?.instituteEmail || '—'}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Tip</p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                    Use at least 8 characters with a mix of letters, numbers, and symbols.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="w-full">
          {membersLoading && (
            <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-slate-50 dark:bg-dm-elevated p-6 text-slate-700 dark:text-dm-muted">
              Loading members...
            </div>
          )}
          {membersError && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {membersError}
            </div>
          )}
          {!membersLoading && !membersError && (
            <div className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-card shadow-card-soft overflow-hidden">
              <div className="bg-gradient-hero px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{user?.teamName || 'Team Members'}</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {members.length} member{members.length !== 1 ? 's' : ''} in this workspace.
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dm-border">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                      {member.profilePicture
                        ? <img src={member.profilePicture} alt={member.fullName} className="w-full h-full object-cover" />
                        : (member.fullName || member.username || '?')[0].toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-dm-text truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-dm-muted truncate">{member.instituteEmail || member.username}</p>
                    </div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${ROLE_STYLES[member.role] || 'bg-slate-100 text-slate-600'}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
