/* user chip - sidebar */
export type UserChipItem = {
	name: string;
	role: string;
	photo: string;
};

/* user account (for admin users table) */
export interface UserAccount {
	id: string;			// need truncation? since its uuid
	username: string;
	// firstName: string;
	// lastName: string;
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

export type Position = {
  x:number,
  y:number,
  z:number,
}

export type Player = {
  id: string;
  name?: string;
  roomName?: string;
  position: Position;
  rotation?: number;
  color: string;
	photo: string;
  audioEnabled?: boolean;
  speaking?: boolean;
}