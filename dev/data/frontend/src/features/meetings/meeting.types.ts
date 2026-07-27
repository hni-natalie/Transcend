export type MeetingDetails = {
    meetId: string;
    meetTitle: string;
    meetDesc?: string;
    meetStart: string;
    meetEnd: string;
    status: "scheduled" | "started";

    participants: {
        userId: string;
        role: "organiser" | "participant";
        attendance: "present" | "absent";

        user: {
            userName: string;
            userEmail: string;
        };
    }[];

    _count: {
        participants: number;
    };
};

export type Participant = {
    userId: string;
    userName: string;
    userEmail: string;
    role: "organiser" | "participant";
    attendance: "present" | "absent" | "pending";
};


export type Meeting = {
	id: string;
	title: string;
	description: string;
	date: string;
	time: string;
	duration: string;
	participants: number;
	pinned: boolean;
	meetStart: string;
	meetEnd: string;
	createdAt: string;
    status: "scheduled" | "started";
    createdByUserId: string;
};