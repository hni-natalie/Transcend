import { PageHeader, IconMessages } from '@shared';
// import features 

export const Messages = () => {
  return (
	<>
	  <PageHeader 
		icon={<IconMessages className="w-7 h-7" />}
		title="Messages"
	  />
	  <div className="flex items-center justify-center h-full">
		<p className="text-foreground-3">Messages coming soon...</p>
	  </div>
	</>
  );
};

