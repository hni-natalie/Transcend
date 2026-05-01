import React from 'react';
import { UserList } from '@features/users';
import { PageHeader, IconUsers, MockUsers } from '@shared';

// TODO: alignment, tally with actual users, make editable
// mock search for now
const Search = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16" y1="16" x2="22" y2="22" />
  </svg>
);

export const UserManagement = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const totalUsers = MockUsers.length;
  const totalPages = Math.ceil(totalUsers / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const displayedUsers = MockUsers.slice(startIndex, endIndex);

  return (
    <>
      <PageHeader 
        icon={<IconUsers className="w-8 h-8" />}
        title="Users"
        action={
          <button className="bg-accent-lime-bg text-accent-lime border border-accent-lime px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider hover:opacity-90 transition-opacity">
            + Add User
          </button>
        }
      />

      {/* Main card */}
      <div className="flex flex-col rounded-2xl border border-border bg-bg-1 overflow-hidden">
        {/* Card header - search */}
        <div className="flex items-center p-4 border-b border-border bg-bg-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-2" />
            <input
              type="text"
              placeholder="Search users..."
              className="bg-bg-2 border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-content-primary focus:outline-none focus:border-accent-lime w-72"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-bg-1 border-b border-border">
              <tr className="text-content-2 text-[10px] uppercase tracking-widest">
                <th className="py-4 px-6 font-bold">User</th>
                <th className="py-4 px-6 font-bold">ID</th>
                <th className="py-4 px-6 font-bold">Department</th>
                <th className="py-4 px-6 font-bold">Role</th>
                <th className="py-4 px-6 font-bold">Status</th>
                <th className="py-4 px-6 font-bold">Date Joined</th>
                <th className="py-4 px-6 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedUsers.map((user) => (
                <UserList key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between text-[10px] text-content-2 bg-bg-1 border-t border-border">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-bg-1 border border-border rounded px-2 py-1 text-content-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <p>
            Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} out of {totalUsers} users
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-2 py-1 hover:bg-bg-2 rounded"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-6 h-6 flex items-center justify-center rounded ${
                  currentPage === page
                    ? 'bg-accent-lime text-black font-bold'
                    : 'hover:bg-bg-2'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-2 py-1 hover:bg-bg-2 rounded"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </>
  );
};