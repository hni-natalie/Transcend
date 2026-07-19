export interface Space {
	spaceId: string;
	spaceName: string;
	workspaceId: string;
	accessLevel: string;
	departmentId: string;
	keyPersonId: string;
	isPublicBook: boolean;
	userCapacity: string;
	createdAt: Date;
	updatedAt: Date;
	isOccupied: boolean;
}