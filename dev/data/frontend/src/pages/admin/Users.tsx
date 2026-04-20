import React from 'react';
import { MenuSide } from '../../components';
import { menuConfig } from '../../config/menu.conf';
import { UserList } from '../../components/UserList';
import { IconUsers } from '../../config/menu.icons.conf';
import { MockUsers } from '../../mocks/users';

// mock search for now
const Search = (props: React.SVGProps<SVGSVGElement>) => (
	<svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
		<circle cx="11" cy="11" r="7" />
		<line x1="16" y1="16" x2="22" y2="22" />
	</svg>
	);

	export default function Users() {
	// pagination state
	const [currentPage, setCurrentPage] = React.useState(1);
	const [perPage, setPerPage] = React.useState(10);

	// computed n users
	const totalUsers = MockUsers.length;
	const totalPages = Math.ceil(totalUsers / perPage);

	const startIndex = (currentPage - 1) * perPage;
	const endIndex = startIndex + perPage;

	// dynamic slicing instead of fixed slice(0, 10)
	const displayedUsers = MockUsers.slice(startIndex, endIndex);

	return (
		<div className="flex h-screen bg-brand-black overflow-hidden">
		{/* Sidebar */}
		<div className="relative flex-none border-r border-[var(--border-gray)]">
			<MenuSide conf={menuConfig} />
		</div>

		<main className="flex-1 flex flex-col pt-11 p-8 overflow-hidden">
			{/* page header */}
			<div className="flex items-center justify-between mb-14 flex-shrink-0">
			<div className="flex items-center gap-3 font-mono">
				<IconUsers className="w-10 h-10 text-brand-lime" />
				<h1 className="text-3xl text-white tracking-tight font-normal">Users</h1>
			</div>

			<button className="bg-brand-lime-bg text-brand-lime border border-brand-lime px-4 py-1.5 rounded-lg font-bold text-[10px] tracking-wider hover:opacity-90 transition-opacity">
				+ Add User
			</button>
			</div>

			{/* box */}
			<div className="h-fit max-h-full flex flex-col rounded-2xl border border-[var(--border-gray)] bg-brand-black-sub overflow-hidden">
			{/* box header */}
			<div className="flex items-center p-4 border-b border-[var(--border-gray)] bg-brand-black-sub">
				<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-400" />
				<input
					type="text"
					placeholder="Search users..."
					className="bg-brand-black-2 border border-[var(--border-gray)] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-lime w-72"
				/>
				</div>
			</div>

			{/* table */}
			<div className="flex-1 overflow-y-auto custom-scrollbar">
				<table className="w-full text-left border-collapse min-w-[800px]">
				<thead className="sticky top-0 z-10 bg-brand-black-sub border-b border-[var(--border-gray)]">
					<tr className="text-brand-gray-400 text-[10px] uppercase tracking-widest">
					<th className="py-4 px-6 font-bold">User</th>
					<th className="py-4 px-6 font-bold">ID</th>
					<th className="py-4 px-6 font-bold">Department</th>
					<th className="py-4 px-6 font-bold">Role</th>
					<th className="py-4 px-6 font-bold">Status</th>
					<th className="py-4 px-6 font-bold">Date Joined</th>
					<th className="py-4 px-6 font-bold">Action</th>
					</tr>
				</thead>

				<tbody className="divide-y divide-[var(--border-gray)]">
					{displayedUsers.map((user) => (
					<UserList key={user.id} user={user} />
					))}
				</tbody>
				</table>
			</div>

			{/* footer - pagination */}
			<div className="p-4 flex items-center justify-between text-[10px] text-brand-gray-400 bg-brand-black-sub">
				{/* LEFT - per page selector */}
				<div className="flex items-center gap-2">
				<span>Showing</span>
				<select
					value={perPage}
					onChange={(e) => {
					setPerPage(Number(e.target.value));
					setCurrentPage(1);
					}}
					className="bg-brand-black-sub border border-brand-gray-500 rounded px-2 py-1 text-white"
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={20}>20</option>
				</select>
				</div>

				{/* CENTER - dynamic text */}
				<p>
				Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} out of {totalUsers} users
				</p>

				{/* RIGHT - real pagination */}
				<div className="flex items-center gap-2">
				{/* prev */}
				<button
					onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
					className="px-2 py-1 hover:bg-brand-gray-800 rounded"
				>
					&lt;
				</button>

				{/* page numbers */}
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
					<button
					key={page}
					onClick={() => setCurrentPage(page)}
					className={`w-6 h-6 flex items-center justify-center rounded ${
						currentPage === page ? 'bg-brand-lime text-black font-bold' : 'hover:bg-brand-gray-800'
					}`}
					>
					{page}
					</button>
				))}

				{/* next */}
				<button
					onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
					className="px-2 py-1 hover:bg-brand-gray-800 rounded"
				>
					&gt;
				</button>
				</div>
			</div>
			</div>
		</main>
		</div>
	);
}