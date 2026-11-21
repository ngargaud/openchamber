import React from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icon/Icon';
import { useI18n } from '@/lib/i18n';

export const ScheduledTaskRunNowButton: React.FC<{
  disabled: boolean;
  onRun: () => void;
}> = ({ disabled, onRun }) => {
  const { t } = useI18n();
  return (
    <Button variant="outline" size="sm" onClick={onRun} disabled={disabled}>
      <Icon name="play" className="h-4 w-4" /> {t('sessions.scheduledTasks.dialog.actions.runNow')}
    </Button>
  );
};
