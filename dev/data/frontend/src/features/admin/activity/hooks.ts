import { useState } from 'react';
import { activityApi } from './api/activity.api';

export const useExportActivities = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportActivities = async (type?: string, search?: string) => {
    try {
      setIsExporting(true);
      const csv = await activityApi.exportActivities(type, search);

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export activities:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportActivities, isExporting };
};