import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { LoadingState, getPageNumbers } from '@shared';

interface FilterLayoutProps {
  title?: string;
  action?: ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterTabs: {
    label: string;
    value: string;
  }[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  filterValue: string;
  onFilterSelect: (value: string) => void;
  filterOptions: string[];
  getFilterLabel: () => string;
  showDateFilter?: boolean;
  dateRangeValue?: string;
  dateRangeOptions?: { label: string; value: string }[];
  onDateRangeChange?: (value: string) => void;
  customRange?: { startDate: string; endDate: string };
  onCustomRangeChange?: (range: { startDate: string; endDate: string }) => void;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  showDropdown?: boolean;
  containerHeight?: string;
  className?: string;
  showPagination?: boolean;
  totalItems?: number;
  currentPage?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  startIndex?: number;
  endIndex?: number;
  totalPages?: number;
}

export const FilterLayout = ({
  title,
  action,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterTabs,
  activeFilter,
  onFilterChange,
  filterValue,
  onFilterSelect,
  filterOptions,
  getFilterLabel,
  showDateFilter = false,
  dateRangeValue = 'all',
  dateRangeOptions = [],
  onDateRangeChange,
  customRange = { startDate: '', endDate: '' },
  onCustomRangeChange,
  children,
  isLoading = false,
  isEmpty = false, 
  emptyMessage = 'No items found',
  showFilters = true,
  showSearch = true,
  showDropdown = true,
  containerHeight = 'calc(100vh - 95px)',
  className = '',
  showPagination = false,
  totalItems = 0,
  currentPage = 1,
  perPage = 10,
  onPageChange,
  onPerPageChange,
  startIndex = 0,
  endIndex = 0,
  totalPages = 1,
}: FilterLayoutProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const perPageRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // closes filter dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // closes per-page dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (perPageRef.current && !perPageRef.current.contains(event.target as Node)) {
        setShowPerPageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

   // closes date filter dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading..." size="full" />;
  }

