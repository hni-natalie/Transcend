import React, { useState, useEffect } from 'react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { ButtonVoiceRoom } from '@/features/livekit/components/ButtonVoiceRoom';
import { IconMeetings, IconTasks, LoadingState } from '@shared';
import { FeaturedMember, TeamMember } from './types';
import { FeaturedMemberRow, MemberRow, CalendarGrid, StatusDropdown } from './components';
import { useDashboard, useSessionTimer, useStatusUpdate } from './hooks';
import { getCalendarDays } from './calendar';
import {
  getMeetingProgressOffset,
  getMeetingCountdownDisplay,
  getNextMeeting,
  getMeetingsToday,
  getMeetingsThisWeek,
  getMeetingsThisMonth,
  getTasksToday,
  getTasksThisWeek,
  getTasksThisMonth,
  getStatusDisplayWithColors,
  sortTasksByUrgency,
} from './metrics';

const featureMember = (m: TeamMember, currentUserId: string): FeaturedMember => ({
  userName: m.userName,
  userEmail: m.userEmail,
  role: m.role ? { roleName: m.role.roleName } : undefined,
  userStatus: m.userStatus,
  country: m.country ?? 'Country',
  timezone: m.timezone ?? 'Timezone',
  avatarUrl: m.avatarUrl ?? null,
  isCurrentUser: m.userId === currentUserId,
});

