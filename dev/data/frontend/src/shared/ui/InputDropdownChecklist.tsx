import { useState, useRef, useEffect, useMemo } from 'react';
import { IconDown } from './Icons';

interface User {
  userId: string;
  userName: string;
  userEmail?: string;
}

interface InputDropdownProps {
  title?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  emptyText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  // New props for custom dropdown
  users?: User[];
  selectedUserIds?: string[];
  onUserToggle?: (userId: string) => void;
}

export function InputDropdownChecklist({ 
  title,
  name,
  required = false,
  placeholder = 'Select an option',
  emptyText = 'Data not found',
  error = '',
  disabled = false,
  className = '',
  users = [],
  selectedUserIds = [],
  onUserToggle
}: InputDropdownProps) {
  const [memberOpen, setMemberOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMemberOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected label for display
  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.userId));
  const selectedText = selectedUsers.length > 0 ? selectedUsers.map((user) => user.userName).join(', ') : placeholder;
  const filteredUsers = useMemo(() => {
      return users.filter((user) =>
      user.userName.toLowerCase().includes(search.toLowerCase())
      );
  }, [users, search]);

  // Handle user toggle (for multi-select with users)
  const handleUserToggle = (userId: string) => {
    if (onUserToggle) {
      onUserToggle(userId);
    }
  };

  // Check if a user is selected
  const isUserSelected = (userId: string) => {
    return selectedUserIds?.includes(userId) || false;
  };

  return (
    <div className="flex flex-col gap-y-1">
      {title && (
        <label className="input-label">
          {title}
          {required && <span className="text-xs text-accent-lime"> *</span>}
        </label>
      )}

      <div className={`input-base p-0 border-transparent ${error ? 'input-error' : ''}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setMemberOpen(!memberOpen)}
          className={`input-base select-base flex items-center justify-center ${!selectedUserIds?.length ? 'text-white/50' : 'text-white'} ${className}`}
          disabled={disabled}
        >
          <span className="truncate text-left w-full">{selectedText}</span>
          <span className={`w-4 h-4 text-white/40 transform transition-transform ${memberOpen ? 'rotate-180' : ''}`}>
            <IconDown/>
          </span>
        </button>

        {memberOpen && !disabled && (
          <div className="max-h-72 overflow-y-auto
          mt-2 bg-background-1 border border-background-4 rounded-xl shadow-2xl z-50 py-1.5">
            {users.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">
                {emptyText}
              </p>
            ) : (
              <>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 outline-none border-b border-transparent focus:border-background-4 mb-2"
              />
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                    No users found.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user.userId}
                    className="flex cursor-pointer items-center gap-4 px-4 py-3 text-base text-gray-200 hover:bg-background-3"
                  >
                    <input
                      type="checkbox"
                      checked={isUserSelected(user.userId)}
                      onChange={() => handleUserToggle(user.userId)}
                      className="h-5 w-5 accent-lime-300"
                    />
                    <div>
                      <p>{user.userName}</p>
                      <p className="text-sm text-foreground-3/90">{user.userEmail}</p>
                    </div>
                  </label>
                ))
              )}
              </>
            )}
          </div>
        )}
      </div>

      {error && <span className="error-message">{error}</span>}
    </div>
  )
}