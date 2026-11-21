import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useI18n } from '@/lib/i18n';
import { ScheduledTasksView, type ScheduledTasksLeaveReason } from '@/components/session/ScheduledTasksDialog';
import { MobileFullscreenSurface } from './MobileFullscreenSurface';

export const MobileTasksSurface: React.FC<{
  mode: 'scheduled' | 'event';
  variant: 'fullscreen' | 'dialog';
  onClose: () => void;
  onLeave: (reason: ScheduledTasksLeaveReason) => void;
}> = ({ mode, variant, onClose, onLeave }) => {
  const { t } = useI18n();
  const title = mode === 'event'
    ? t('sessions.sidebar.header.actions.eventTasks')
    : t('sessions.scheduledTasks.dialog.title');

  return (
    <MobileFullscreenSurface
      open
      variant={variant}
      dialogAlign="app"
      onClose={onClose}
      ariaLabel={title}
      title={title}
    >
      <ErrorBoundary>
        <ScheduledTasksView layout="mobile" mode={mode} onLeave={onLeave} />
      </ErrorBoundary>
    </MobileFullscreenSurface>
  );
};
