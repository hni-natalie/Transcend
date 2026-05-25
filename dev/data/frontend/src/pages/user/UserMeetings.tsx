import { useEffect, useMemo, useState } from 'react';
import { PageHeader, IconMeetings } from '@shared';
import { MeetingColumn } from '@features/meetings';
import { meetingApi } from '@features/meetings';
import { useAuth } from '@/features/auth/AuthContext';

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
};

type ApiMeeting = {
  meetId: string;
  meetTitle: string;
  meetDesc?: string;
  meetStart: string;
  meetEnd: string;

  pinned: boolean;

  participants?: any[];
  _count?: {
    participants: number;
  };
};

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
  date: new Date(m.meetStart).toLocaleDateString(),
  time: new Date(m.meetStart).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }),
  duration: getDuration(m.meetStart, m.meetEnd),
  participants: m._count?.participants ?? m.participants?.length ?? 0,
  pinned: m.pinned,
  meetStart: m.meetStart,
  meetEnd: m.meetEnd,
});

export const Meetings = () => {
  const { user } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [myMeetings, setMyMeetings] = useState<Meeting[]>([]);

  // ======================
  // FETCH
  // ======================
  useEffect(() => {
    const load = async () => {
      try {
        const res = (await meetingApi.getAllMeetings()) as {
          success: boolean;
          data: ApiMeeting[];
        };

        setMeetings(res.data.map(mapMeeting));

        if (user?.userId) {
          const myRes = (await meetingApi.getMyMeetings(user.userId)) as {
            success: boolean;
            data: ApiMeeting[];
          };

          setMyMeetings(myRes.data.map(mapMeeting));
        }
      } catch (err) {
        console.error('Failed to load meetings:', err);
      }
    };

    load();
  }, [user]);

  // ======================
  // TOGGLE PIN
  // ======================
  const handleTogglePin = async (id: string) => {
    try {
      const res = (await meetingApi.toggleMeetingPin(id)) as {
        success: boolean;
        data: {
          pinned: boolean;
        };
      };

      const newPinned = res.data.pinned;

      setMeetings(prev =>
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
  // GROUPING (FIXED - NO OVERLAP)
  // ======================
  const grouped = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return {
      today: meetings.filter(
        m =>
          new Date(m.meetStart) >= startOfToday &&
          new Date(m.meetStart) <= endOfToday
      ),

      upcoming: meetings.filter(
        m => new Date(m.meetStart) > endOfToday
      ),

      past: meetings.filter(
        m => new Date(m.meetStart) < startOfToday
      ),

      mine: myMeetings,
    };
  }, [meetings, myMeetings]);

  // ======================
  // UI
  // ======================
  return (
    <>
      <PageHeader
        icon={<IconMeetings className="w-7 h-7" />}
        title="Meetings"
        action={
          <button className="bg-accent-lime-bg text-accent-lime border border-accent-lime px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider hover:opacity-90 transition-opacity">
            + Schedule Meeting
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-3 p-4">
        <MeetingColumn
          label="Today"
          action="join"
          meetings={grouped.today}
          onTogglePin={handleTogglePin}
        />

        <MeetingColumn
          label="Upcoming"
          action="join"
          meetings={grouped.upcoming}
          onTogglePin={handleTogglePin}
        />

        <MeetingColumn
          label="Past"
          action="transcript"
          meetings={grouped.past}
          onTogglePin={handleTogglePin}
        />

        <MeetingColumn
          label="My Meetings"
          action="manage"
          meetings={grouped.mine}
          onTogglePin={handleTogglePin}
        />
      </div>
    </>
  );
};
