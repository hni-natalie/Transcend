import React from 'react';
import type { UserStatus } from '@shared/types/user.types';

export const UserStatusBadge = ({ status }: { status: UserStatus }) => {
	const statusStyles: Record<UserStatus, string> = {
		'Online': 'text-accent-lime',
		'In Meeting': 'text-rose-400',
		'Busy': 'text-amber-400',
		'Offline': 'text-foreground-2',
	};

	return (
		<div className="flex items-center gap-2">
		{/* small glowing dot for 'Online' */}
		{status === 'Online' && <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />}
		<span className={`text-sm font-medium ${statusStyles[status]}`}>
			{status}
		</span>
		</div>
	);
};