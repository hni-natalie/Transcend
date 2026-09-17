import React, { useState, useEffect } from 'react';
import { IconCamera, InputDropdown, countryOptions, timezoneOptions, IconEye, IconEyeOff, DefaultAvatar } from '@/shared';
import { usePasswordField } from '@/shared';
import { ProfileData, PasswordData, ActiveSection, DataExportRecord, DeletionRequestRecord } from './types';

export const countryChoices = countryOptions.map(country => ({ id: country, name: country }));
export const timezoneChoices = timezoneOptions.map(tz => ({ id: tz.value, name: tz.label }));

const activeInputClass =
  'bg-background-1 border-background-2 text-foreground-2 focus:border-accent-lime focus:ring-1 focus:ring-accent-lime';
const inactiveInputClass =
  'bg-background-2 border-background-2 text-foreground-3 cursor-not-allowed';

const fieldClass = (active: boolean) =>
  `rounded-lg border px-4 py-3 text-base outline-none transition-all duration-150 ${
    active ? activeInputClass : inactiveInputClass
  }`;

const disabledFieldClass = (active: boolean) =>
  `rounded-lg border px-4 py-3 text-base text-foreground-3/70 outline-none transition-all duration-150 cursor-not-allowed ${
    active ? 'bg-background-1 border-background-2' : 'bg-background-2 border-background-2'
  }`;


