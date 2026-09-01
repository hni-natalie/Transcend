import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useSocket } from '@/context/SocketContext';
import { userApi } from '@features/users';
import { toUserList, UserTableRow, FilterLayout, ErrorState } from '@shared';
import { UserTable } from './components/UserTable';
import { UserModals } from './components/UserModals';
import { STATUS_OPTIONS } from '@shared/lib/constants/userStatus';

interface UserManagementProps {
  showAddForm: boolean;
  onCloseAddForm: () => void;
}

export const UserManagement = ({
  showAddForm,
  onCloseAddForm,
}: UserManagementProps) => {
  const [users, setUsers] = useState<UserTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { showToast } = useToast();
  const { userStatuses } = useSocket();

  // Load users
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUsers = await userApi.fetchAllUsers();
      const mappedUsers = backendUsers.map(toUserList);
      const sortedUsers = [...mappedUsers].sort((a, b) => 
        a.username.localeCompare(b.username)
      );
      setUsers(sortedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, filterValue]);

  const usersWithLiveStatus = users.map(u => ({
    ...u,
    status: userStatuses[u.userId] ?? u.status,
  }));

  // Delete handler
  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      await userApi.deleteUser(userId);
      showToast('success', `User "${username}" deleted successfully`);
      await loadUsers();
      setShowEditForm(false);
      setSelectedUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      showToast('error', errorMessage);
    }
  };

  // Filter helpers
  const getUniqueDepartments = () => {
    const depts = new Set(usersWithLiveStatus.map(u => u.department).filter(Boolean));
    return Array.from(depts).sort();
  };

  const getUniqueRoles = () => {
    const roles = new Set(usersWithLiveStatus.map(u => u.role).filter(Boolean));
    return Array.from(roles).sort();
  };

  const getUniqueStatuses = () => {
    return STATUS_OPTIONS.map(opt => opt.label);
  };

  const statusBackendMap = STATUS_OPTIONS.reduce((acc, opt) => ({
	...acc,
	[opt.label]: opt.value
  }), {} as Record<string, string>);


  const getFilterOptions = () => {
    if (activeFilter === 'Department') return getUniqueDepartments();
    if (activeFilter === 'Role') return getUniqueRoles();
    if (activeFilter === 'Status') return getUniqueStatuses();
    return [];
  };

  const getFilterLabel = () => {
    if (activeFilter === 'Department') return 'Department';
    if (activeFilter === 'Role') return 'Role';
    if (activeFilter === 'Status') return 'Status';
    return '';
  };

  const filterTabs = [
    { label: 'All', value: 'All' },
    { label: 'Department', value: 'Department' },
    { label: 'Role', value: 'Role' },
    { label: 'Status', value: 'Status' },
  ];

  // Filter logic
  const filteredUsers = usersWithLiveStatus.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (activeFilter === 'Department' && filterValue) {
      return user.department === filterValue;
    }
    if (activeFilter === 'Role' && filterValue) {
      return user.role === filterValue;
    }
    if (activeFilter === 'Status' && filterValue) {
    return user.status === statusBackendMap[filterValue];
  }

    return true;
  });

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);

  // Clamp page if it becomes out of range (e.g. after deleting the last user on a page)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setFilterValue('');
  };

  const handleFilterSelect = (value: string) => {
    setFilterValue(value);
  };

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} size="medium" />;
  }


  return (
    <>
      <FilterLayout
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search users..."
        filterTabs={filterTabs}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        filterValue={filterValue}
        onFilterSelect={handleFilterSelect}
        filterOptions={getFilterOptions()}
        getFilterLabel={getFilterLabel}
        isLoading={isLoading}
		isEmpty={displayedUsers.length === 0}
        emptyMessage="No users found"
        showPagination={true}
        totalItems={totalUsers}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalPages={totalPages}
      >
        <UserTable 
          users={displayedUsers} 
          onEdit={(user) => {
            setSelectedUser(user);
            setShowEditForm(true);
          }}
        />

        <UserModals
          showAddForm={showAddForm}
          showEditForm={showEditForm}
          selectedUser={selectedUser}
          onCloseAdd={onCloseAddForm}
          onCloseEdit={() => setShowEditForm(false)}
          onAddSuccess={() => {
            onCloseAddForm();
            loadUsers();
          }}
          onEditSuccess={() => {
            setShowEditForm(false);
            loadUsers();
          }}
          onDeleteUser={handleDeleteUser}
        />
      </FilterLayout>
    </>
  );
};