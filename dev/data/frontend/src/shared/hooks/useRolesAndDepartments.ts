import { useState, useEffect } from 'react';
import { Role, Department } from '@shared'
import { fetchRoles, fetchDepartments } from '@features/users';
import { useToast } from '@/context/ToastContext';

interface UseRolesAndDepartmentsResult {
  roles: Role[];
  departments: Department[];
  isLoading: boolean;
  departmentOptions: { id: string; name: string }[];
  roleOptions: { id: string; name: string }[];
  refetch: () => Promise<void>;
}

export const useRolesAndDepartments = (): UseRolesAndDepartmentsResult => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, departmentsData] = await Promise.all([
        fetchRoles(),
        fetchDepartments()
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (err) {
      showToast('error', 'Failed to load roles or departments');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const departmentOptions = departments
    .filter((dept): dept is Department & { dpId: string } => dept.dpId !== undefined)
    .map(dept => ({
      id: dept.dpId,
      name: dept.dpName
    }));

  const roleOptions = roles.map(role => ({
    id: role.roleId,
    name: role.roleName
  }));

  return {
    roles,
    departments,
    isLoading,
    departmentOptions,
    roleOptions,
    refetch: fetchData,
  };
}