interface AvatarUploaderProps {
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  isUploading: boolean;
  isProfileActive: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AvatarUploader = ({
  avatarUrl,
  firstName,
  lastName,
  isUploading,
  isProfileActive,
  onUpload,
}: AvatarUploaderProps) => {
  const [imageError, setImageError] = useState(false);
  const fullName = `${firstName} ${lastName}`.trim() || 'User';

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  return (
    <div className="relative group shrink-0">
      <div className="w-35 h-35 rounded-full bg-background-3 flex items-center justify-center overflow-hidden">
        {avatarUrl && !imageError ? (
          <img 
            src={avatarUrl} 
            alt="Profile" 
            className="w-full h-full object-cover" 
            onError={() => setImageError(true)}
          />
        ) : (
          <DefaultAvatar
            name={fullName}
            className="w-full h-full"
          />
        )}
      </div>
      <label
        className={`absolute bottom-0 right-0 w-8 h-8 bg-accent-lime rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-accent-lime/80 transition-colors ${
          !isProfileActive ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <IconCamera className="w-5 h-5 text-background-3" />
        )}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          disabled={!isProfileActive || isUploading}
          onChange={onUpload}
        />
      </label>
    </div>
  );
};

// profle identity (name, email, role, dp, user id)
interface ProfileIdentityRowProps {
  profile: ProfileData;
  avatarUrl: string | null;
  isUploading: boolean;
  isProfileActive: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileIdentityRow = ({
  profile,
  avatarUrl,
  isUploading,
  isProfileActive,
  onUpload,
}: ProfileIdentityRowProps) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6">
    <AvatarUploader
      avatarUrl={avatarUrl}
      firstName={profile.firstName}
      lastName={profile.lastName}
      isUploading={isUploading}
      isProfileActive={isProfileActive}
      onUpload={onUpload}
    />
    <div className="flex-1 min-w-0">
		<div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 items-center">
			<div className="md:col-span-2">
				<h3 className="text-3xl font-semibold text-accent-lime tracking-wide truncate">
				{profile.firstName} {profile.lastName}
				</h3>
			</div>

			<div>
				<span className="text-base text-foreground-3 transition-colors duration-200">
				ID: {profile.userId}
				</span>
			</div>
		</div>
      <p className="text-base text-foreground-3 truncate mb-4">{profile.email}</p>
      <p className="text-base text-foreground-3 pt-4 font-medium">
        {profile.role} <span className="text-foreground-4">·</span> {profile.department}
      </p>
    </div>
  </div>
);

// profile fields
interface ProfileFormFieldsProps {
  profile: ProfileData;
  isProfileActive: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const ProfileFormFields = ({
  profile,
  isProfileActive,
  onChange,
}: ProfileFormFieldsProps) => {
  const active = isProfileActive;

  const dropdownStyle = `py-3 text-[12px] leading-6 ${
    !active
      ? '!bg-background-3 !border !border-background-4 !text-foreground !cursor-not-allowed'
      : '!bg-background-1 !border-background-2 !text-foreground-2 focus:border-accent-lime focus:ring-1 focus:ring-accent-lime'
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
      {/* ROW 1 - name , email */}
      {[
        { label: 'First Name', name: 'firstName', value: profile.firstName, type: 'text' },
        { label: 'Last Name',  name: 'lastName',  value: profile.lastName,  type: 'text' },
        { label: 'Email',      name: 'email',     value: profile.email,     type: 'email' },
      ].map(({ label, name, value, type }) => (
        <div key={name} className="flex flex-col gap-2">
          <label className="text-base font-semibold text-foreground-3 tracking-wide">{label}</label>
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={!active}
            className={fieldClass(active)}
          />
        </div>
      ))}

      {/* ROW 2 - country, city, timzone */}
      <div className="[&_label]:text-foreground-3 [&_label]:font-semibold [&_label]:tracking-wide pt-5.5">
        <InputDropdown
          title="Country"
          name="country"
          choices={countryChoices}
          value={profile.country}
          onChange={onChange}
          disabled={!active}
          placeholder="Select a country"
          className={dropdownStyle}
        />
      </div>

      <div className="flex flex-col gap-2 pt-5">
        <label className="text-base font-semibold text-foreground-3 tracking-wide">City</label>
        <input
          type="text"
          name="city"
          value={profile.city}
          onChange={onChange}
          disabled={!active}
          className={fieldClass(active)}
        />
      </div>

      <div className="[&_label]:text-foreground-3 [&_label]:font-semibold [&_label]:tracking-wide pt-5.5">
        <InputDropdown
          title="Time Zone"
          name="timeZone"
          choices={timezoneChoices}
          value={profile.timeZone}
          onChange={onChange}
          disabled={!active}
          placeholder="Select a timezone"
          className={dropdownStyle}
        />
      </div>

      {/* ROW 3 - title, row, dp (all read only) */}
      {[
        { label: 'Title',      name: 'title',      value: profile.title,      placeholder: 'No title assigned' },
        { label: 'Role',       name: 'role',       value: profile.role,       placeholder: '' },
        { label: 'Department', name: 'department', value: profile.department, placeholder: '' },
      ].map(({ label, name, value, placeholder }) => (
        <div key={name} className="flex flex-col gap-2 pt-5">
          <label className="text-base font-semibold text-foreground-3 tracking-wide">{label}</label>
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            disabled
            placeholder={placeholder}
            className={disabledFieldClass(active)}
          />
        </div>
      ))}
    </div>
  );
};


// password
interface PasswordFormFieldsProps {
  passwords: PasswordData;
  isPasswordActive: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PasswordFormFields = ({
  passwords,
  isPasswordActive,
  onChange,
}: PasswordFormFieldsProps) => {
  const active = isPasswordActive;
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const { getRequirements } = usePasswordField();

  const doPasswordsMatch = passwords.newPassword === passwords.confirmPassword;
  const requirements = getRequirements(passwords.newPassword);

  const handleNewPasswordFocus = () => {
    if (passwords.newPassword) {
      setShowRequirements(true);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (e.target.value) {
      setShowRequirements(true);
    } else {
      setShowRequirements(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 mt-7">
        {/* Old Password */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-base font-semibold text-foreground-3 tracking-wide">
            Old Password
          </label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              name="oldPassword"
              placeholder="***************"
              value={passwords.oldPassword}
              onChange={onChange}
              disabled={!active}
              className={`${fieldClass(active)} w-full`}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-3 hover:text-foreground-2 transition-colors"
            >
              {showOldPassword ? (
                <IconEyeOff className="w-4 h-4" />
              ) : (
                <IconEye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-base font-semibold text-foreground-3 tracking-wide">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              placeholder="***************"
              value={passwords.newPassword}
              onChange={handleNewPasswordChange}
              onFocus={handleNewPasswordFocus}
              disabled={!active}
              className={`${fieldClass(active)} w-full`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-3 hover:text-foreground-2 transition-colors"
            >
              {showNewPassword ? (
                <IconEyeOff className="w-4 h-4" />
              ) : (
                <IconEye className="w-4 h-4" />
              )}
            </button>
          </div>

          {showRequirements && passwords.newPassword && (
          <div className="absolute left-0 bottom-full mt-2 w-full min-w-[200px] max-w-[400px] bg-background-1 border border-background-3/50 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-base text-foreground-2 mb-2 font-medium">Password must contain:</p>
			  <div className="space-y-1">
                {requirements.map((req) => (
                  <p
                    key={req.key}
                    className={`text-sm flex items-center gap-2 ${
                      req.met ? 'text-accent-lime' : 'text-foreground-3'
                    }`}
                  >
                    {req.met ? '✓' : '○'} {req.label}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowRequirements(false)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent-lime-bg text-foreground-3 hover:text-white flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-foreground-3 tracking-wide">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="***************"
              value={passwords.confirmPassword}
              onChange={onChange}
              disabled={!active}
              className={`${fieldClass(active)} w-full ${
                passwords.confirmPassword && !doPasswordsMatch ? 'border-red-500' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-3 hover:text-foreground-2 transition-colors"
            >
              {showConfirmPassword ? (
                <IconEyeOff className="w-4 h-4" />
              ) : (
                <IconEye className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="h-0">
			{passwords.confirmPassword && (
			<p className={`text-sm translate-x-4 ${doPasswordsMatch ? 'text-accent-lime' : 'text-danger '}`}>
				{doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
			</p>
			)}
		</div>
        </div>
      </div>

      <div className="flex gap-2 items-start text-base text-foreground-3 leading-relaxed pt-2">
        <p>ⓘ Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.</p>
      </div>
    </div>
  );
};

// sidenave (personal info / password)
interface SideNavProps {
  activeSection: ActiveSection;
  isGoogleUser: boolean;
  onSelect: (section: ActiveSection) => void;
}

export const SideNav = ({ activeSection, isGoogleUser, onSelect }: SideNavProps) => (
  <div className="flex flex-col gap-4 sticky">
    <button
      onClick={() => onSelect('profile')}
      className={`mt-10 px-9 text-left text-base font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer ${
        activeSection === 'profile' ? 'text-accent-lime' : 'text-foreground-3 hover:text-foreground'
      }`}
    >
      Personal Information
    </button>
    {!isGoogleUser && (
      <button
        onClick={() => onSelect('password')}
        className={`px-9 text-left text-base font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer ${
          activeSection === 'password' ? 'text-accent-lime' : 'text-foreground-3 hover:text-foreground'
        }`}
      >
        Password
      </button>
    )}
	<button
      onClick={() => onSelect('privacy')}
      className={`px-9 text-left text-base font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer ${
        activeSection === 'privacy' ? 'text-accent-lime' : 'text-foreground-3 hover:text-foreground'
      }`}
    >
      Privacy and Data
    </button>
  </div>
);

// GDPR
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const gdprCardClass = 'bg-background-2 rounded-3xl p-8 space-y-4';

interface RequestMyDataCardProps {
  isRequesting: boolean;
  lastExport: DataExportRecord | null;
  onRequestData: () => void;
}

export const RequestMyDataCard = ({ isRequesting, lastExport, onRequestData }: RequestMyDataCardProps) => (
  <div className={gdprCardClass}>
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-foreground tracking-wide">Request My Data</h2>
      <button
        onClick={onRequestData}
        disabled={isRequesting}
        className="btn-lime text-base !px-4 !py-2 whitespace-nowrap disabled:opacity-50"
      >
        {isRequesting ? 'Preparing...' : 'Request Data'}
      </button>
    </div>

    <p className="text-base text-foreground-3 leading-relaxed">
      Under the General Data Protection Regulation (GDPR) and other privacy laws, you have the right to request a
      copy of the personal data we store about you. If you submit a request, we will generate a downloadable report
      containing your personal information, workspace activities, and application history. This includes:
    </p>
    <ul className="list-disc list-inside text-base text-foreground-3 leading-relaxed space-y-1 ml-2">
      <li><span className="text-foreground-2 font-medium">Profile Details:</span> Name, email address, avatar, location (city/country), timezone, and authentication provider.</li>
      <li><span className="text-foreground-2 font-medium">Workspace Activity:</span> Your active status logs, department assignments, and system-wide activity logs.</li>
      <li><span className="text-foreground-2 font-medium">Collaborative Content:</span> Meetings you organized or participated in, assigned tasks, conversations, sent messages, and attachments.</li>
    </ul>

    {lastExport && (
      <p className="text-sm text-accent-lime pt-1">
        Requested {formatDateTime(lastExport.requestedAt)} · Completed {formatDateTime(lastExport.completedAt)} — a confirmation email is on its way.
      </p>
    )}
  </div>
);

interface RequestAccountDeletionCardProps {
  isRequesting: boolean;
  deletionRequest: DeletionRequestRecord | null;
  onRequestDeletion: () => void;
}

export const RequestAccountDeletionCard = ({
  isRequesting,
  deletionRequest,
  onRequestDeletion,
}: RequestAccountDeletionCardProps) => (
  <div className={gdprCardClass}>
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-foreground tracking-wide">Request to Delete My Account</h2>
      <button
        onClick={onRequestDeletion}
        disabled={isRequesting || Boolean(deletionRequest)}
        className="btn-lime text-base !px-4 !py-2 whitespace-nowrap disabled:opacity-50"
      >
        {deletionRequest ? 'Request Sent' : isRequesting ? 'Sending...' : 'Request Deletion'}
      </button>
    </div>

    <p className="text-base text-foreground-3 leading-relaxed">
      If you no longer wish to use WorkFrom, you can request the permanent deletion of your account. Please note
      that this action is irreversible. Submitting this request will notify our support team
      (support@workfrom.com) to delete your account, which will result in the following actions:
    </p>
    <ul className="list-disc list-inside text-base text-foreground-3 leading-relaxed space-y-1 ml-2">
      <li><span className="text-foreground-2 font-medium">Personal Identity Removal:</span> Your profile credentials, email, password, and linked Google authentication ID will be permanently erased.</li>
      <li><span className="text-foreground-2 font-medium">Task &amp; Meeting De-association:</span> Tasks created by you will be purged, and your name will be removed from all past meeting participation lists.</li>
      <li><span className="text-foreground-2 font-medium">Chat &amp; Message Anonymization:</span> Your sent messages and conversation histories will be unlinked from your profile, and all uploaded message attachments will be permanently deleted from our servers.</li>
    </ul>

    {deletionRequest && (
      <p className="text-sm text-accent-lime pt-1">
        Requested {formatDateTime(deletionRequest.requestedAt)} — we'll carry this out within 30 days. Check your email for confirmation.
      </p>
    )}
  </div>
);

