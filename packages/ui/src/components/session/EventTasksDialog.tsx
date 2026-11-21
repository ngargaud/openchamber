import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { ScheduledTasksView } from './ScheduledTasksDialog';

export function EventTasksDialog() {
  const open = useUIStore((state) => state.isEventTasksDialogOpen);
  const setOpen = useUIStore((state) => state.setEventTasksDialogOpen);
  const leave = React.useCallback(() => setOpen(false), [setOpen]);
  return open ? <ScheduledTasksView layout="page" mode="event" onLeave={leave} /> : null;
}
