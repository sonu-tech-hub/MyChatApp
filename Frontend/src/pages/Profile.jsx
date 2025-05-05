import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Avatar from '../components/common/Avatar';
import { HiCamera, HiLockClosed, HiSave } from 'react-icons/hi';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    address: user?.address || '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if the file is an image and validate size
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) { // max size 5MB
          toast.error('Image size exceeds 5MB. Please select a smaller image.');
          e.target.value = '';  // Clear file input on error
        } else {
          setProfilePhoto(file);

          // Create preview
          const reader = new FileReader();
          reader.onload = (event) => {
            setPhotoPreview(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      } else {
        toast.error('Please select an image file');
        e.target.value = '';  // Clear file input on error
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Create form data for the file upload
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('address', profileData.address);

      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      await updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there are changes to save
  const isFormChanged = profileData.name !== user?.name || profileData.address !== user?.address || profilePhoto !== null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        <form onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <div className="flex justify-center mb-6">
            <div className="relative text-black border-x-2 border-x-red-500 rounded-full w-32 h-32 flex items-center justify-center">
              <Avatar
                src={photoPreview}
                name={user?.name}
                size="xl"
                className="cursor-pointer bg-black"
                onClick={handlePhotoClick}
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-primary text-black border-x-2 border-x-red-500 p-2 rounded-full shadow-lg"
                onClick={handlePhotoClick}
              >
                <HiCamera className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={user?.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={profileData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Your address"
                rows="3"
                required
              />
            </div>

            {/* Save Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !isFormChanged}
                className={`w-full flex justify-center items-center px-4 py-2 bg-primary text-black rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                  isLoading || !isFormChanged ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <HiSave className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Password Change Section */}
        <div className="mt-8 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <a href="/ChangePassword" className="flex items-center text-primary hover:text-primary-dark">
            <HiLockClosed className="w-5 h-5 mr-2" />
            Change your password
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;
