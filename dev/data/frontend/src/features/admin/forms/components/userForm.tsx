import React, { useState, useEffect } from 'react';
import { usePasswordField } from '@shared/ui/PasswordField';
import { UserFormFields } from './userFormFields';
import { useRolesAndDepartments, useAvatarUpload, UserTableRow } from '@shared';
import { createUser, updateUser, resetUserPassword } from '@features/users';
import { useToast } from '@/context/ToastContext';

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: UserTableRow;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
}

export function UserForm({ mode, user, onClose, onSuccess, onDelete }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validatePassword } = usePasswordField();
  const { showToast } = useToast();
  const { departmentOptions, roleOptions, isLoading: isLoadingData } = useRolesAndDepartments();

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit User Account' : 'Create User Account';
  const submitLabel = isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create User');

  const getInitialFormData = () => {
    if (isEdit && user) {
      const nameParts = user.username.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        firstName,
        lastName,
        email: user.email,
        roleId: user.roleId || '',
        deptId: user.deptId || '',
        location: user.location || '',
        photo: user.photo || '',
        password: '',
      };
    }
    
    return {
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      deptId: '',
      location: '',
      photo: '',
      password: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const { 
    isUploading, 
    setAvatarUrl,
	handleFileUpload,
    uploadPendingForUser,
    pendingFile 
  } = useAvatarUpload({
    targetUserId: isEdit ? user?.userId : undefined,
    onSuccess: (url) => {
        setFormData(prev => ({ ...prev, photo: url }));
    },
    onPreview: (preview) => {
        setFormData(prev => ({ ...prev, photo: preview }));
    },
  });

  useEffect(() => {
    if (isEdit && user?.photo) {
      setAvatarUrl(user.photo);
      setFormData(prev => ({ ...prev, photo: user.photo }));
    }
  }, [isEdit, user]);

  const handleFileSelect = (file: File) => {
    handleFileUpload(file);
  };

  useEffect(() => {
    if (isEdit && user && !isLoadingData && departmentOptions.length && roleOptions.length) {
      const matchedDept = user.deptId
        ? departmentOptions.find(d => d.id === user.deptId)
        : departmentOptions.find(d => d.name === user.department);
      const matchedRole = user.roleId
        ? roleOptions.find(r => r.id === user.roleId)
        : roleOptions.find(r => r.name === user.role);
      
      if (matchedDept || matchedRole) {
        setFormData(prev => ({
          ...prev,
          deptId: matchedDept?.id || prev.deptId,
          roleId: matchedRole?.id || prev.roleId,
        }));
      }
    }
  }, [isEdit, user, isLoadingData, departmentOptions, roleOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    if (value) {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // Validate password if provided
  if (formData.password && formData.password.trim() !== '') {
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      showToast('error', validation.errors.join('. '));
      return;
    }
  }

  setIsSubmitting(true);

  try {
    if (isEdit && user) {
      // update user (without password update)
      const updateData: any = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        roleId: formData.roleId,
        dpId: formData.deptId || undefined,
        country: formData.location || undefined,
        avatarUrl: formData.photo || undefined,
      };

      await updateUser(user.userId, updateData);

      // password update (admin dont need old password - /reset-password in be)
      if (formData.password && formData.password.trim() !== '') {
        try {
          await resetUserPassword(user.userId, formData.password);
          showToast('success', 'User updated and password reset successfully!');
        } catch (passwordErr) {
          const errorMessage = passwordErr instanceof Error ? passwordErr.message : 'Failed to reset password';
          showToast('error', errorMessage);
          setIsSubmitting(false);
          return;
        }
      } else {
        showToast('success', 'User updated successfully!');
      }

      onSuccess();
      onClose();
    } else {
	  // create user
      const userData: any = {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        roleId: formData.roleId,
        workspaceId: '',
        dpId: formData.deptId || undefined,
        password: formData.password || undefined,
      };

      const response = await createUser(userData);

      if (response.success) {
        if (pendingFile && response.data.userId) {
          await uploadPendingForUser(response.data.userId);
        }

        if (response.data.temporaryPassword) {
          showToast('success', `User created successfully!\nTemporary password: ${response.data.temporaryPassword}`);
        } else {
          showToast('success', 'User created successfully!');
        }
        onSuccess();
        onClose();
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} user`;
    showToast('error', errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

 const handleDelete = async () => {
  if (!user) return;
  
  if (window.confirm(`Are you sure you want to delete "${user.username}"? This action cannot be undone.`)) {
    if (onDelete) {
      await onDelete();
    }
  }
};

  if (isLoadingData && isEdit) {
    return (
      <div className="relative flex items-start gap-4">
        <div className="bg-background-1 rounded-3xl p-6 shadow-2xl w-[368px] h-[200px] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-start gap-4">
      <div 
        className="relative bg-background-1 rounded-3xl p-6 shadow-2xl flex flex-col w-[368px] h-[650px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="w-5" />
          <h1 className="text-lime font-semibold text-lg">{title}</h1>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-foreground-3 hover:text-white transition-colors cursor-pointer"
          >
			{/* svg to replace with x icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <UserFormFields
            formData={formData}
            onChange={handleChange}
            onPasswordChange={handlePasswordChange}
            onFileSelect={handleFileSelect}
            mode={mode}
            departmentOptions={departmentOptions}
            roleOptions={roleOptions}
            isLoadingData={isLoadingData}
            showPhoto={true}
            isUploading={isUploading}
            userDisplayName={`${formData.firstName} ${formData.lastName}`.trim() || 'User'}
            userId={isEdit && user ? user.userId : undefined}
          />

          <div className="flex gap-3 pt-4">
			<button
				type="submit"
				disabled={isSubmitting}
				className={`${isEdit ? 'flex-1' : 'w-[200px] mx-auto'} btn-lime-outline-solid`}
			>
				{submitLabel}
			</button>
			
			{isEdit && (
				<button
				type="button"
				onClick={handleDelete}
				className="btn-danger-outline-solid"
				>
				Delete
				</button>
			)}
			</div>
        </form>
      </div>
    </div>
  );
}
