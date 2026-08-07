import { useEffect, useMemo, useState, useCallback } from 'react';
import { PageHeader, IconMeetings } from '@shared';
import { meetingApi, MeetingColumn, MeetingDetailsModal, ScheduleMeetingModal, RecordingModal, MeetingChatModal } from '@features/meetings';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from "@/context/SocketContext";
import type { MeetingDetails, Meeting, Recording, MeetingChatMessage } from '@features/meetings/meeting.types';

type Participant = {
    userId: string;
    userName: string;
    userEmail: string;
    role: "organiser" | "participant";
    attendance: "present" | "absent";
};

type ApiMeeting = {
	meetId: string;
	meetTitle: string;
	createdByUserId?: string;
	meetDesc?: string;
	meetStart: string;
	meetEnd: string;
	pinned: boolean;
	createdAt: string;
	status: "scheduled" | "started";
	_count?: {
		participants: number;
	};
	participants?: Participant[];
};

// ======================
// UTILS
// ======================
const getDuration = (start: string, end: string) => {
	const diff = new Date(end).getTime() - new Date(start).getTime();
	const mins = Math.round(diff / 60000);

	if (mins < 60) return `${mins} min`;

	const h = Math.floor(mins / 60);
	const m = mins % 60;

	return m ? `${h}h ${m}m` : `${h}h`;
};

const mapMeeting = (m: ApiMeeting): Meeting => ({
	id: m.meetId,
	title: m.meetTitle,
	description: m.meetDesc ?? '',
	createdByUserId: m.createdByUserId ?? '', // Assuming createdByUserId is part of ApiMeeting
	date: new Date(m.meetStart).toLocaleDateString('en-MY', {
		timeZone: 'Asia/Kuala_Lumpur',
	}),

	time: new Date(m.meetStart).toLocaleTimeString('en-MY', {
		timeZone: 'Asia/Kuala_Lumpur',
		hour: '2-digit',
		minute: '2-digit',
	}),
	status: m.status ?? "scheduled",
	duration: getDuration(m.meetStart, m.meetEnd),
	participants: m._count?.participants ?? m.participants?.length ?? 0,
	pinned: m.pinned,
	meetStart: m.meetStart,
	meetEnd: m.meetEnd,
	createdAt: m.createdAt,
});

