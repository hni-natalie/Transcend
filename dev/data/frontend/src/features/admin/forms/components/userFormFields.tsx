import React from 'react';
import { InputText, InputDropdown } from '@shared';
import { PasswordField } from '@shared/ui/PasswordField';
import { UploadPhoto } from '@shared';
import { countryOptions } from '@shared/lib/constants/countries';

interface UserFormFieldsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    deptId: string;
    location: string;
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
}: UserFormFieldsProps) {
  const isEdit = mode === 'edit';

  return (
    <>
      {showPhoto && (
        <div className="flex justify-center mt-6">
          <UploadPhoto
            previewUrl={formData.photo}
            onFileSelect={onFileSelect}
            isUploading={isUploading}
            mode={mode}
            size="md"
            fallbackName={userDisplayName || 'User'}
            disabled={isLoadingData}
          />
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
          className="bg-background"
        />

        <InputText 
          title="Last Name" 
          placeholder="Enter Last Name" 
          name="lastName" 
          value={formData.lastName} 
          onChange={onChange} 
          required 
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
          className="bg-background"
        />

        <PasswordField
          value={formData.password}
          onChange={onPasswordChange}
          title="Password"
          placeholder="Leave blank to keep current password"
          className="bg-background"
        />

        <InputDropdown
          title="Department"
          name="deptId"
          choices={departmentOptions}
          value={formData.deptId}
          onChange={onChange}
          disabled={isLoadingData}
          className="bg-background"
          placeholder="Select Department"
        />

        <InputDropdown
          title="Role"
          name="roleId"
          choices={roleOptions}
          value={formData.roleId}
          onChange={onChange}
          required
          disabled={isLoadingData}
          className="bg-background"
          placeholder="Select Role"
        />

        <InputDropdown
          title="Location"
          name="location"
          choices={countryOptions}
          value={formData.location}
          onChange={onChange}
          className="bg-background"
        />
      </div>
    </>
  );
}