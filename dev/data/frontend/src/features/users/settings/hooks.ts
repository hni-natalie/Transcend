import { useState, useEffect } from 'react';
import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { useToast } from '@/context/ToastContext';
import { User } from '@/shared';
import { usePasswordField } from '@shared/ui/PasswordField';
import { ProfileData, PasswordData, DataExportRecord, DeletionRequestRecord } from './types';

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

// validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateProfileForm = (profile: ProfileData): string | null => {
  if (!profile.firstName.trim() || !profile.lastName.trim()) {
    return 'First and last name are required.';
  }
  if (profile.firstName.trim().length > 100 || profile.lastName.trim().length > 100) {
    return 'Names must be under 100 characters.';
  }
  if (!profile.email.trim()) {
    return 'Email is required.';
  }
  if (!EMAIL_REGEX.test(profile.email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
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
	const validationError = validateProfileForm(profile);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.put('/users/me', {
		userName: `${profile.firstName} ${profile.lastName}`.trim(),
        userEmail: profile.email.trim(),
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
  const { validatePassword } = usePasswordField();


  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async () => {
    if (isGoogleUser) {
      showToast('error', 'Google accounts use Google login. Password cannot be changed here.');
      return;
    }
	if (!passwords.oldPassword) {
      showToast('error', 'Current password is required');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }
    const validation = validatePassword(passwords.newPassword);
    if (!validation.isValid) {
      showToast('error', validation.errors.join('. '));
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

// GDPR request data - instant download and shows time requested/completed
export const usePrivacyData = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastExport, setLastExport] = useState<DataExportRecord | null>(null);
  const { showToast } = useToast();

  const handleRequestData = async () => {
    try {
      setIsRequesting(true);
      const response = await apiClient.get<{ requestedAt: string; completedAt: string; data: unknown }>(
        '/users/me/data-export'
      );

      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workfrom-my-data-${new Date(response.completedAt).toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setLastExport({ requestedAt: response.requestedAt, completedAt: response.completedAt });
      showToast('success', 'Your data has been downloaded. A confirmation email is on its way.');
    } catch (err) {
      console.error('Failed to export data:', err);
      showToast('error', 'Failed to prepare your data export. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return { isRequesting, lastExport, handleRequestData };
};

// GDPR request deletion - confirmation email only
export const useAccountDeletion = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequestRecord | null>(null);
  const { showToast } = useToast();

  const openConfirm = () => setIsConfirmOpen(true);
  const closeConfirm = () => setIsConfirmOpen(false);

  const confirmDeletionRequest = async () => {
    try {
      setIsRequesting(true);
      const response = await apiClient.post<{ requestedAt: string; alreadyRequested: boolean }>(
        '/users/me/deletion-request',
        {}
      );

      setDeletionRequest({ requestedAt: response.requestedAt, alreadyRequested: response.alreadyRequested });

      showToast(
        'success',
        response.alreadyRequested
          ? 'A deletion request is already pending for your account.'
          : 'Your request has been received. Check your email for confirmation.'
      );
    } catch (err) {
      console.error('Failed to request account deletion:', err);
      showToast('error', 'Failed to submit your deletion request. Please try again.');
    } finally {
      setIsRequesting(false);
      setIsConfirmOpen(false);
    }
  };

  return { isConfirmOpen, openConfirm, closeConfirm, isRequesting, deletionRequest, confirmDeletionRequest };
};

