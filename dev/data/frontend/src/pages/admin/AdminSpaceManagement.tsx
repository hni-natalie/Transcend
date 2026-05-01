import { FormAddWorkspace } from '@features/admin';
import { PageHeader, IconSpaces } from '@shared';

export const SpaceManagement = () => {
  return (
    <>
      <PageHeader 
        icon={<IconSpaces className="w-7 h-7" />}
        title="Spaces"
        action={
          <button className="bg-accent-lime-bg text-accent-lime border border-accent-lime px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider hover:opacity-90 transition-opacity">
            + Add Space
          </button>
        }
      />
      <div className='flex gap-8'>
        <FormAddWorkspace />
      </div>
    </>
  );
};
