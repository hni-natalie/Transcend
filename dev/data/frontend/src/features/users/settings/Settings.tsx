import React, { useState, useEffect } from 'react';
import { useAvatarUpload, LoadingState, ConfirmDeleteModal } from '@/shared';
import { SideNav, ProfileIdentityRow, ProfileFormFields, PasswordFormFields, RequestMyDataCard, RequestAccountDeletionCard, } from './components';
import { useSettingsData, useProfileSave, usePasswordSave, usePrivacyData, useAccountDeletion } from './hooks';
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

  const { isUploading, handleAvatarUpload, uploadPendingForSelf } = useAvatarUpload({
    onSuccess: setAvatarUrl,
    onPreview: setAvatarUrl,
  });
  
  const { isSaving: isSavingProfile, handleProfileChange, handleProfileSave } =
    useProfileSave(profile, setProfile, uploadPendingForSelf);

  const { passwords, isSaving: isSavingPassword, handlePasswordChange, handlePasswordSave } =
    usePasswordSave(isGoogleUser);


  const { isRequesting: isRequestingData, lastExport, handleRequestData } = usePrivacyData();
  const {
    isConfirmOpen: isDeletionConfirmOpen,
    openConfirm: openDeletionConfirm,
    closeConfirm: closeDeletionConfirm,
    isRequesting: isRequestingDeletion,
    deletionRequest,
    confirmDeletionRequest,
  } = useAccountDeletion();


  const isProfileActive  = activeSection === 'profile';
  const isPasswordActive = activeSection === 'password';
  const isPrivacyActive  = activeSection === 'privacy';


  if (isLoading) {
    return (
	  <LoadingState message="Loading settings..." size="full" />
    );
  }

  return (
    <>
    <div className="mt-2 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 items-start">

      {/* LEFT: Side nav */}
      <SideNav
        activeSection={activeSection}
        isGoogleUser={isGoogleUser}
        onSelect={setActiveSection}
      />

      {/* RIGHT: Panels */}
      <div className="mt-2 space-y-4">

        {isPrivacyActive ? (
          <>
            {/* PANEL: Request My Data */}
            <RequestMyDataCard
              isRequesting={isRequestingData}
              lastExport={lastExport}
              onRequestData={handleRequestData}
            />

            {/* PANEL: Request Account Deletion */}
            <RequestAccountDeletionCard
              isRequesting={isRequestingDeletion}
              deletionRequest={deletionRequest}
              onRequestDeletion={openDeletionConfirm}
            />
          </>
        ) : (
          <>
            {/* PANEL 1: Personal Information */}
            <div
              className={`rounded-3xl p-8 space-y-6 transition-all duration-200 ${
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
          </>
        )}

      </div>

    </div>

    <ConfirmDeleteModal
      isOpen={isDeletionConfirmOpen}
      onClose={closeDeletionConfirm}
      onConfirm={confirmDeletionRequest}
      isLoading={isRequestingDeletion}
      title="Delete your account?"
      description="This will submit a request to permanently delete your account and all associated data. This action cannot be undone. Are you sure?"
    />
    </>
  );
}
