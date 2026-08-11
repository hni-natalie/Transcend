import { useState, useEffect } from 'react';
import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { useToast } from '@/context/ToastContext';
import { User } from '@/shared';
import { ProfileData, PasswordData } from './types';

const DEFAULT_PROFILE: ProfileData = {
  userId: '',
  firstName: '',
  lastName: '',
  email: '',
  title: '',
  role: '',
  department: '',
  country: '',
  city: '',
  timeZone: '',
};

const DEFAULT_PASSWORDS: PasswordData = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// fetch user data on mount and exposes avatar + authProvider state.
export const useSettingsData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string>('email');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await apiClient.get<User>(API_CONFIG.endpoints.auth.me);

        const nameParts = userData.userName?.split(' ') || ['', ''];

        setProfile({
		      userId: userData.userId,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: userData.userEmail || '',
          title: userData.userTitle || '',
          role: userData.role?.roleName || 'Team Member',
          department: userData.department?.dpName || '',
          country: userData.country || '',
          city: userData.city || '',
          timeZone: userData.timezone || '',
        });

        setAvatarUrl(userData.avatarUrl || null);
        setAuthProvider(userData.authProvider || 'email');
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        showToast('error', 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [showToast]);

  return { isLoading, profile, setProfile, avatarUrl, setAvatarUrl, authProvider };
};


// profile field changes - PUT save
export const useProfileSave = (
  profile: ProfileData,
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>
) => {
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.put('/users/me', {
		userName: `${profile.firstName} ${profile.lastName}`.trim(),
        userEmail: profile.email,
        city: profile.city,
        country: profile.country,
        timezone: profile.timeZone,
      });
      showToast('success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, handleProfileChange, handleProfileSave };
};


// password field changes - POST save
export const usePasswordSave = (isGoogleUser: boolean) => {
  const [passwords, setPasswords] = useState<PasswordData>(DEFAULT_PASSWORDS);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async () => {
    if (isGoogleUser) {
      showToast('error', 'Google accounts use Google login. Password cannot be changed here.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      showToast('error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.post('/users/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      showToast('success', 'Password changed successfully!');
      setPasswords(DEFAULT_PASSWORDS);
    } catch (err) {
      console.error('Failed to change password:', err);
      showToast('error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return { passwords, isSaving, handlePasswordChange, handlePasswordSave };
};