export const Dashboard = () => {
  const { data, setData, isLoading, error } = useDashboard();
  const { showStatusDropdown, setShowStatusDropdown, updatingStatus, dropdownRef, updateStatus } = useStatusUpdate(setData);
  const { sessionTime } = useSessionTimer(data?.currentUser?.lastLoginAt);

  const formatSessionTimeShort = () => {
    const { hours, minutes } = sessionTime;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getLoginTimeDisplay = () => {
    if (!data?.currentUser?.lastLoginAt) return 'just now';
    const loginTime = new Date(data.currentUser.lastLoginAt);
    return loginTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getLoginDateDisplay = () => {
    if (!data?.currentUser?.lastLoginAt) return '';
    const loginTime = new Date(data.currentUser.lastLoginAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (loginTime.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    if (loginTime.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return loginTime.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return <LoadingState message="Synchronizing cluster aggregates..." size="full" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-danger text-sm">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground-3 text-sm">No user data available</div>
      </div>
    );
  }

  const { currentUser, allUsers, tasks, meetings } = data;
  const now = new Date();
  const statusDisplay = getStatusDisplayWithColors(currentUser.userStatus);

  const allTeamMembers = allUsers.filter(
    u => u.department?.dpId === currentUser.department?.dpId
  );

  const manager = allTeamMembers.find(
    u => u.role?.roleName === 'Manager'
  );

  const featuredMember = manager
    ? featureMember(manager, currentUser.userId)
    : null;

  const regularMembers: FeaturedMember[] = allTeamMembers
    .filter(u => !manager || u.userId !== manager.userId)
    .sort((a, b) => a.userName.localeCompare(b.userName))
    .map(u => featureMember(u, currentUser.userId));

  // metrics
  const teamMembers = allUsers.filter(
    u => u.department?.dpId === currentUser.department?.dpId && u.userId !== currentUser.userId
  );
  const totalTeamMembers = teamMembers.length + 1;
  const totalActive =
    teamMembers.filter(m => m.userStatus !== 'offline').length +
    (currentUser.userStatus !== 'offline' ? 1 : 0);

  const tasksCompleted = tasks.filter(t => t.taskStatus === 'done').length;
  const tasksTotal = tasks.length;

  const nextMeeting = getNextMeeting(meetings);
  const upcomingMeetings = meetings
    .filter(m => new Date(m.meetStart) > new Date())
    .sort((a, b) => new Date(a.meetStart).getTime() - new Date(b.meetStart).getTime());

  // calendar
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const calendarDays = getCalendarDays(meetings, tasks, currentDate);

  const sortedTasks = sortTasksByUrgency(tasks, now);

  return (
    <div className="">

      {/* TOP METRICS HORIZON GRID (4 Cards) */}
      <div className="grid grid-cols-4 gap-4 mt-4 mb-4">

        {/* Card 1: Status with Dropdown */}
        <div className="flex items-start gap-5 ml-7">
          <div className="relative w-35 h-35 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
              <circle
                cx="21" cy="21" r="18.5"
                className={
                  currentUser.userStatus === 'online'      ? 'text-accent-lime' :
                  currentUser.userStatus === 'focus'        ? 'text-accent-teal' :
                  currentUser.userStatus === 'in_meeting'  ? 'text-accent-gold' :
				  currentUser.userStatus === 'away'  		? 'text-accent-ultramarine' : 'text-foreground-4'
                }
                strokeWidth="5" stroke="currentColor" fill="none"
                strokeDasharray="116.2" strokeDashoffset="0" strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-semibold text-foreground">
                {formatSessionTimeShort()}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-0.5">
            <span className="text-sm text-foreground-4 uppercase tracking-wider font-semibold">Status</span>
            <div className="relative" ref={dropdownRef}>
              <div
                className="relative group/tooltip flex items-center gap-1.5 cursor-pointer w-fit"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <span className={`text-2xl font-semibold mt-1 ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
                <svg
                  className={`w-5 h-5 text-foreground-3 mt-0.5 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 hidden group-hover/tooltip:block bg-background-3 text-foreground text-[10px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                  Change status
                </div>
              </div>
              <StatusDropdown
                show={showStatusDropdown}
                updatingStatus={updatingStatus}
                onSelect={updateStatus}
              />
            </div>
			<p className="text-base text-foreground-3 mt-7">
			Logged in
			</p>
			<p className="text-base text-foreground-3">
			{getLoginDateDisplay()} at {getLoginTimeDisplay()}
			</p>
			</div>
        </div>

        {/* Card 2: Upcoming Meeting */}
        <div className="flex items-start gap-5 ml-1">
          <div className="relative w-35 h-35 flex-shrink-0 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="18.5" className="text-background-3" strokeWidth="5" stroke="currentColor" fill="none" />
              <circle
                cx="21" cy="21" r="18.5"
                className="text-accent-gold"
                strokeDasharray="116.2"
                strokeDashoffset={getMeetingProgressOffset(nextMeeting)}
                strokeWidth="5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
              />
            </svg>
            <span className="text-base font-main font-thin text-foreground">
              {getMeetingCountdownDisplay(nextMeeting)}
            </span>
          </div>

		  <div className="flex-1 space-y-0.5">
			<span className="text-sm text-foreground-4 uppercase tracking-wider font-semibold">Upcoming</span>

			{/* Meeting title/content - now in its own block */}
			<div className="mt-1">
				{nextMeeting ? (
				<div className="relative group/tooltip flex items-center gap-1.5 cursor-pointer w-fit">
					<span className="text-2xl font-semibold text-accent-gold">Meeting</span>
					<svg className="w-5 h-5 text-foreground-3 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
					<div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 hidden group-hover/tooltip:block bg-background-3 text-foreground text-[10px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
					Join
					</div>
					<ButtonVoiceRoom
					joinText=""
					roomName={nextMeeting.meetId}
					meetingTitle={nextMeeting.meetTitle}
					mode="video"
					joinTo={R.USER_VIDEOCALL}
					isHost={nextMeeting.role === 'organiser'}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					/>
				</div>
				) : (
				<span className="text-2xl font-semibold text-foreground-4">No Meeting</span>
				)}
			</div>

			<p className="text-base text-foreground-3 mt-7">
				{nextMeeting?.meetTitle ?? 'No upcoming meetings'}
			</p>
			<p className="text-base text-foreground-3">
				{nextMeeting
				? `${new Date(nextMeeting.meetStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${nextMeeting.spaceName ?? 'Meeting Room'}`
				: ''}
			</p>
		  </div>
        </div>

        {/* Card 3: Tasks Today */}
        <div className="bg-background-1 rounded-3xl p-6 space-y-1">
          <span className="text-base text-foreground font-semibold">Tasks Today</span>
          <div className="mt-10">
            <span className="text-2xl font-semibold text-foreground">{tasksCompleted}</span>
            <span className="text-2xl text-foreground-4 mx-2">/</span>
            <span className="text-2xl text-foreground-4">{tasksTotal}</span>
          </div>
        </div>

        {/* Card 4: Team Presence */}
        <div className="bg-background-1 rounded-3xl p-6 space-y-1">
          <span className="text-base text-foreground font-semibold">Team Presence</span>
          <div className="mt-10">
            <span className="text-2xl font-semibold text-foreground">{totalActive}</span>
            <span className="text-2xl text-foreground-4 mx-2">/</span>
            <span className="text-2xl text-foreground-4">{totalTeamMembers}</span>
          </div>
        </div>
      </div>

      {/* Outer 4-Column Track Shell */}
      <div className="grid grid-cols-4 gap-6 items-start">

        {/* CONSOLIDATED OPERATIONAL DECK (Columns 1–3) */}
        <div className="col-span-3 bg-background-1 p-6 pt-8 rounded-3xl grid grid-cols-3 gap-6 items-start">

          {/* TRACK 1: CALENDAR OVERVIEW */}
          <div className="space-y-10">
            <CalendarGrid calendarDays={calendarDays} monthYear={monthYear} />

            {/* Stats Quantifiers */}
            <div className="space-y-3 p-3 pt-4">
              <div className="grid grid-cols-3 gap-20">
                {[
                  { value: getMeetingsToday(meetings, now),      label: 'Meetings\nToday' },
                  { value: getMeetingsThisWeek(meetings, now),   label: 'Meetings\nThis Week' },
                  { value: getMeetingsThisMonth(meetings, now),  label: 'Meetings\nThis Month' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-3xl font-semibold text-foreground">{value}</div>
                    <div className="text-sm text-foreground-3 leading-tight mt-1 whitespace-pre-line">{label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-20 pt-2">
                {[
                  { value: getTasksToday(tasks, now),      label: 'Tasks\nToday' },
                  { value: getTasksThisWeek(tasks, now),   label: 'Tasks\nThis Week' },
                  { value: getTasksThisMonth(tasks, now),  label: 'Tasks\nThis Month' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-3xl font-semibold text-foreground">{value}</div>
                    <div className="text-sm text-foreground-3 leading-tight mt-1 whitespace-pre-line">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TRACK 2: MEETINGS */}
		  <div className="space-y-4">
			<h2 className="text-base font-medium text-foreground ml-6 mb-7">Meetings</h2>
			<div className="space-y-5">
				{upcomingMeetings.slice(0, 3).map((meeting, index) => {
				const isFeatured = index === 0;
				const meetingDate = new Date(meeting.meetStart);
				const isToday = meetingDate.toDateString() === now.toDateString();
				const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === meetingDate.toDateString();
				
				const periodLabel = isFeatured
					? 'Next Up'
					: meetingDate.toLocaleDateString('en-US', { 
						weekday: 'short', 
						month: 'short', 
						day: 'numeric' 
					});

				const dateDisplay = meetingDate.toLocaleDateString('en-US', { 
					weekday: 'short', 
					month: 'short', 
					day: 'numeric' 
				});

				return (
					<div
					key={meeting.meetId}
					className={`p-5 mr-2 rounded-2xl flex flex-col justify-between transition-all ${
						isFeatured ? 'bg-accent-gold-bg min-h-[180px]' : 'bg-background-2 min-h-[125px]'
					}`}
					>
					<div className="flex justify-between items-center">
						<div className={`w-12 h-12 rounded-full flex items-center justify-center ${
						isFeatured ? 'bg-accent-gold text-accent-gold' : 'bg-accent-gold-bg text-foreground-4'
						}`}>
						<IconMeetings 
							className={`w-5 h-5 ${isFeatured ? 'text-background-2' : 'text-accent-gold'} stroke-1.5`}
						/>
						</div>
						<div className="text-right">
						<span className={`text-base font-normal tracking-wide ${
							isFeatured ? 'text-foreground-2 font-medium' : 'text-foreground-3'
						}`}>
							{periodLabel}
						</span>
						{/* Only featured shows date below the label */}
						{isFeatured && (
							<p className="text-base text-foreground-3 mt-0.5">
							{dateDisplay}
							</p>
						)}
						</div>
					</div>

					<div className="flex justify-between items-end mt-4 gap-4">
						<h3 className={`text-base font-medium truncate max-w-[170px] ${
						isFeatured ? 'text-[#F3C15F]' : 'text-accent-gold'
						}`}>
						{meeting.meetTitle}
						</h3>
						<div className="text-right flex-shrink-0">
						<p className={`text-base font-normal tracking-wide ${
							isFeatured ? 'text-[#F3C15F]' : 'text-foreground-3'
						}`}>
							{meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</p>
						<p className="text-sm text-foreground-3 mt-0.5 leading-tight">
							{meeting.spaceName ?? 'Meeting Room'}
						</p>
						</div>
					</div>
					</div>
				);
				})}
				{upcomingMeetings.length === 0 && (
				<div className="text-left text-foreground-3 px-6 -mt-2">No upcoming meetings</div>
				)}
			</div>
		  </div>

          {/* TRACK 3: WORK TASKBOARD */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground ml-6">Tasks</h2>
            <div className="space-y-5 mt-7">
              


              {/* TASKS */}
              {sortedTasks.slice(0, 3).map((task, index) => {
                const isHigh   = task.taskPriority === 'high';
                const isMedium = task.taskPriority === 'medium';
                const isToday  = !!task.dueDate && new Date(task.dueDate).toDateString() === now.toDateString();
                const isFeatured = index === 0;

                return (
                  <div
                    key={task.taskId}
                    className={`p-5 mr-2 rounded-2xl flex flex-col justify-between transition-all ${
                      isFeatured ? 'bg-accent-teal-bg min-h-[180px]' : 'bg-background-2 min-h-[125px]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isFeatured ? 'bg-accent-teal text-accent-teal' : 'bg-accent-teal-bg text-foreground-4'
                      }`}>
                        <IconTasks 
                          className={`w-5 h-5 ${isFeatured ? 'text-background-2' : 'text-accent-teal'} stroke-2`}
                        />
                      </div>
                      <span className={`text-base font-normal tracking-wide ${
                        isFeatured ? 'text-foreground-2 font-medium' : 'text-foreground-3'
                      }`}>
                        {isToday ? 'Due Today' : task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No deadline'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-4 gap-4">
                      <h3 className="text-base font-medium truncate max-w-[170px] text-accent-teal">
                        {task.taskTitle}
                      </h3>
                      <span className={`text-base font-normal tracking-wide flex-shrink-0 ${
                        isHigh   ? 'text-[#EF4444]' :
                        isMedium ? 'text-[#F3C15F]' : 'text-foreground-3'
                      }`}>
                        {task.taskPriority.charAt(0).toUpperCase() + task.taskPriority.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="text-left text-foreground-3 px-6 -mt-2">No tasks assigned</div>
              )}
            </div>
          </div>

        </div>

        {/* TRACK 4: TEAM CONNECTIVITY */}
        <div className="bg-background-1 p-6 pt-8 rounded-3xl flex flex-col h-full -ml-1.5">
          <h2 className="text-base font-semibold text-foreground flex-shrink-0">
            Team · {currentUser.department?.dpName ?? 'Team Members'}
          </h2>

          {featuredMember && (
            <FeaturedMemberRow member={featuredMember} />
          )}

          <div className="flex-1 overflow-y-auto min-h-0 mt-4 px-3 space-y-3 max-h-[270px]">
            {regularMembers.map((member, i) => (
              <MemberRow key={i} member={member} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
