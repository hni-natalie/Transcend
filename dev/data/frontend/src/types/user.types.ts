/* user chip - sidebar */
export type UserChipItem = {
	name: string;
	role: string;
	photo: string;
};

/* user account (for admin users table) */
export interface UserAccount {
	id: string;
	username: string; // eg - HR001
	firstName: string;
	lastName: string;
	email: string;
	department: string;
	role: string;
	location: string;
	photo: string;
	dateJoined: string;
}

/* user live status (for badge) */
export type UserStatus = 'Online' | 'Offline' | 'Busy' | 'In Meeting';

/* users - list row model */
export type UserList = UserAccount & {
	status: UserStatus;
};