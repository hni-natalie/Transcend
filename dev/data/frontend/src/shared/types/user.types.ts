/* **************************************************************
*  INTERFACE
*  **************************************************************/

export interface User {
    socketId: string,
    userId: string;
    userEmail: string;
    userName: string;
    userStatus: UserBackendStatus;
	  roleId?: string;
    roleName?: string;
	  role: Role;
    // role: { roleId: string; roleName: string };
    workspace: { workspaceName: string };
	  department?: { dpId?: string; dpName: string } | null;
	userTitle?: string;
    avatarUrl?: string | null;
    city?: string;
    country?: string;
    timezone?: string;
    authProvider?: string;
    emailVerified?: boolean;
    createdAt?: string;
    updatedAt?: string;
	deletedAt?: string | null;
}

/* user account (for admin users table) */
export interface UserAccount {
	userId: string;
	username: string;
	email: string;
	deptId?: string;
	roleId?: string;
	department: string;
	role: string;
	userTitle?: string;
	location: string;
	photo: string;
	dateJoined: string;
}

export interface Role {
  roleId: string;
  roleName: string;
}

export interface Department {
  dpName: string;
  dpId?: string;
}

export interface DashboardUser extends User {
    department: Department | null;
	lastLoginAt?: string | null;
}


/* **************************************************************
*  TYPES
*  **************************************************************/

export type UserBackendStatus = 'online' | 'offline' | 'focus' | 'in_meeting' | 'away';
export type UserStatus = 'Online' | 'Offline' | 'Focus' | 'In Meeting' | 'Away';

/* user chip (for sidebar) */
export type UserChipItem = {
	name: User['userName'];
	email?: User['userEmail'];
	role: User['role']['roleName'];
	photo: string;
	status?: 'online' | 'focus' | 'in_meeting' | 'away' | 'offline';
};

/* users - list row model */
export type UserTableRow = UserAccount & {
	status: UserBackendStatus;
};

export type Position = {
	x:number,
	y:number,
	z:number,
}

export type Ownership = {
  ownerId: string | null;
  timestamp: number | null;
};

export type Player = {
	id: string;
    userId?: string;
	name?: string;
	roomName?: string;
	position: Position;
	rotation?: number;
	color?: string;
	photo: string;
	audioEnabled?: boolean;
	speaking?: boolean;
    dpId?: string;
    ownership?: Ownership;
}

/* **************************************************************
*  MAPPERS	
*  **************************************************************/

/* converts be User to UserAccount (admin table) */
export const toUserAccount = (user: User): UserAccount => {
    // Combine city and country into location string
    // const location = [user.city, user.country]
    //     .filter(Boolean)
    //     .join(', ') || '-';
    
    return {
		userId: user.userId,
        username: user.userName,
        email: user.userEmail,
        deptId: user.department?.dpId,
        roleId: user.roleId ?? user.role?.roleId,
        department: user.department?.dpName ?? '-',
        role: user.role?.roleName ?? '-',
		userTitle: user.userTitle ?? '-',
        location: user.country ?? '-',
        photo: user.avatarUrl ?? '',
        dateJoined: user.createdAt 
            ? new Date(user.createdAt).toLocaleDateString() 
            : '-'
    };
};

/* converts be User to UserList (admin table) */
export const toUserList = (user: User): UserTableRow => {    
    return {
        ...toUserAccount(user),
        status: user.userStatus
    };
};

/* converts be User to UserChipItem (sidebar)*/
export const toUserChipItem = (user: User): UserChipItem => ({
    name: user.userName,
	email: user.userEmail,
    role: user.role.roleName,
    photo: user.avatarUrl ?? '',
	status: user.userStatus,
});

/* safe display name for historical/shared references (task assignees, meeting
   participants, message authors) where the user may have been GDPR-erased.
   Prefer this over reading user.userName directly in those contexts. */
export const getDisplayName = (user: Pick<User, 'userName' | 'deletedAt'> | null | undefined): string => {
    if (!user || user.deletedAt) return 'Deleted User';
    return user.userName;
};

/* avatar counterpart — never render a scrubbed avatar, even if avatarUrl
   happens to still hold a stale value at read time */
export const getDisplayAvatar = (user: Pick<User, 'avatarUrl' | 'deletedAt'> | null | undefined): string | null => {
    if (!user || user.deletedAt) return null;
    return user.avatarUrl ?? null;
};


// // Helper function to get status display for dashboard
// export const getStatusDisplay = (status: User['userStatus']) => {
//     switch (status) {
//         case 'online': return { text: 'Available', color: 'text-accent-lime', ringColor: 'bg-accent-lime' };
//         case 'focus': return { text: 'Focus', color: 'text-accent-teal', ringColor: 'bg-accent-teal' };
//         case 'in_meeting': return { text: 'In Meeting', color: 'text-accent-gold', ringColor: 'bg-accent-gold' };
//         default: return { text: 'Offline', color: 'text-foreground-4', ringColor: 'bg-foreground-4' };
//     }
// };