  return (
    <div className={`bg-background-1 rounded-2xl overflow-hidden flex flex-col ${className}`}>
      <div className="flex flex-col h-full" style={{ height: containerHeight }}>
        
        {/* HEADER */}
        <div className="flex-shrink-0">
          <div className="p-6 pb-4 flex items-center justify-between gap-4">
            {/* LEFT SIDE: TABS */}
            {showFilters && (
              <div className="flex items-center gap-1 text-base flex-shrink-0">
                {filterTabs.map((tab) => (
                  <div key={tab.value} className="relative flex items-center">
                    <button
                      onClick={() => {
                        if (tab.value === 'All' || tab.value === 'all' || !showDropdown) {
                          onFilterChange(tab.value);
                        } else {
                          if (activeFilter === tab.value) {
                            setIsDropdownOpen(!isDropdownOpen);
                          } else {
                            onFilterChange(tab.value);
                            setIsDropdownOpen(true);
                          }
                        }
                      }}
                      className={`px-4 py-1.5 rounded-lg transition-colors text-xl font-medium flex items-center cursor-pointer ${
                        activeFilter === tab.value
                          ? 'text-accent-lime font-semibold'
                          : 'text-foreground-3 hover:text-foreground'
                      }`}
                    >
                      <span className="whitespace-nowrap">{tab.label}</span>
                      
                      {showDropdown && activeFilter === tab.value && tab.value !== 'All' && tab.value !== 'all' && filterValue && (
                        <>
                          <span className="text-foreground-2 text-base font-normal mx-1">•</span>
                          <span className="text-foreground-2 text-base font-normal whitespace-nowrap">
                            {filterValue}
                          </span>
                        </>
                      )}
                    </button>

                    {showDropdown && activeFilter === tab.value && tab.value !== 'All' && tab.value !== 'all' && isDropdownOpen && (
                      <div 
                        ref={dropdownRef}
                        className="absolute top-full left-3 mt-1 min-w-[180px] bg-background-2 border border-background-3 rounded-lg shadow-lg z-50 py-1"
                      >
                        <button
                          onClick={() => {
                            onFilterSelect('');
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-background-3 transition-colors cursor-pointer ${
                            filterValue === '' ? 'text-accent-lime font-medium' : 'text-white'
                          }`}
                        >
                          All {getFilterLabel()}
                        </button>
                        
                        <div className="border-t border-background-3 my-1" />
                        
                        {filterOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              onFilterSelect(option);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-background-3 transition-colors cursor-pointer ${
                              filterValue === option ? 'text-accent-lime font-medium' : 'text-white'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* RIGHT SIDE: DATE FILTER + SEARCH */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* DATE RANGE FILTER */}
              {showDateFilter && (
                <div className="relative" ref={dateFilterRef}>
                  <button
                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                    className="bg-background-2 border border-background-3 rounded-lg px-3 py-1.5 text-base text-foreground flex items-center gap-2 cursor-pointer hover:bg-background-3 transition-colors whitespace-nowrap"
                  >
                    <span>
                      {dateRangeValue === 'custom' && customRange.startDate && customRange.endDate
                        ? `${customRange.startDate} → ${customRange.endDate}`
                        : dateRangeOptions.find((o) => o.value === dateRangeValue)?.label ?? 'All Time'}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showDateDropdown ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDateDropdown && (
                    <div className="absolute top-full right-0 mt-1 min-w-[220px] bg-background-2 border border-background-3 rounded-lg shadow-lg z-50 py-1">
                      {dateRangeOptions.map((option) =>
                        option.value === 'custom' ? (
                          <div key={option.value} className="px-4 py-2 border-t border-background-3 mt-1 pt-2">
                            <button
                              onClick={() => onDateRangeChange?.('custom')}
                              className={`w-full text-left text-sm mb-2 cursor-pointer ${
                                dateRangeValue === 'custom' ? 'text-accent-lime font-medium' : 'text-white'
                              }`}
                            >
                              {option.label}
                            </button>

                            {dateRangeValue === 'custom' && (
                              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="date"
                                  value={customRange.startDate}
                                  onChange={(e) =>
                                    onCustomRangeChange?.({ ...customRange, startDate: e.target.value })
                                  }
                                  className="bg-background-3 text-white text-sm rounded px-2 py-1 border border-background-3 focus:outline-none focus:border-accent-lime"
                                />
                                <input
                                  type="date"
                                  value={customRange.endDate}
                                  onChange={(e) =>
                                    onCustomRangeChange?.({ ...customRange, endDate: e.target.value })
                                  }
                                  className="bg-background-3 text-white text-sm rounded px-2 py-1 border border-background-3 focus:outline-none focus:border-accent-lime"
                                />
                                <button
                                  onClick={() => setShowDateDropdown(false)}
                                  disabled={!customRange.startDate || !customRange.endDate}
                                  className="bg-accent-lime text-black text-sm rounded px-2 py-1 mt-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            key={option.value}
                            onClick={() => {
                              onDateRangeChange?.(option.value);
                              setShowDateDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-background-3 transition-colors cursor-pointer ${
                              dateRangeValue === option.value ? 'text-accent-lime font-medium' : 'text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SEARCH */}
              {showSearch && (
                <div className="relative w-80">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-background-2 border border-background-3 rounded-lg pl-9 pr-4 py-1.5 text-base text-white placeholder-foreground-3 focus:outline-none focus:border-background-2 transition-colors"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-b border-background-3" />
        </div>

        {/* SCROLLABLE CONTENT */}
		<div className="flex-1 overflow-auto min-h-0 px-6">
		  {isEmpty ? (
			<div className="flex items-center justify-center h-full">
			  <p className="text-foreground-3">{emptyMessage}</p>
			</div>
		  ) : (
			children
		  )}
		</div>
        {/* <div className="flex-1 overflow-auto min-h-0 px-6">
          {React.Children.count(children) === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-foreground-3">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </div> */}

        {/* PAGINATION - with custom per-page dropdown */}
        {showPagination && totalItems > 0 && onPageChange && onPerPageChange && (
          <>
            <div className="border-t border-background-3" />
            <div className="flex-shrink-0 p-5 flex items-center justify-between text-base text-foreground-3 bg-background-1">
              <div className="flex items-center gap-2 px-4">
                <span>Showing</span>
                
                <div className="relative" ref={perPageRef}>
                  <button
                    onClick={() => setShowPerPageDropdown(!showPerPageDropdown)}
                    className="bg-background-2 border border-background-3 rounded px-2 py-1 text-foreground text-sm cursor-pointer flex items-center gap-2 hover:bg-background-3 transition-colors"
                  >
                    <span>{perPage}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showPerPageDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showPerPageDropdown && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 min-w-full bg-background-2 border border-background-3 rounded-lg shadow-lg z-50 py-1">
                      {[5, 10, 20, 50].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            onPerPageChange(val);
                            onPageChange(1);
                            setShowPerPageDropdown(false);
                          }}
                          className={`w-full text-center px-4 py-2 text-sm hover:bg-background-3 transition-colors cursor-pointer ${
                            perPage === val ? 'text-accent-lime font-medium' : 'text-white'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} out of {totalItems} items
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentPage === 1 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-background-3'
                  }`}
                >
                  &lt;
                </button>

				{getPageNumbers(currentPage, totalPages).map((page, idx) =>
				  page === '...' ? (
					<span key={`ellipsis-${idx}`} className="w-6 h-6 flex items-center justify-center text-foreground-3">
					  …
					</span>
				  ) : (
					<button
					  key={page}
					  onClick={() => onPageChange(page as number)}
					  className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer ${
						currentPage === page
						? 'bg-accent-lime text-black font-bold'
						: 'hover:bg-accent-lime-bg'
					  }`}
					>
					  {page}
					</button>
				  )
				)}

                {/* {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer ${
                      currentPage === page
                        ? 'bg-accent-lime text-black font-bold'
                        : 'hover:bg-accent-lime-bg'
                    }`}
                  >
                    {page}
                  </button>
                ))} */}

                <button
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded transition-colors ${
                    currentPage === totalPages 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-background-3'
                  }`}
                >
                  &gt;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};