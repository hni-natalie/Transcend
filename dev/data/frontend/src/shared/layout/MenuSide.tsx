import React, { ReactElement, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { adminMenuConfig, userMenuConfig } from '@config/menu.config';
import { useAuth } from '@/features/auth';
import { UserChip } from '@features/users';
import { MenuConfig, IconCollapse, IconLogout, LoadingState, useUserLocation, UserBackendStatus  } from '@shared';

const getMenuForPath = (pathname: string): MenuConfig => {
  return pathname.startsWith('/admin') ? adminMenuConfig : userMenuConfig;
};

export function MenuSide({ conf }: { conf?: MenuConfig }): ReactElement {
  const location = useLocation();
  const { user, logout } = useAuth();
  const menuItems = conf ?? getMenuForPath(location.pathname);
  const [now, setNow] = useState(() => new Date());
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const { location: userLocation, isLoading: locationLoading, error: locationError } = useUserLocation();
  
  const toggleExpand = () => setIsExpanded(prev => !prev);
  const expandStatus = isExpanded ? 'expanded' : 'collapsed';

  const utcTimeLabel = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
}).format(now);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);


  const timeLabel = new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  if (!user) {
	return <LoadingState message="" size="medium" />
  }

  const userChipData = {
    name: user.userName,
    email: user.userEmail,
    role: user.roleName,
    photo: user.avatarUrl || '',
    status: user.userStatus as UserBackendStatus,
  };

  const getLocationDisplay = () => {
    if (locationLoading) return 'Detecting location...';
    if (locationError) return 'Location Unavailable';
    return userLocation;
  };

  return (
    <aside className={`flex flex-col h-screen sticky top-0 border-r border-white/10 bg-black py-6 transition-none z-50 ${isExpanded ? 'w-[220px]' : 'w-[60px]'}`}>
      
      {/* Header */}
		<div 
		className="relative flex flex-col pl-7 -mb-1" 
		onMouseEnter={() => setIsHovering(true)}
		onMouseLeave={() => setIsHovering(false)}
		>
		<div className="flex items-center justify-between h-10 w-full pr-4">
			<div className="flex items-center justify-start" onClick={toggleExpand}>
			{isExpanded ? (
				<span className="brand-logo-lean text-2xl font-bold leading-none whitespace-nowrap cursor-default">
				WorkFrom,
				</span>
			) : (
				<div className="cursor-pointer flex items-center justify-start h-8">
				{isHovering ? (
					<span className="flex items-center justify-center text-white">
					<span style={{ transform: 'rotate(0deg)', display: 'inline-flex' }}>
						<IconCollapse className="h-7 w-7" />
					</span>
					</span>
				) : (
					<span className="brand-logo-lean text-2xl font-bold leading-none text-accent-lime">
					WF
					</span>
				)}
				</div>
			)}
			</div>

			{isExpanded && (
			<button
				onClick={toggleExpand}
				className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-none"
			>
				<span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
				<IconCollapse className="h-7 w-7 cursor-pointer" />
				</span>
			</button>
			)}
		</div>

		{/* Location and Time */}
		<div className="h-12">
		<div className={`flex flex-col transition-none ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
			<p className="text-base text-bold text-foreground-2 truncate max-w-[200px]">
			{getLocationDisplay()}
			</p>
			<p className="text-base text-foreground-3">
			local {timeLabel} · utc {utcTimeLabel}
			</p>
		</div>
		</div>
		</div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-x-hidden">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              <NavLink
				to={item.href}
				className={({ isActive }) => `
					flex items-center h-10 pl-7.5 transition-none group
					${isActive ? 'bg-accent-lime/10 text-accent-lime' : 'text-white/50 hover:bg-white/5 hover:text-white'}
				`}
				>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
                {isExpanded && <span className="ml-3 text-base font-medium whitespace-nowrap">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto pl-4.5 pb-2">
        <div className="flex items-center justify-between h-10">
          <UserChip {...userChipData} expandStatus={expandStatus} />
          
          {isExpanded && (
            <button
              onClick={logout}
              className="relative mr-4 flex h-8 w-8 items-center justify-center text-white/60 hover:text-red-400 transition-colors group"
            >
              <IconLogout className="h-5 w-5" />
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
