import { useState } from 'react';
import { FormAddWorkspace } from '@features/admin';
import { PageHeader, IconSpaces, Modal } from '@shared';

export const SpaceManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      <PageHeader 
        icon={<IconSpaces className="w-7 h-7" />}
        title="Spaces"
        action={
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-header"
          >
            + Add Space
          </button>
        }
      />

	  <div className="flex items-center justify-center h-full">
        <p className="text-foreground-3">Space Management coming soon...</p>
      </div>
      
      <div className='flex gap-8'>
      </div>

      {/* Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)}>
        <FormAddWorkspace 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            // Refresh spaces list here
          }}
        />
      </Modal>
    </>
  );
};

// import { FormAddWorkspace } from '@features/admin';
// import { PageHeader, IconSpaces } from '@shared';

// export const SpaceManagement = () => {
//   return (
//     <>
//       <PageHeader 
//         icon={<IconSpaces className="w-7 h-7" />}
//         title="Spaces"
//         action={
//           <button className="bg-accent-lime-bg text-accent-lime border border-accent-lime px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider hover:opacity-90 transition-opacity">
//             + Add Space
//           </button>
//         }
//       />
//       <div className='flex gap-8'>
//         <FormAddWorkspace />
//       </div>
//     </>
//   );
// };
