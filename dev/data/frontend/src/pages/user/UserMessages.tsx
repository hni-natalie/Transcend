import { useState } from 'react';
import { PageHeader, IconMessages, IconPlus } from '@shared';
import  Messaging  from '@features/messages/Messages';

export const Messages = () => {
	const [showAddForm, setShowAddForm] = useState(false);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <PageHeader
		  icon={<IconMessages className="w-7 h-7" />} title="Messages"
		  action={
        	<button
              onClick={() => setShowAddForm(true)}
              className="btn-header"
          	>
			  <IconPlus className="w-4 h-4" />
              Create Message
          	</button>
    	  }
		/>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Messaging
		  showAddForm={showAddForm} 
		  onCloseAddForm={() => setShowAddForm(false)} 
		/>
      </div>
    </div>
  );
};


