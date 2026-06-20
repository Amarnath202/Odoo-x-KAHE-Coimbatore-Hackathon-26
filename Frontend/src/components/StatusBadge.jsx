import React from 'react';

const STATUS_STYLES = {
  // Sales
  Draft: 'badge-draft',
  Confirmed: 'badge-confirmed',
  Partial: 'badge-partial',
  'Partially Delivered': 'badge-partial',
  'Partially Received': 'badge-partial',
  Done: 'badge-done',
  Delivered: 'badge-done',
  Cancelled: 'badge-cancelled',
  // Manufacturing
  'In Progress': 'badge-progress',
  'Planned': 'badge-confirmed',
  // Generic
  Active: 'badge-done',
  Inactive: 'badge-cancelled',
};

const DOTS = {
  'badge-draft': 'bg-status-draft',
  'badge-confirmed': 'bg-status-confirmed',
  'badge-partial': 'bg-status-partial',
  'badge-done': 'bg-status-done',
  'badge-cancelled': 'bg-status-cancelled',
  'badge-progress': 'bg-status-progress',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'badge-draft';
  const dot = DOTS[cls] || 'bg-text-muted';

  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
