export interface Department {
	dpId: string;
	dpName: string;
	dpLead: string | null;
	workspaceId: string;
	createdAt: Date;
	updatedAt: Date;
}