// ======================
// COMPONENT
// ======================
export const Meetings = () => {
	const { user } = useAuth();

	// Meetings the user created OR joined
	const [joinedMeetings, setJoinedMeetings] = useState<Meeting[]>([]);

	// Meetings created by the user
	const [myMeetings, setMyMeetings] = useState<Meeting[]>([]);

	const [message, setMessage] = useState<string | null>(null);
	const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetails | null>(null);
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [editingMeeting, setEditingMeeting] = useState<MeetingDetails | null>(null);
	const [showRecordingModal, setShowRecordingModal] = useState(false);
	const [recordings, setRecordings] = useState<Recording[]>([]);
	const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
	const [showChatModal, setShowChatModal] = useState(false);
	const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);

	// ======================
	// FETCH
	// ======================
	const loadMeetings = useCallback(async () => {
		try {
			if (!user?.userId) return;

			const joinedRes = await meetingApi.getJoinedMeetings(user.userId) as {
				success: boolean;
				data: ApiMeeting[];
			};

			setJoinedMeetings(joinedRes.data.map(mapMeeting));

			const myRes = await meetingApi.getMyMeetings(user.userId) as {
				success: boolean;
				data: ApiMeeting[];
			};

			setMyMeetings(myRes.data.map(mapMeeting));
		} catch (err) {
			console.error("Failed to load meetings:", err);
		}
	}, [user]);

	useEffect(() => { loadMeetings(); }, [loadMeetings]);

	const { socket } = useSocket();

	useEffect(() => {
		if (!socket) return;

		const handleMeetingUpdated = () => {
			console.log("Meeting updated - reloading...");
			loadMeetings();
		};

		socket.on("meetingUpdated", handleMeetingUpdated);

		return () => {
			socket.off("meetingUpdated", handleMeetingUpdated);
		};
	}, [socket, loadMeetings]);

	// ======================
	// PIN TOGGLE
	// ======================
	const handleTogglePin = async (id: string) => {
		try {
			const res = (await meetingApi.toggleMeetingPin(id)) as {
				success: boolean;
				data: { pinned: boolean };
			};

			const newPinned = res.data.pinned;

			setJoinedMeetings(prev =>
				prev.map(m =>
					m.id === id ? { ...m, pinned: newPinned } : m
				)
			);

			setMyMeetings(prev =>
				prev.map(m =>
					m.id === id ? { ...m, pinned: newPinned } : m
				)
			);
		} catch (err) {
			console.error('Failed to toggle pin:', err);
		}
	};

	// ======================
	// DELETE MEETING
	// ======================
	const handleDeleteMeeting = async (id: string) => {
		const confirmed = window.confirm(
			'Delete this meeting? This cannot be undone.'
		);

		if (!confirmed) return;

		try {
			await meetingApi.deleteMeeting(id);

			setJoinedMeetings(prev =>
				prev.filter(m => m.id !== id)
			);

			setMyMeetings(prev =>
				prev.filter(m => m.id !== id)
			);

			setMessage('Meeting deleted successfully');

			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			console.error('Failed to delete meeting:', err);
		}
	};

	// ======================
	// VIEW MEETING
	// ======================
	const handleViewMore = async (id: string) => {
		try {
			const res = (await meetingApi.getMeetingById(id)) as {
				success: boolean;
				data: MeetingDetails;
			};

			setSelectedMeeting(res.data);
		} catch (err) {
			console.error('Failed to load meeting details:', err);
		}
	};

	// ======================
	// EDIT MEETING
	// ======================
	const handleEdit = async (id: string) => {
		try {
			const res = (await meetingApi.getMeetingById(id)) as {
				success: boolean;
				data: MeetingDetails;
			};

			setEditingMeeting(res.data);
			setShowScheduleModal(true);
		} catch (err) {
			console.error('Failed to load meeting details:', err);
		}
	};

	// ======================
	// VIEW RECORDING
	// ======================
	const handleViewRecording = async (meetId: string) => {
		try {
			const res = await meetingApi.getRecordings(meetId) as {
				success: boolean;
				recordings: Recording[];
			};

			setRecordings(res.recordings);
			setSelectedMeetingId(meetId);
			setShowRecordingModal(true);

		} catch (err) {
			console.error( "Failed to load recordings:", err );
		}
	};

	// ======================
	// VIEW CHAT HISTORY
	// ======================
	const handleViewChat = async (meetId: string) => {
		try {
			const res = await meetingApi.getChatMessages(meetId) as {
				data: MeetingChatMessage[];
			};

			setChatMessages(res.data);
			setShowChatModal(true);

		} catch (err) {
			console.error("Failed to load chat:", err);
		}
	};

	// ======================
	// GROUPING
	// ======================
	const grouped = useMemo(() => {
		const now = new Date(
			new Date().toLocaleString("en-US", {
				timeZone: "Asia/Kuala_Lumpur",
			})
		);

		const isToday = (date: Date) =>
			date.toDateString() === now.toDateString();

		const sortAscending = (a: Meeting, b: Meeting) =>
			new Date(a.meetStart).getTime() -
			new Date(b.meetStart).getTime();

		return {
			// Any meeting today that hasn't ended
			today: joinedMeetings
				.filter((m) => {
					const start = new Date(m.meetStart);
					const end = new Date(m.meetEnd);

					return isToday(start) && end > now;
				})
				.sort(sortAscending),

			// Starts after today
			upcoming: joinedMeetings
				.filter((m) => {
					const start = new Date(m.meetStart);

					return !isToday(start) && start > now;
				})
				.sort(sortAscending),

			// Already ended
			past: joinedMeetings
				.filter((m) => {
					const end = new Date(m.meetEnd);

					return end <= now;
				})
				.sort(
					(a, b) =>
						new Date(b.meetStart).getTime() -
						new Date(a.meetStart).getTime()
				),

			mine: myMeetings,
		};
	}, [joinedMeetings, myMeetings]);

	// ======================
	// UI
	// ======================
	return (
		<>
			<PageHeader
				icon={<IconMeetings className="w-7 h-7" />}
				title="Meetings"
				action={
					<button
						onClick={() => setShowScheduleModal(true)} 
						className="bg-accent-lime-bg text-accent-lime border border-accent-lime px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider hover:opacity-90 transition-opacity"
					>
						+ Schedule Meeting
					</button>
				}
			/>

			{message && (
				<div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
					{message}
				</div>
			)}

			<div className="flex-1 overflow-y-auto p-4">
				<div className="grid grid-cols-4 gap-3">
				<MeetingColumn
					label="Today"
					action="join"
					meetings={grouped.today}
					userId={user?.userId ?? ""}
					onTogglePin={handleTogglePin}
					onViewMore={handleViewMore}
				/>

				<MeetingColumn
					label="Upcoming"
					action="join"
					meetings={grouped.upcoming}
					userId={user?.userId ?? ""}
					onTogglePin={handleTogglePin}
					onViewMore={handleViewMore}
				/>

				<MeetingColumn
					label="Past"
					action="transcript"
					meetings={grouped.past}
					userId={user?.userId ?? ""}
					onTogglePin={handleTogglePin}
					onViewMore={handleViewMore}
					onViewRecording={handleViewRecording}
					onViewChat={handleViewChat}	
				/>

				<MeetingColumn
					label="Scheduled"
					action="manage"
					meetings={grouped.mine}
					userId={user?.userId ?? ""}
					onTogglePin={handleTogglePin}
					onDelete={handleDeleteMeeting}
					onViewMore={handleViewMore}
					onEdit={handleEdit}
				/>
				</div>
			</div>

			<MeetingDetailsModal
				meeting={selectedMeeting}
				onClose={() => setSelectedMeeting(null)}
			/>

			{showChatModal && (
				<MeetingChatModal
					messages={chatMessages}
					onClose={() => {
					setShowChatModal(false);
					setChatMessages([]);
					}}
				/>
			)}

			{showRecordingModal && (
				<RecordingModal
					meetId={selectedMeetingId ?? ""}
					recordings={recordings}
					onClose={() => {
						setShowRecordingModal(false);
						setRecordings([]);
					}}
				/>
			)}

			<ScheduleMeetingModal
				open={showScheduleModal}
				mode={editingMeeting ? "edit" : "create"}
				meeting={editingMeeting ?? undefined}
				onClose={() => {
					setShowScheduleModal(false);
					setEditingMeeting(null);
				}}
				onCreated={loadMeetings}
				onUpdated={loadMeetings}
			/>
		</>
	);
};
