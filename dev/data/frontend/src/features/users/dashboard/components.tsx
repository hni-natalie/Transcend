import React, { useState } from 'react';
import { FeaturedMember, CalendarDay } from './types';
import { getCalendarTooltip } from './calendar';
import { DefaultAvatar } from '@shared/ui/DefaultAvatar';
import { UserBackendStatus, getStatusColors, getStatusDisplay, UserStatusType } from '@shared';


// AVATAR
export const Avatar = ({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) => {
  const [imageError, setImageError] = useState(false);

  if (!avatarUrl || imageError) {
    return (
      <DefaultAvatar
        name={name}
        className="w-11 h-11 md:w-12 md:h-12 rounded-full"
        bgColor="#EDEDED"
        textColor="#242424"
      />
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover"
      onError={() => setImageError(true)}
    />
  );
};


// FEATURED MEMBER
interface FeaturedMemberRowProps {
  member: FeaturedMember;
}

export const FeaturedMemberRow = ({ member }: FeaturedMemberRowProps) => {
  const status = member.userStatus as UserStatusType;
  const colors = getStatusColors(status);
  const displayStatus = getStatusDisplay(status);

  return (
    <div className="bg-background-4 rounded-2xl p-4 min-h-[150px] md:min-h-[180px] flex flex-col justify-between flex-shrink-0 mt-4 md:mt-7">
      <div className="flex p-1 justify-between items-start">
        <Avatar avatarUrl={member.avatarUrl} name={member.userName} />
        <span className={`text-base font-medium px-2 py-0.5 rounded ${colors.text}`}>
          {displayStatus}
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
interface MemberRowProps {
  member: FeaturedMember;
}

export const MemberRow = ({ member }: MemberRowProps) => {
  const status = member.userStatus as UserStatusType;
  const colors = getStatusColors(status);
  const displayStatus = getStatusDisplay(status);

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
      <span className={`text-sm font-medium flex-shrink-0 self-start mt-1 px-2 md:px-4 ${colors.text}`}>
        {displayStatus}
      </span>
    </div>
  );
};


// CALENDAR GRID
interface CalendarGridProps {
  calendarDays: CalendarDay[];
  monthYear: string;
}

export const CalendarGrid = ({ calendarDays, monthYear }: CalendarGridProps) => {
  const [tooltipVisible, setTooltipVisible] = useState<number | null>(null);

  const handleDayClick = (index: number) => {
    // Toggle tooltip on click for mobile
    setTooltipVisible(tooltipVisible === index ? null : index);
  };

  return (
    <div>
      <h2 className="text-sm md:text-base font-medium text-foreground mb-4 md:mb-6 ml-2 md:ml-4">{monthYear}</h2>

      <div className="grid grid-cols-7 gap-y-1 md:gap-y-2 text-center text-xs md:text-sm font-medium text-foreground-3 mb-2 md:mb-3 p-1 sm:p-1 md:p-2">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
        <span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-x-1 sm:gap-x-2 md:gap-x-2.5 gap-y-2 sm:gap-y-3 md:gap-y-4 text-center mt-1 md:mt-2 cursor-default p-2 sm:p-2 md:p-3">
        {calendarDays.map((d, index) => {
          let cellClass =
            'rounded-full flex items-center justify-center w-full h-full transition-all text-[11px] sm:text-xs md:text-sm ';

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
          const showTooltip = tooltipVisible === index && tooltipText;

          return (
            <div
              key={index}
              className="relative group aspect-square w-full max-w-10 sm:max-w-12 md:max-w-14 mx-auto flex items-center justify-center"
              onClick={() => handleDayClick(index)}
            >
              {d.day > 0 ? (
                <>
                  <span className={cellClass}>{d.day}</span>
                  {tooltipText && (
                    <>
                      {/* Desktop hover tooltip */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-accent-lime-bg text-foreground text-xs md:text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 hidden md:block transition-opacity pointer-events-none z-10 shadow-lg">
                        {tooltipText}
                      </div>
                      {/* Mobile click tooltip */}
                      {showTooltip && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-accent-lime-bg text-foreground text-xs rounded whitespace-nowrap z-10 shadow-lg md:hidden">
                          {tooltipText}
                        </div>
                      )}
                    </>
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
};


// STATUS DROPDOWN
interface StatusDropdownProps {
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

  return (
    <div className="absolute top-full left-0 mt-2 w-36 md:w-36 bg-background-2 rounded-lg shadow-lg border border-border z-50 overflow-hidden">
      {[
        { status: 'online' as const, dot: 'bg-accent-lime', label: 'Available' },
        { status: 'focus' as const, dot: 'bg-accent-teal', label: 'Focus' },
        { status: 'in_meeting' as const, dot: 'bg-accent-gold', label: 'In Meeting' },
        { status: 'away' as const, dot: 'bg-accent-ultramarine', label: 'Away' },
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