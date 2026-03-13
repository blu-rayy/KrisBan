import { useContext, useRef, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Logout03Icon, Edit02Icon, UserIcon, LockPasswordIcon, UserGroupIcon } from '@hugeicons/core-free-icons';

export const ProfileDropdown = ({ isOpen, onClose, onNavigateSettingsTab }) => {
  const { user, setUser, logout } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = event.target.result;
          
          // Send to backend
          const response = await authService.updateProfile({
            profile_picture: base64String
          });

          // Update user context
          if (response.data?.data?.user) {
            setUser(response.data.data.user);
          }
          
          setError('');
          setUploading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to upload image');
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read file');
      setUploading(false);
    }
  };

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      
      {/* Dropdown Menu */}
      <div
        onTransitionEnd={() => { if (!visible) setMounted(false); }}
        className={`absolute top-16 right-0 w-80 bg-white dark:bg-dm-card rounded-lg shadow-lg border border-gray-200 dark:border-dm-border z-50 transition-all duration-200 ease-out origin-top-right
          ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
      >
        {/* Header with Profile */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-dm-border">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user?.username} className="w-full h-full object-cover" />
                ) : (
                  (user?.username || user?.fullName || 'U')[0].toUpperCase()
                )}
              </div>
              {/* Edit Icon Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-forest-green text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <HugeiconsIcon icon={Edit02Icon} size={16} color="currentColor" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-dark-charcoal dark:text-dm-text">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-dm-muted">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="p-4 space-y-1 border-b border-gray-100 dark:border-dm-border">
          {[
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'account', label: 'Account', icon: LockPasswordIcon },
            { id: 'members', label: 'Members', icon: UserGroupIcon }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigateSettingsTab?.(item.id);
                onClose();
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-gray-700 dark:text-dm-muted hover:bg-gray-100 dark:hover:bg-dm-elevated hover:text-dark-charcoal dark:hover:text-dm-text transition flex items-center gap-3"
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={item.icon} size={18} color="currentColor" />
              </span>
              <span className="leading-none">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Picture Upload - Hidden */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
          className="hidden"
        />
        {error && (
          <div className="px-6 pt-4">
            <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4">
          <button 
            onClick={logout}
            className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition flex items-center gap-3"
          >
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <HugeiconsIcon icon={Logout03Icon} size={18} color="currentColor" />
            </span>
            <span className="leading-none">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
