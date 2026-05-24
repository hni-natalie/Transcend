import { PageHeader, IconMeetings } from '@shared';
import { MeetingColumn } from '@features/meetings/components/MeetingColumn';

export const Meetings = () => {
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
          meetings={[
            { id: '1', title: 'Product Review', description: 'Review product', date: 'Today', time: '16:30', duration: '90 min', participants: 2 },
            { id: '2', title: 'Standup', description: 'Daily sync', date: 'Today', time: '10:00', duration: '15 min', participants: 5 },
          ]}
        />

        <MeetingColumn
          label="Upcoming"
          action="join"
          meetings={[
            { id: '3', title: 'Client Review', description: 'Review app', date: 'May 1', time: '14:00', duration: '60 min', participants: 3 },
          ]}
        />

        <MeetingColumn
          label="Past"
          action="transcript"
          meetings={[
            { id: '9', title: 'Retro', description: 'Sprint review', date: 'March 16', time: '11:30', duration: '45 min', participants: 3 },
          ]}
        />

		<MeetingColumn
          label="My Meetings"
          action="manage"
          meetings={[
            { id: '9', title: 'Retro', description: 'Sprint review', date: 'March 16', time: '11:30', duration: '45 min', participants: 3 },
          ]}
        />

      </div>
    </>
  );
};