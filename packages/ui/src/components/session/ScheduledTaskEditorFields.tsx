import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRON_EXAMPLES, getNextRuns, isValidCronExpression } from '@/lib/cron';
import type { I18nKey, I18nParams } from '@/lib/i18n';
import type { ScheduledTaskDraft } from './scheduledTaskEditorDraft';
import { TIMEZONE_OPTIONS } from './scheduledTaskEditorOptions';

type Translation = (key: I18nKey, params?: I18nParams) => string;

export const FieldLabel: React.FC<{
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ htmlFor, required, children }) => (
  <div className="flex items-center gap-1.5">
    <label htmlFor={htmlFor} className="typography-meta font-medium text-foreground">
      {children}
      {required && <span className="ms-0.5 text-destructive">*</span>}
    </label>
  </div>
);

export const CronScheduleSection: React.FC<{
  draft: ScheduledTaskDraft;
  setDraft: React.Dispatch<React.SetStateAction<ScheduledTaskDraft>>;
  locale: string;
  t: Translation;
}> = ({ draft, setDraft, locale, t }) => {
  const cronExpression = draft.schedule.cronExpression;
  const cronValidation = React.useMemo(
    () => (cronExpression.trim() ? isValidCronExpression(cronExpression) : null),
    [cronExpression],
  );
  const nextRuns = React.useMemo(() => {
    if (!cronValidation?.valid || !cronExpression.trim()) return [];
    return getNextRuns(cronExpression, draft.schedule.timezone);
  }, [cronExpression, cronValidation, draft.schedule.timezone]);
  const formatNextRun = React.useCallback(
    (date: Date) => new Intl.DateTimeFormat(locale, {
      timeZone: draft.schedule.timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
    [locale, draft.schedule.timezone],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="sched-cron" required>{t('sessions.scheduledTasks.editor.cronExpression.label')}</FieldLabel>
        <Input
          id="sched-cron"
          value={cronExpression}
          onChange={(event) => setDraft((prev) => ({
            ...prev,
            schedule: { ...prev.schedule, cronExpression: event.target.value },
          }))}
          placeholder={t('sessions.scheduledTasks.editor.cronExpression.placeholder')}
          className="w-full max-w-xs font-mono"
        />
        {cronValidation && !cronValidation.valid && cronExpression.trim() ? (
          <span className="typography-micro text-destructive">
            {t('sessions.scheduledTasks.editor.validation.cronInvalid')}
          </span>
        ) : null}
      </div>

      {nextRuns.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="typography-meta text-muted-foreground">{t('sessions.scheduledTasks.editor.cronExpression.nextRuns')}</span>
          <span className="typography-micro text-foreground">{nextRuns.map(formatNextRun).join(', ')}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <span className="typography-meta text-muted-foreground">{t('sessions.scheduledTasks.editor.cronExpression.examples')}</span>
        <div className="flex flex-wrap gap-1.5">
          {CRON_EXAMPLES.map((example) => (
            <button
              key={example.expression}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 typography-micro text-foreground hover:bg-interactive-hover"
              onClick={() => setDraft((prev) => ({
                ...prev,
                schedule: { ...prev.schedule, cronExpression: example.expression },
              }))}
            >
              <span className="font-mono">{example.expression}</span>
              <span className="text-muted-foreground">{t(example.labelKey as Parameters<typeof t>[0])}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel>{t('sessions.scheduledTasks.editor.timezone.label')}</FieldLabel>
        <Select
          value={draft.schedule.timezone}
          onValueChange={(timezone) => setDraft((prev) => ({
            ...prev,
            schedule: { ...prev.schedule, timezone },
          }))}
        >
          <SelectTrigger className="w-fit max-w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((timezone) => (
              <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
