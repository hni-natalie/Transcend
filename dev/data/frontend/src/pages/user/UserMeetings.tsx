import { PageHeader, IconMeetings } from '@shared';
// import features 

export const Meetings = () => {
  return (
	<>
	  <PageHeader 
		icon={<IconMeetings className="w-7 h-7" />}
		title="Meetings"
	  />
      <div className="flex items-center justify-center h-full">
		<p className="text-content-2">Meetings coming soon...</p>
      </div>
	</>
  );
};
