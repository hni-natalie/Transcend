import { useEffect, useMemo, useState, useCallback } from 'react';
import { PageHeader, IconMeetings } from '@shared';
import { meetingApi, MeetingColumn, MeetingDetailsModal, ScheduleMeetingModal } from '@features/meetings';
import { useAuth } from '@/features/auth/AuthContext';
import { useSocket } from "@/context/SocketContext";

type Meeting = {
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
};

type ApiMeeting = {
	meetId: string;
	meetTitle: string;
	meetDesc?: string;
	meetStart: string;
	meetEnd: string;
	pinned: boolean;
	createdAt: string;
	_count?: {
		participants: number;
	};
	participants?: any[];
};

type MeetingDetails = {
	meetTitle: string;
	meetDesc?: string;
	meetStart: string;
	meetEnd: string;
	createdAt: string;
	participants: {
		role: string;
		attendance: string;
		user: {
			userName: string;
		};
	}[];
	_count: {
		participants: number;
	};
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
	date: new Date(m.meetStart).toLocaleDateString('en-MY', {
		timeZone: 'Asia/Kuala_Lumpur',
	}),

	time: new Date(m.meetStart).toLocaleTimeString('en-MY', {
		timeZone: 'Asia/Kuala_Lumpur',
		hour: '2-digit',
		minute: '2-digit',
	}),
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

	useEffect(() => {
		loadMeetings();
	}, [loadMeetings]);

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
	// GROUPING
	// ======================
	const grouped = useMemo(() => {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);

		const endOfToday = new Date();
		endOfToday.setHours(23, 59, 59, 999);

		return {
			today: joinedMeetings.filter(
				m =>
					new Date(m.meetStart) >= startOfToday &&
					new Date(m.meetStart) <= endOfToday
			),

			upcoming: joinedMeetings.filter(
				m => new Date(m.meetStart) > endOfToday
			),

			past: joinedMeetings.filter(
				m => new Date(m.meetStart) < startOfToday
			),

			// Backend already returns this in descending order
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

			<div className="grid grid-cols-4 gap-3 p-4">
				<MeetingColumn
					label="Today"
					action="join"
					meetings={grouped.today}
					onTogglePin={handleTogglePin}
					onDelete={handleDeleteMeeting}
					onViewMore={handleViewMore}
				/>

				<MeetingColumn
					label="Upcoming"
					action="join"
					meetings={grouped.upcoming}
					onTogglePin={handleTogglePin}
					onDelete={handleDeleteMeeting}
					onViewMore={handleViewMore}
				/>

				<MeetingColumn
					label="Past"
					action="transcript"
					meetings={grouped.past}
					onTogglePin={handleTogglePin}
					onDelete={handleDeleteMeeting}
					onViewMore={handleViewMore}
				/>

				<MeetingColumn
					label="Scheduled"
					action="manage"
					meetings={grouped.mine}
					onTogglePin={handleTogglePin}
					onDelete={handleDeleteMeeting}
					onViewMore={handleViewMore}
				/>
			</div>

			<MeetingDetailsModal
				meeting={selectedMeeting}
				onClose={() => setSelectedMeeting(null)}
			/>

			<ScheduleMeetingModal
				open={showScheduleModal}
				onClose={() => setShowScheduleModal(false)}
				onCreated={() => {loadMeetings}}
			/>
		</>
	);
};
