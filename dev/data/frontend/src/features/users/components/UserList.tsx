import React from 'react';
import type { UserList as UserListType } from '@shared/types/user.types';
import { UserStatusBadge } from './UserStatusBadge';

export const UserList = ({ user }: { user: UserListType }) => {
	return (
	<tr className="border-b border-brand-gray-500/30 hover:bg-white/[0.02] transition-colors group">
		{/* Column 1: User (Photo + Name + Email) */}
		{/* adjust table row ht - py */}
		<td className="py-4 px-6">
			<div className="flex items-center gap-3">
			<img 
				src={user.photo} 
				alt={user.firstName} 
				className="w-10 h-10 rounded-full border border-brand-gray-500" 
			/>
			<div className="flex flex-col">
				<span className="text-white font-medium text-sm">
				{user.firstName} {user.lastName}
				</span>
				<span className="text-brand-gray-400 text-xs">{user.email}</span>
			</div>
			</div>
		</td>

		{/* Column 2: ID (HR001)*/}
		<td className="py-4 px-6 text-sm text-brand-gray-300 font-mono">
			{user.username}
		</td>

		{/* Column 3: Department */}
		<td className="py-4 px-6 text-sm text-brand-gray-300">
			{user.department}
		</td>

		{/* Column 4: Role */}
		<td className="py-4 px-6 text-sm text-brand-gray-300">
			{user.role}
		</td>

		{/* Column 5: Status */}
		<td className="py-4 px-6">
			<UserStatusBadge status={user.status} />
		</td>

		{/* Column 6: Date Joined */}
		<td className="py-4 px-6 text-sm text-brand-gray-400">
			{user.dateJoined}
		</td>

		{/* Column 7: Action */}
		<td className="py-4 px-6 text-smt">
			<button className="text-brand-gray-400 hover:text-white text-xs font-bold transition-colors">
			EDIT
			</button>
		</td>
		</tr>
	);
};