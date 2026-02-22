import { useContext, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/api';

export const ProfileDropdown = ({ isOpen, onClose }) => {
  const { user, setUser } = useContext(AuthContext);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown Menu */}
      <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        {/* Header with Profile */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-forest-green rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.username} className="w-full h-full object-cover" />
              ) : (
                (user?.username || user?.fullName || 'U')[0].toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-dark-charcoal">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-forest-green uppercase tracking-wide">Full Name</p>
            <p className="text-sm text-dark-charcoal mt-1">{user?.fullName || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-forest-green uppercase tracking-wide">Institute Email</p>
            <p className="text-sm text-dark-charcoal mt-1">{user?.instituteEmail || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-forest-green uppercase tracking-wide">Personal Email</p>
            <p className="text-sm text-dark-charcoal mt-1">{user?.personalEmail || 'Not set'}</p>
          </div>
        </div>

        {/* Profile Picture Upload */}
        <div className="p-6 border-b border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-2 border-2 border-forest-green text-forest-green font-medium rounded-lg hover:bg-green-50 disabled:opacity-60 transition"
          >
            {uploading ? 'Uploading...' : 'Change Profile Picture'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            className="hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-6">
          <button className="w-full px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>
    </>
  );
};
