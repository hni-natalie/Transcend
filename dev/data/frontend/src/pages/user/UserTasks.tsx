import { PageHeader, IconTasks } from '@shared';
// import features 

export const Tasks = () => {
  return (
	<>
	  <PageHeader 
		icon={<IconTasks className="w-7 h-7" />}
		title="Tasks"
	  />
	  <div className="flex items-center justify-center h-full">
		<p className="text-content-2">Tasks coming soon...</p>
	  </div>
	</>
  );
};
