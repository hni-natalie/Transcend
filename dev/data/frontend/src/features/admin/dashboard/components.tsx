import React, { useState } from 'react';
import { IconLogin, IconLogout, IconTaskAdd, IconTaskDone, IconMeetings, IconMeetingAdd, TruncatedText, getStatusPriority, getStatusColors } from '@/shared';
import { DbUser, ActivityItem, SpaceRatio, SpaceWithOccupancy } from './types';


// empty state
// export const EmptyState = () => {
//   return (
//     <div className="flex items-center justify-center min-h-[400px]">
//       <div className="text-foreground-3 text-base">
//         No user data available
//       </div>
//     </div>
//   );
// };


// METRICS RING
export interface MetricsRingProps {
  availableCount: number;
  focusCount: number;
  inMeetingCount: number;
  totalCount: number;
  activePercentage: string;      // was attendancePercentage
  attendancePercentage: string;  // was checkedInPercentage
  absentPercentage: string;
}

const MetricItem = ({ 
  value, 
  label, 
  color 
}: { 
  value: string | number; 
  label: string; 
  color?: string 
}) => (
  <div>
    <div className="text-3xl font-semibold font-main text-foreground">{value}</div>
    <div className="flex items-center justify-center gap-2 mt-2">
      {color && <span className={`w-2 h-2 rounded-full ${color}`}></span>}
      <span className="text-sm text-foreground-3">{label}</span>
    </div>
  </div>
);

export const MetricsRing = ({
  availableCount,
  focusCount,
  inMeetingCount,
  totalCount,
  activePercentage,
  attendancePercentage,
  absentPercentage,
}: MetricsRingProps) => {
  const ringCircumference = 263.8;

  return (
    <>
      <div className="flex justify-center mb-8 mt-0">
        <div className="relative w-115 h-115">
          {/* Outer Ring - available */}
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#2E2E2E" strokeWidth="9" fill="transparent" />
            <circle 
              cx="50" cy="50" r="42" 
              stroke="#D0F05C" 
              strokeWidth="9" 
              fill="transparent"
              strokeDasharray={ringCircumference} 
              strokeDashoffset={ringCircumference - (ringCircumference * (availableCount / totalCount))}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Middle Ring - focus */}
          <svg className="absolute w-full h-full -rotate-90 scale-[0.74]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#2E2E2E" strokeWidth="12" fill="transparent" />
            <circle 
              cx="50" cy="50" r="42" 
              stroke="#68D1BF" 
              strokeWidth="12" 
              fill="transparent"
              strokeDasharray={ringCircumference} 
              strokeDashoffset={ringCircumference - (ringCircumference * (focusCount / totalCount))}
              strokeLinecap="round"
            />
          </svg>

          {/* Inner Ring - in meeting */}
          <svg className="absolute w-full h-full -rotate-90 scale-[0.49]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#2E2E2E" strokeWidth="16" fill="transparent" />
            <circle 
              cx="50" cy="50" r="42" 
              stroke="#EECA5C" 
              strokeWidth="16" 
              fill="transparent"
              strokeDasharray={ringCircumference} 
              strokeDashoffset={ringCircumference - (ringCircumference * (inMeetingCount / totalCount))}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono text-foreground">{attendancePercentage}%</span>
            <span className="text-sm text-foreground-2 tracking-wider">attendance</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-center mb-8">
        <MetricItem value={availableCount} label="Available" color="bg-accent-lime" />
        <MetricItem value={focusCount} label="Focus" color="bg-accent-teal" />
        <MetricItem value={inMeetingCount} label="In meeting" color="bg-accent-gold" />
      </div>

      <div className="flex justify-between text-center mb-4">
        <MetricItem value={activePercentage + '%'} label="Active" />
        <MetricItem value={attendancePercentage + '%'} label="Attendance" />
        <MetricItem value={absentPercentage + '%'} label="Absent" />
      </div>
    </>
  );
};


// STATUS AVATAR
interface StatusAvatarProps {
  user: DbUser;
  onHover: (user: DbUser | null) => void;
}

