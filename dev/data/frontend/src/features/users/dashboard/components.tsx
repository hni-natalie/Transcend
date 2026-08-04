import React, { useState, useEffect } from 'react';
import { FeaturedMember, CalendarDay } from './types';
import { getCalendarTooltip } from './calendar';
import { DefaultAvatar } from '@shared/ui/DefaultAvatar';
import { UserBackendStatus, getStatusColors, getStatusDisplay, UserStatusType } from '@shared';


// AVATAR
interface AvatarProps {
  avatarUrl: string | null;
  name: string;
  size?: string;
}

export const Avatar = ({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) => {
  const [imageError, setImageError] = useState(false);

  if (!avatarUrl || imageError) {
    return (
      <DefaultAvatar
        name={name}
        className="w-12 h-12 rounded-full"
        bgColor="#EDEDED"
        textColor="#242424"
      />
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      className="w-12 h-12 rounded-full object-cover"
      onError={() => setImageError(true)}
    />
  );
};


// FEATURED MEMBER
export interface FeaturedMemberRowProps {
  member: FeaturedMember;
}

export const FeaturedMemberRow = ({ member }: FeaturedMemberRowProps) => {
  const status = member.userStatus as UserStatusType;
  const colors = getStatusColors(status);
  const displayName = getStatusDisplay(status);

  return (
    <div className="bg-background-4 rounded-2xl p-4 min-h-[180px] flex flex-col justify-between flex-shrink-0 mt-7">
      <div className="flex p-1 justify-between items-start">
        <Avatar avatarUrl={member.avatarUrl} name={member.userName} />
        <span className={`text-base font-medium px-2 py-0.5 rounded ${colors.text}`}>
          {displayName}
        </span>
      </div>
      <div className="p-1 mt-2">
        <h3 className="text-base font-medium text-foreground">{member.userName}</h3>
        <p className="text-sm text-foreground-2 mt-1">{member.role?.roleName || 'Team Member'}</p>
        <p className="text-sm text-foreground-3">
          {member.country} · {member.timezone}
        </p>
      </div>
    </div>
  );
};


// MEMBERS
export interface MemberRowProps {
  member: FeaturedMember;
}

export const MemberRow = ({ member }: MemberRowProps) => {
  const status = member.userStatus as UserStatusType;
  const colors = getStatusColors(status);
  const displayName = getStatusDisplay(status);

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background-2/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar avatarUrl={member.avatarUrl} name={member.userName} />
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-medium text-foreground group-hover:text-accent-lime transition-colors truncate">
            {member.userName}
            {member.isCurrentUser && (
              <span className="text-accent-lime text-sm ml-2">(You)</span>
            )}
          </h4>
          <p className="text-sm text-foreground-3 truncate">{member.role?.roleName || 'Team Member'}</p>
          <p className="text-sm text-foreground-3 mt-0.5">
            {member.country} · {member.timezone}
          </p>
        </div>
      </div>
      <span className={`text-sm font-medium flex-shrink-0 self-start mt-1 px-4 ${colors.text}`}>
        {displayName}
      </span>
    </div>
  );
};


// CALENDAR GRID
export interface CalendarGridProps {
  calendarDays: CalendarDay[];
  monthYear: string;
}

export const CalendarGrid = ({ calendarDays, monthYear }: CalendarGridProps) => (
  <div>
    <h2 className="text-base font-medium text-foreground mb-6 ml-4">{monthYear}</h2>

    <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-medium text-foreground-3 mb-3">
      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
      <span>Thu</span><span>Fri</span><span>Sat</span>
    </div>

    <div className="grid grid-cols-7 p-3 gap-x-2.5 gap-y-7.5 text-center text-base mt-2 cursor-default">
      {calendarDays.map((d, index) => {
        let cellClass =
          'rounded-full flex items-center justify-center mx-auto transition-all w-full aspect-square ';

        if (d.type === 'prev-month' || d.type === 'next-month') {
          cellClass += 'bg-[#1A1B19]/40 text-foreground-4/20';
        } else if (d.type === 'current-highlight') {
          cellClass += 'bg-accent-lime text-black font-semibold shadow-sm';
        } else if (d.type === 'event-amber') {
          cellClass += 'bg-accent-lime/15 text-accent-lime font-medium hover:bg-accent-lime/30';
        } else {
          cellClass += 'bg-[#232422] text-foreground-3 hover:bg-[#2D2E2B]';
        }

        const tooltipText = getCalendarTooltip(d);

        return (
          <div key={index} className="h-8 flex items-center justify-center relative group">
            {d.day > 0 ? (
              <>
                <span className={cellClass}>{d.day}</span>
                {tooltipText && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-accent-lime-bg text-foreground text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                    {tooltipText}
                  </div>
                )}
              </>
            ) : (
              <span className={cellClass}></span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);


// STATUS
export interface StatusDropdownProps {
  show: boolean;
  updatingStatus: boolean;
  onSelect: (status: UserBackendStatus) => void;
}

export const StatusDropdown = ({ 
  show, 
  updatingStatus, 
  onSelect 
}: StatusDropdownProps) => {
  if (!show) return null;

  // manual status options instead of fetching from be (exclude offline)
  return (
    <div className="absolute top-full left-0 mt-2 w-36 bg-background-2 rounded-lg shadow-lg border border-border z-50 overflow-hidden">
      {[
        { status: 'online' as const, dot: 'bg-accent-lime', label: 'Available' },
        { status: 'focus' as const, dot: 'bg-accent-teal', label: 'Focus' },
        { status: 'in_meeting' as const, dot: 'bg-accent-gold', label: 'In Meeting' },
        { status: 'away' as const, dot: 'bg-accent-purple', label: 'Away' },
      ].map(({ status, dot, label }) => (
        <button
          key={status}
          onClick={() => onSelect(status)}
          disabled={updatingStatus}
          className="w-full px-4 py-2 text-left text-sm hover:bg-background-3 transition-colors flex items-center gap-2"
        >
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          {label}
        </button>
      ))}
    </div>
  );
};
