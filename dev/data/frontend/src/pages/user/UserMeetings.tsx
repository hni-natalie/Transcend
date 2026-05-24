import { useEffect, useMemo, useState } from 'react';
import { PageHeader, IconMeetings } from '@shared';
import { MeetingColumn } from '@features/meetings';
import { meetingApi } from '@features/meetings';

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
  isPinned: boolean;
  participants?: any[];
  _count?: { participants: number };
};

const getDuration = (start: string, end: string) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diff / 60000);

  if (mins < 60) return `${mins} min`;

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return m ? `${h}h ${m}m` : `${h}h`;
};

export const Meetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // ======================
  // FETCH MEETINGS
  // ======================
  useEffect(() => {
    const load = async () => {
      const res = await meetingApi.getAllMeetings() as {
        success: boolean;
        data: ApiMeeting[];
      };

      const mapped: Meeting[] = res.data.map((m) => ({
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
        pinned: m.isPinned ?? false,
        meetStart: m.meetStart,
        meetEnd: m.meetEnd,
      }));

      setMeetings(mapped);
    };

    load();
  }, []);

  // ======================
  // TOGGLE PIN
  // ======================
  const handleTogglePin = async (id: string) => {
    try {
      await meetingApi.toggleMeetingPin(id);

      setMeetings(prev =>
        prev.map(m =>
          m.id === id ? { ...m, pinned: !m.pinned } : m
        )
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // ======================
  // GROUPING LOGIC
  // ======================
  const grouped = useMemo(() => {
    const now = new Date();

    return {
      today: meetings.filter(m =>
        new Date(m.meetStart).toDateString() === now.toDateString()
      ),

      upcoming: meetings.filter(m =>
        new Date(m.meetStart) > now
      ),

      past: meetings.filter(m =>
        new Date(m.meetStart) < now
      ),

      mine: meetings,
    };
  }, [meetings]);

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
