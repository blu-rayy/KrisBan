import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { Logout03Icon, UserIcon, LockPasswordIcon, UserGroupIcon } from '@hugeicons/core-free-icons';

export const ProfileDropdown = ({ isOpen, onClose, onNavigateSettingsTab }) => {
  const { user, logout } = useContext(AuthContext);
  const [error] = useState('');

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
            <div className="w-16 h-16 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.username} className="w-full h-full object-cover" />
              ) : (
                (user?.username || user?.fullName || 'U')[0].toUpperCase()
              )}
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
