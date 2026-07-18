export type MeetingDetails = {
    meetId: string;
    meetTitle: string;
    meetDesc?: string;
    meetStart: string;
    meetEnd: string;

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