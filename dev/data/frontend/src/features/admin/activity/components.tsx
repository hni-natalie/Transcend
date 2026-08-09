import { useExportActivities } from "./hooks";
import { DateRangeFilter, CustomDateRange } from './types';

export function getDateRangeBounds(
  filter: DateRangeFilter,
  customRange?: CustomDateRange
): { startDate?: string; endDate?: string } {
  if (filter === 'custom') {
    if (!customRange?.startDate || !customRange?.endDate) return {};
    const start = new Date(customRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customRange.endDate);
    end.setHours(23, 59, 59, 999); // inclusive of the whole end day
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  if (filter === 'all') return {};

  const now = new Date();
  const start = new Date(now);

  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
  }

  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

export const DATE_RANGE_OPTIONS: { label: string; value: DateRangeFilter }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: 'quarter' },
  { label: 'Custom Range', value: 'custom' },
];

interface ExportActivitiesButtonProps {
  type?: string;
  search?: string;
  className?: string;
}

export const ExportActivitiesButton = ({ type, search, className = 'btn-header' }: ExportActivitiesButtonProps) => {
  const { exportActivities, isExporting } = useExportActivities();

  return (
    <button
      onClick={() => exportActivities(type, search)}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? 'Exporting...' : 'Export'}
    </button>
  );
};