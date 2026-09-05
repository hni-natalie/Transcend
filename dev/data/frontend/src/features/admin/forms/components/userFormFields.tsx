import React from 'react';
import { InputText, InputDropdown } from '@shared';
import { PasswordField } from '@shared/ui/PasswordField';
import { UploadPhoto } from '@shared';

interface UserFormFieldsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    deptId: string;
	userTitle: string;
    photo: string;
    password: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPasswordChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  departmentOptions: { id: string; name: string }[];
  roleOptions: { id: string; name: string }[];
  isLoadingData: boolean;
  showPhoto?: boolean;
  mode?: 'create' | 'edit';
  userDisplayName?: string;
  userId?: string;
  isUploading?: boolean;
  uploadError?: string | null;
}

export function UserFormFields({
  formData,
  onChange,
  onPasswordChange,
  onFileSelect,
  departmentOptions,
  roleOptions,
  isLoadingData,
  showPhoto = true,
  mode = 'create',
  userDisplayName = '',
  userId,
  isUploading = false,
  uploadError = null,
}: UserFormFieldsProps) {
  const isEdit = mode === 'edit';

  return (
    <>
      {showPhoto && (
		<div className="flex flex-col items-center mt-6 gap-2">
		  <UploadPhoto
			previewUrl={formData.photo}
			onFileSelect={onFileSelect}
			isUploading={isUploading}
			mode={mode}
			size="md"
			fallbackName={userDisplayName || 'User'}
			disabled={isLoadingData}
		  />
			{uploadError && (
			  <p className="text-red-500 text-sm text-center">{uploadError}</p>
			)}
		</div>
	  )}

      <div className="mt-4 space-y-3 flex-1">
        <InputText 
          title="First Name" 
          placeholder="Enter First Name" 
          name="firstName" 
          value={formData.firstName} 
          onChange={onChange} 
          required 
		  disabled={isEdit && isLoadingData}
          className="bg-background"
        />

        <InputText 
          title="Last Name" 
          placeholder="Enter Last Name" 
          name="lastName" 
          value={formData.lastName} 
          onChange={onChange} 
          required 
		  disabled={isEdit && isLoadingData}
          className="bg-background"
        />

        <InputText 
          title="Email" 
          placeholder="Enter Email" 
          name="email" 
          type="email"
          value={formData.email} 
          onChange={onChange} 
          required 
		  disabled={isEdit && isLoadingData}
          className="bg-background"
        />

        <PasswordField
          title="Password"
          placeholder={isEdit ? "Leave blank to keep current password" : "Leave blank to auto-generate"}
          value={formData.password}
          onChange={onPasswordChange}
          className="bg-background"
        />

        <InputDropdown
          title="Department"
          placeholder="Select Department"
          name="deptId"
          choices={departmentOptions}
          value={formData.deptId}
          onChange={onChange}
          disabled={isLoadingData}
          className="bg-background"
        />

        <InputDropdown
          title="Role"
          placeholder="Select Role"
          name="roleId"
          choices={roleOptions}
          value={formData.roleId}
          onChange={onChange}
          required
          disabled={isLoadingData}
          className="bg-background"
        />

		<InputText 
		  title="Title"
		  placeholder="Enter Title"
		  name="userTitle"
		  value={formData.userTitle}
		  onChange={onChange}
		  disabled={isEdit && isLoadingData}
		  className="bg-background"
		/>
      </div>
    </>
  );
}