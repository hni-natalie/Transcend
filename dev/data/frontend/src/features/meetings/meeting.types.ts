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
        attendance: "present" | "absent" | "pending";

        user: {
            userName: string;
            userEmail: string;
			deletedAt?: string | null;
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
	deletedAt?: string | null;
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


export type Recording = {
    recordingId: string;
    meetId: string;
    status: 
        | "starting"
        | "active"
        | "stopped"
        | "completed"
        | "failed";
    filename: string;
    fileUrl: string | null;
    summary: string | null;
    summaryStatus: "pending" | "completed" | "failed";
    createdAt: string;
};


export type MeetingChatMessage = {
  id: string;
  meetId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export type RecordingStatus =
  | 'starting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'stopped';

export interface RecordingStatusResponse {
  success: boolean;
  status: {
    status: RecordingStatus;
  } | null;
}