const StatusAvatar = ({ user, onHover }: StatusAvatarProps) => {
  const colors = getStatusColors(user.status);
  const borderClass = colors.border;
  const bgClass = colors.bg;
  
  const textClass = user.status !== 'offline' ? 'text-foreground-2' : 'text-foreground-3';
  
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(user.name);

  return (
    <div 
      className="relative group cursor-pointer w-full max-w-[48px] mx-auto aspect-square"
      onMouseEnter={() => onHover(user)}
      onMouseLeave={() => onHover(null)}
    >
      {user.avatarUrl ? (
        <img 
          src={user.avatarUrl} 
          alt={user.name}
          className={`w-full h-full rounded-full object-cover border-2 ${borderClass}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallbackDiv = parent.querySelector('.fallback-initials');
              if (fallbackDiv) fallbackDiv.classList.remove('hidden');
            }
          }}
        />
      ) : null}
      
      <div className={`fallback-initials w-full h-full rounded-full flex items-center justify-center border-2 ${borderClass} ${bgClass} ${user.avatarUrl ? 'hidden' : ''}`}>
        <span className={`text-[8px] font-semibold ${textClass}`}>
          {initials}
        </span>
      </div>
    </div>
  );
};


// STATUS GRID
export interface StatusGridProps {
  users: DbUser[];
  isExcludedUser: (user: DbUser) => boolean;
}

export const StatusGrid = ({ users, isExcludedUser }: StatusGridProps) => {
  const [hoveredUser, setHoveredUser] = useState<DbUser | null>(null);

  const sortedUsers = [...users]
    .filter(user => !isExcludedUser(user))
    .sort((a, b) => {
      const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (statusDiff === 0) {
        return a.name.localeCompare(b.name);
      }
      return statusDiff;
    })
    .slice(0, 30);

  return (
    <div className="relative">
      <div className="h-8 mb-2 flex items-center justify-center">
        {hoveredUser && (
          <div className="px-3 py-1 bg-background-3 text-foreground text-sm rounded whitespace-nowrap transition-opacity duration-200 shadow-lg border border-background-4">
            {hoveredUser.name} • {hoveredUser.department}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-8 gap-2 justify-items-center">
        {sortedUsers.map((user) => (
          <StatusAvatar key={user.id} user={user} onHover={setHoveredUser} />
        ))}
        
        {users.length < 30 && Array.from({ length: 30 - users.length }).map((_, idx) => (
          <div 
            key={`empty-${idx}`} 
            className="w-full max-w-[48px] mx-auto aspect-square rounded-full bg-background-3 border border-foreground-4/20"
          />
        ))}
      </div>
    </div>
  );
};


// DEPARTMENT STATS
export interface DepartmentStatsProps {
  getDepartmentRatio: (deptName: string) => { active: number; total: number };
}

const DEPARTMENTS = [
  { label: 'Human Resources', code: 'Human Resources' },
  { label: 'Accounts', code: 'Accounts' },
  { label: 'Marketing', code: 'Marketing' },
  { label: 'Operations', code: 'Operations' },
  { label: 'Engineering', code: 'Engineering' },
  { label: 'Design', code: 'Design' }
];

export const DepartmentStats = ({ getDepartmentRatio }: DepartmentStatsProps) => {
  return (
    <div className="grid grid-cols-6 gap-3 items-stretch">
      {DEPARTMENTS.map((dept) => {
        const ratio = getDepartmentRatio(dept.code);
        const isTwoLineDept = dept.label === 'Human Resources';
        
        return (
          <div 
            key={dept.label} 
            className="bg-background-2 rounded-3xl p-6 flex flex-col justify-between h-full"
          >
            <div className="text-md font-bold text-foreground">
              {isTwoLineDept ? (
                <div className="flex flex-col leading-tight">
                  <span>Human</span>
                  <span>Resources</span>
                </div>
              ) : (
                <span className="block whitespace-nowrap">{dept.label}</span>
              )}
            </div>
            
            <div className="mt-6">
              <span className="text-2xl font-semibold font-main text-foreground">{ratio.active}</span>
              <span className="text-2xl font-normal text-foreground-4 mx-1">/</span>
              <span className="text-2xl font-normal text-foreground-4">{ratio.total}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};


// mock components to replace with socket events
interface OfficeRoom {
  code: string;
  spaceName: string;
  colSpanClass: string;
  rowSpanClass: string;
}

const OFFICE_ROOMS: OfficeRoom[] = [
  { code: 'AV',  spaceName: 'Audit Vault',     	 colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1' },
  { code: 'MS',  spaceName: 'Meeting Room S',    colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1' },
  { code: 'GL',  spaceName: 'Growth Lab',        colSpanClass: 'col-span-1', rowSpanClass: 'row-span-2' },
  { code: 'TH',  spaceName: 'Town Hall',         colSpanClass: 'col-span-5', rowSpanClass: 'row-span-2' },
  { code: 'LOH', spaceName: 'Logistics Ops Hub', colSpanClass: 'col-span-2', rowSpanClass: 'row-span-1' },
  { code: 'POH', spaceName: 'People Ops Hub',    colSpanClass: 'col-span-1', rowSpanClass: 'row-span-2' },
  { code: 'ML',  spaceName: 'Meeting Room L',    colSpanClass: 'col-span-2', rowSpanClass: 'row-span-2' },
  { code: 'CL',  spaceName: 'Creative Lab',      colSpanClass: 'col-span-2', rowSpanClass: 'row-span-1' },
  { code: 'DL',  spaceName: 'Dev Lab',           colSpanClass: 'col-span-3', rowSpanClass: 'row-span-2' },
  { code: 'MM',  spaceName: 'Meeting Room M',    colSpanClass: 'col-span-2', rowSpanClass: 'row-span-1' },
];

const getOccupancyStyle = (space: SpaceWithOccupancy | undefined) => {
  const count = space?.currentOccupancy ?? 0;

  if (!space || count === 0) {
    return { bgClass: 'bg-background-1', textClass: 'text-foreground-1' };
  }

  const capacity = Number(space.userCapacity);
  const atCapacity = !isNaN(capacity) && capacity > 0 && count >= capacity;
  return atCapacity
    ? { bgClass: 'bg-accent-lime', textClass: 'text-black' }
    : { bgClass: 'bg-accent-lime-bg', textClass: 'text-foreground-1' };
};

export const OfficeMap = ({ spaces }: { spaces: SpaceWithOccupancy[] }) => {
  const spacesByName = new Map(spaces.map(s => [s.spaceName, s]));

  return (
    <div className="col-span-8 bg-background-2 rounded-3xl p-6 flex flex-col">
      <div className="text-mc text-foreground font-semibold font-main mb-6">Office</div>
      <div className="my-3 flex-1 grid grid-cols-8 grid-rows-4 gap-1.5">
        {OFFICE_ROOMS.map((room) => {
          const space = spacesByName.get(room.spaceName);
          const style = getOccupancyStyle(space);

          return (
            <div
              key={room.code}
              className={`${room.colSpanClass} ${room.rowSpanClass} ${style.bgClass} rounded-lg p-3 flex items-start justify-start transition-colors duration-300`}
            >
              <span className={`text-sm font-bold ${style.textClass}`}>
                {room.code}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// interface OfficeRoom {
//   name: string;
//   colSpanClass: string;
//   rowSpanClass: string;
//   bgClass: string;
//   textClass?: string;
// }

// const OFFICE_ROOMS: OfficeRoom[] = [
//   { name: 'AV', colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', bgClass: 'bg-accent-lime-bg' },
//   { name: 'MS', colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', bgClass: 'bg-accent-lime-bg' },
//   { name: 'GL', colSpanClass: 'col-span-1', rowSpanClass: 'row-span-2', bgClass: 'bg-accent-lime-bg' },
//   { name: 'TH', colSpanClass: 'col-span-5', rowSpanClass: 'row-span-2', bgClass: 'bg-background-1' },
//   { name: 'LOH', colSpanClass: 'col-span-2', rowSpanClass: 'row-span-1', bgClass: 'bg-accent-lime-bg' },
//   { name: 'POH', colSpanClass: 'col-span-1', rowSpanClass: 'row-span-2', bgClass: 'bg-accent-lime', textClass: 'text-black' },
//   { name: 'ML', colSpanClass: 'col-span-2', rowSpanClass: 'row-span-2', bgClass: 'bg-background-1' },
//   { name: 'CL', colSpanClass: 'col-span-2', rowSpanClass: 'row-span-1', bgClass: 'bg-accent-lime-bg' },
//   { name: 'DL', colSpanClass: 'col-span-3', rowSpanClass: 'row-span-2', bgClass: 'bg-accent-lime', textClass: 'text-black' },
//   { name: 'MM', colSpanClass: 'col-span-2', rowSpanClass: 'row-span-1', bgClass: 'bg-background-1' },
// ];

// export const OfficeMap = () => {
//   return (
//     <div className="col-span-8 bg-background-2 rounded-3xl p-6 flex flex-col">
//       <div className="text-mc text-foreground font-semibold font-main mb-6">Office</div>
//       <div className="my-3 flex-1 grid grid-cols-8 grid-rows-4 gap-1.5">
//         {OFFICE_ROOMS.map((room) => (
//           <div
//             key={room.name}
//             className={`${room.colSpanClass} ${room.rowSpanClass} ${room.bgClass} rounded-lg p-3 flex items-start justify-start`}
//           >
//             <span className={`text-sm font-bold ${room.textClass || 'text-foreground-1'}`}>
//               {room.name}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// SPACES
const SpaceRatioBar = ({ space }: { space: SpaceRatio }) => {
  const percent = space.max > 0 ? (space.count / space.max) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <span className="text-foreground-2 text-base w-36 shrink-0">{space.name}</span>
      <span className="text-foreground-3 text-sm w-10 shrink-0 text-right">{space.count}/{space.max}</span>
      <div className="flex-1 h-2.5 bg-background-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-lime rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const toSpaceRatio = (s: SpaceWithOccupancy): SpaceRatio => ({
  name: s.spaceName,
  count: s.currentOccupancy,
  max: Number(s.userCapacity) || 0,
  group: s.accessLevel === 'department' ? 'department' : 'shared',
});

export const SpacesProgress = ({ spaces }: { spaces: SpaceWithOccupancy[] }) => {
  const sharedSpaces = spaces.filter(s => s.accessLevel !== 'department').map(toSpaceRatio);
  const departmentSpaces = spaces.filter(s => s.accessLevel === 'department').map(toSpaceRatio);

  return (
    <div className="col-span-8 bg-background-2 rounded-3xl p-6 pb-8 flex flex-col">
      <div className="text-md text-foreground font-semibold font-main mb-6">Spaces</div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          {sharedSpaces.map((space) => (
            <SpaceRatioBar key={space.name} space={space} />
          ))}
        </div>
        <div className="space-y-2 pt-5">
          {departmentSpaces.map((space) => (
            <SpaceRatioBar key={space.name} space={space} />
          ))}
        </div>
      </div>
    </div>
  );
};


// SPACES (mock)
// const SpaceRatioBar = ({ space }: { space: SpaceRatio }) => {
//   const percent = space.max > 0 ? (space.count / space.max) * 100 : 0;
  
//   return (
//     <div className="flex items-center gap-4">
//       <span className="text-foreground-2 text-base w-36 shrink-0">{space.name}</span>
//       <span className="text-foreground-3 text-sm w-10 shrink-0 text-right">{space.count}/{space.max}</span>
//       <div className="flex-1 h-2.5 bg-background-3 rounded-full overflow-hidden">
//         <div
//           className="h-full bg-accent-lime rounded-full transition-all"
//           style={{ width: `${percent}%` }}
//         />
//       </div>
//     </div>
//   );
// };

// // export const SpacesProgress = ({ spaces }: { spaces: SpaceWithOccupancy[] }) => {
// export const SpacesProgress = () => {
//   const sharedSpaces = mockSpacesProgress.filter(space => space.group === 'shared');
//   const departmentSpaces = mockSpacesProgress.filter(space => space.group === 'department');

//   return (
//     <div className="col-span-8 bg-background-2 rounded-3xl p-6 pb-8 flex flex-col">
//       <div className="text-md text-foreground font-semibold font-main mb-6">Spaces</div>
//       <div className="flex-1 flex flex-col gap-4">
//         <div className="space-y-2">
//           {sharedSpaces.map((space) => (
//             <SpaceRatioBar key={space.name} space={space} />
//           ))}
//         </div>
//         <div className="space-y-2 pt-5">
//           {departmentSpaces.map((space) => (
//             <SpaceRatioBar key={space.name} space={space} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };


// ACTIVITY
interface ActivityItemRowProps {
  item: ActivityItem;
  iconColor: string;
  iconBg: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
}

const ActivityItemRow = ({
  item,
  iconColor,
  iconBg,
  IconComponent,
  iconClassName = '',
}: ActivityItemRowProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          <IconComponent className={iconClassName || `w-5 h-5 ${iconColor === 'bg-accent-lime' ? 'text-background-2 -translate-x-0.5' : 'text-background-2'}`} />
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold font-main text-foreground truncate">{item.name}</div>
          <div className="text-[11px] text-foreground-2 mt-0.5 font-main">
            <TruncatedText 
              text={`${item.action} · ${item.context}`}
              className="text-[11px] text-foreground-2"
            />
          </div>
        </div>
      </div>
      <div className="text-[11px] font-semibold text-foreground font-main ml-4 shrink-0">
        {item.time}
      </div>
    </div>
  );
};


// PRESENCE STREAM
export const PresenceStream = ({ items }: { items: ActivityItem[] }) => {
  return (
    <div className="bg-background-2 rounded-3xl pt-6 px-6 pb-10">
      <div className="text-md font-semibold font-main tracking-wider text-foreground mb-8">Presence</div>
      <div className="space-y-6">
        {items.map((item) => {
          const isLogin = item.action.toLowerCase().includes('logged in') || 
                         item.action.toLowerCase().includes('signed in');
          return (
            <ActivityItemRow
              key={item.id}
              item={item}
              iconColor="bg-accent-lime"
              iconBg={isLogin ? 'bg-accent-lime' : 'bg-accent-lime-bg'}
              IconComponent={isLogin ? IconLogin : IconLogout}
              iconClassName={isLogin ? 'w-5 h-5 text-background-2 -translate-x-0.5' : 'w-5 h-5 text-accent-lime translate-x-0.5'}
            />
          );
        })}
      </div>
    </div>
  );
};


// TASKS STREAM
export const TasksStream = ({ items }: { items: ActivityItem[] }) => {
  return (
    <div className="bg-background-2 rounded-3xl p-6">
      <div className="text-md font-semibold font-main tracking-wider text-foreground mb-8">Tasks</div>
      <div className="space-y-6">
        {items.map((item) => {
          const isDone = item.action.toLowerCase().includes('completed') || 
                        item.action.toLowerCase().includes('done');
          return (
            <ActivityItemRow
              key={item.id}
              item={item}
              iconColor="bg-accent-teal"
              iconBg={isDone ? 'bg-accent-teal' : 'bg-accent-teal-bg'}
              IconComponent={isDone ? IconTaskDone : IconTaskAdd}
              iconClassName={isDone ? 'w-6 h-6 text-background-2 translate-x-0.5 translate-y-0.5' : 'w-6 h-6 text-accent-teal translate-x-0.5 translate-y-0.5'}
            />
          );
        })}
      </div>
    </div>
  );
};


// MEETINGS STREAM
export const MeetingsStream = ({ items }: { items: ActivityItem[] }) => {
  return (
    <div className="bg-background-2 rounded-3xl p-6">
      <div className="text-md font-semibold font-main tracking-wider text-foreground mb-10">Meetings</div>
      <div className="space-y-6">
        {items.map((item) => {
          const isScheduled = item.action.toLowerCase().includes('scheduled');
          return (
            <ActivityItemRow
              key={item.id}
              item={item}
              iconColor="bg-accent-gold"
              iconBg={isScheduled ? 'bg-accent-gold-bg' : 'bg-accent-gold'}
              IconComponent={isScheduled ? IconMeetingAdd : IconMeetings}
              iconClassName={isScheduled ? 'w-6 h-6 text-accent-gold' : 'w-6 h-6 text-background-2'}
            />
          );
        })}
      </div>
    </div>
  );
};


// ACTIVITY STREAM
export const ActivityStreams = ({ presenceItems, tasksItems, meetingsItems, }: {
  presenceItems: ActivityItem[];
  tasksItems: ActivityItem[];
  meetingsItems: ActivityItem[];
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <PresenceStream items={presenceItems} />
      <TasksStream items={tasksItems} />
      <MeetingsStream items={meetingsItems} />
    </div>
  );
};