import { Outlet, useLocation } from 'react-router-dom';
import { MenuSide } from '@shared/layout/MenuSide';
import { adminMenuConfig, userMenuConfig } from '@config/menu.config';

const getMenuForPath = (pathname: string) => {
  if (pathname.startsWith('/admin')) return adminMenuConfig;
  return userMenuConfig;
};

export const AppLayout = () => {
  const location = useLocation();
  const menuConfig = getMenuForPath(location.pathname);
  
  return (
    <div className='bg-background h-screen'>
      <div className='flex h-full'>
        <MenuSide conf={menuConfig} />
		<main className='flex-1 py-6 px-8 overflow-hidden flex flex-col'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// main className='flex-1 pt-6 px-8 overflow-auto'