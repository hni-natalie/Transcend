import React, { useState, useEffect } from 'react';
import { useAvatarUpload, LoadingState } from '@/shared';
import { SideNav, ProfileIdentityRow, ProfileFormFields, PasswordFormFields } from './components';
import { useSettingsData, useProfileSave, usePasswordSave } from './hooks';
import { ActiveSection } from './types';

export function Settings() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');

  const { isLoading, profile, setProfile, avatarUrl, setAvatarUrl, authProvider } =
    useSettingsData();

  const isGoogleUser = authProvider === 'google';

  // password card not visible to google users
  useEffect(() => {
    if (isGoogleUser && activeSection === 'password') {
      setActiveSection('profile');
    }
  }, [isGoogleUser, activeSection]);

  const { isSaving: isSavingProfile, handleProfileChange, handleProfileSave } =
    useProfileSave(profile, setProfile);

  const { passwords, isSaving: isSavingPassword, handlePasswordChange, handlePasswordSave } =
    usePasswordSave(isGoogleUser);

  const { isUploading, handleAvatarUpload } = useAvatarUpload({ onSuccess: setAvatarUrl, });

  const isProfileActive  = activeSection === 'profile';
  const isPasswordActive = activeSection === 'password';

  if (isLoading) {
    return (
	  <LoadingState message="Loading settings..." size="full" />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 items-start">

      {/* LEFT: Side nav */}
      <SideNav
        activeSection={activeSection}
        isGoogleUser={isGoogleUser}
        onSelect={setActiveSection}
      />

      {/* RIGHT: Panels */}
      <div className="space-y-4">

        {/* PANEL 1: Personal Information */}
        <div
          className={`rounded-3xl p-8 space-y-8 mt-2 transition-all duration-200 ${
            isProfileActive ? 'bg-background-2' : 'bg-background-1'
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground tracking-wide mb-3">
              Update Information
            </h2>
            <div className="w-[130px] flex justify-end">
              {isProfileActive && (
                <button
                  onClick={handleProfileSave}
                  disabled={isSavingProfile}
                //   className="w-[110px] px-4 py-2 bg-accent-lime text-black rounded-lg font-semibold hover:bg-accent-lime/90 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
				  className="btn-lime w-[130px] text-base !px-4 !py-2 whitespace-nowrap"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>

          <ProfileIdentityRow
            profile={profile}
            avatarUrl={avatarUrl}
            isUploading={isUploading}
            isProfileActive={isProfileActive}
            onUpload={handleAvatarUpload}
          />

          <ProfileFormFields
            profile={profile}
            isProfileActive={isProfileActive}
            onChange={handleProfileChange}
          />
        </div>

        {/* PANEL 2: Change Password */}
        {!isGoogleUser && (
          <div
            className={`rounded-3xl p-8 space-y-2 transition-all duration-200 ${
              isPasswordActive ? 'bg-background-2' : 'bg-background-1'
            }`}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground tracking-wide mb-3">
                Change Password
              </h2>
              {isPasswordActive && (
                <button
                  onClick={handlePasswordSave}
                  disabled={isSavingPassword}
                  className="btn-lime text-base !px-4 !py-2"
                >
                  Change Password
                </button>
              )}
            </div>

            <PasswordFormFields
              passwords={passwords}
              isPasswordActive={isPasswordActive}
              onChange={handlePasswordChange}
            />
          </div>
        )}

      </div>
    </div>
  );
}
