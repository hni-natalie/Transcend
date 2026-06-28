import React, { ReactElement, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { adminMenuConfig, userMenuConfig } from '@config/menu.config';
import { UserChip } from '@features/users';
import { IconCollapse, IconLogout } from '@shared/ui/Icons';
import { MenuConfig, MenuItem } from '@shared/types/menu.types';
import { UserChipItem } from '@shared/types/user.types';
import { useAuth } from '@/features/auth/AuthContext';
import { useLiveKit } from '@features/livekit'

// TODO: add logout inline with user chip (hover avatar > logout icon?)
// mock user for now
// function getUserData(): UserChipItem {
//   return {
//     name: "Mary Doe",
//     role: "Human Resource",
//     photo: "https://images.pexels.com/photos/36393879/pexels-photo-36393879.jpeg"
//   };
// }

const getMenuForPath = ( pathname:string ): MenuConfig => {
  return pathname.startsWith('/admin') ? adminMenuConfig : userMenuConfig;
};

export function MenuSide({ conf }: { conf?: MenuConfig }): ReactElement {
  const location = useLocation();
  const { user, logout } = useAuth();
//   const user: UserChipItem = getUserData();
  const menuItems = conf ?? getMenuForPath(location.pathname);
  const [now, setNow] = useState(() => new Date());
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  const toggleExpand = () => setIsExpanded(prev => !prev);
  const expandStatus = isExpanded ? 'expanded' : 'collapsed';

  const { connect, isConnectedRoom, isLoading } = useLiveKit("Office");
  const navigate = useNavigate();
  const handleJoinOffice = async ( href:string ) => {
    await connect("room");
    navigate(href);
  }

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const timeLabel = new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

   const userChipData = user ? {
    name: user.userName,
    role: user.roleName,
    photo: user.avatarUrl || '/default-avatar.png'
  } : {
    name: 'Guest',
    role: 'Unknown',
    photo: '/default-avatar.png'
  };

  const linkClass = ({ isActive } : { isActive:boolean }) => `
    flex items-center h-10 pl-7.5 transition-none group
    ${isActive ? 'bg-accent-lime/10 text-accent-lime' : 'text-white/50 hover:bg-white/5 hover:text-white'}
  `;
  const linkContent = ( item:MenuItem ) => (
    <>
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      {item.icon}
    </span>
    {isExpanded && <span className="ml-3 text-base font-medium whitespace-nowrap">{item.title}</span>}
    </>
  );

  return (
    <aside className={`flex flex-col h-screen sticky top-0 border-r border-white/10 bg-black py-6 transition-none z-50 ${isExpanded ? 'w-[220px]' : 'w-[60px]'}`}>
      
    {/* Header */}
	  <div 
		className="relative flex flex-col pl-7 mb-4" 
		onMouseEnter={() => setIsHovering(true)}
		onMouseLeave={() => setIsHovering(false)}
	  >
  {/* Master Row: justify-between keeps button right, but logo container is static */}
  <div className="flex items-center justify-between h-10 w-full pr-4">
    
    {/* LOGO CONTAINER: This is the anchor. No margins, no width, just a start point. */}
    <div className="flex items-center justify-start" onClick={toggleExpand}>
      {isExpanded ? (
        <span className="brand-logo-lean text-2xl font-bold leading-none whitespace-nowrap cursor-default">
          WorkFrom,
        </span>
      ) : (
        <div className="cursor-pointer flex items-center justify-start h-8">
          {isHovering ? (
            /* Using a span wrapper for the icon to match the text anchor */
            <span className="flex items-center justify-center text-white">
				<span style={{ transform: 'rotate(0deg)', display: 'inline-flex' }}>
					<IconCollapse className="h-7 w-7" />
				</span>
               {/* <IconCollapse className="h-7 w-7 text-accent-lime rotate-180" /> */}
            </span>
          ) : (
            <span className="brand-logo-lean text-2xl font-bold leading-none text-accent-lime">
              WF
            </span>
          )}
        </div>
      )}
    </div>

    {/* COLLAPSE BUTTON: Only shows when expanded */}
    {isExpanded && (
      <button
        onClick={toggleExpand}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-none"
      >
		<span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
			<IconCollapse className="h-7 w-7" />
		</span>
        {/* <IconCollapse className="h-7 w-7 rotate-0" /> */}
      </button>
    )}
  </div>

        {/* Location and Time */}
        <div className="h-6 flex items-center mt-1">
          <div className={`flex items-center gap-2 transition-none ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Location</p>
            <span className="text-[10px] text-white/20">|</span>
            <p className="font-mono text-[10px] text-white/60">{timeLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-x-hidden">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.title === 'Office' ? (
                <button
                  onClick={() => handleJoinOffice(item.href)}
                  className={`${linkClass({ isActive:location.pathname === item.href })} w-full 
                              ${isConnectedRoom ? '' : 'cursor-pointer'} `}
                  disabled={isConnectedRoom || isLoading}
                >
                  {linkContent(item)}
                </button>
              ) : (
              <NavLink
                to={item.href}
                className={linkClass}
                // className={({ isActive }) => `
                //   flex items-center h-10 pl-7.5 transition-none group
                //   ${isActive ? 'bg-accent-lime/10 text-accent-lime' : 'text-white/50 hover:bg-white/5 hover:text-white'}
                // `}
              >
                {linkContent(item)}
                {/* <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
                {isExpanded && <span className="ml-3 text-base font-medium whitespace-nowrap">{item.title}</span>} */}
              </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

	  {/* Footer with UserChip and Logout button side by side */}
		<div className="mt-auto pl-4.5 pb-2">
		<div className="flex items-center justify-between h-10">
			{/* UserChip - always at pl-4.5 position */}
			<UserChip {...userChipData} expandStatus={expandStatus} />
			
			{/* Logout button - only shows when expanded, stays right */}
	          {isExpanded && (
            <button
              onClick={logout}
              className="relative mr-4 flex h-8 w-8 items-center justify-center text-white/60 hover:text-red-400 transition-colors group"
            >
              <IconLogout className="h-5 w-5" />
              
              {/* Tooltip - appears on the right with rounded corners */}
              <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Logout
              </span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

//       {/* 4. Footer
//       <div className="mt-auto pl-4.5 pb-2">
//          <div className="flex items-center justify-start h-10">
//            <UserChip {...user} expandStatus={expandStatus} />
//         </div>
//       </div>
//     </aside>
//   ); */}
// }
