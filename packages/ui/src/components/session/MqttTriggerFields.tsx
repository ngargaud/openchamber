import * as React from 'react';
import { Input } from '@/components/ui/input';
import type { I18nKey, I18nParams } from '@/lib/i18n';
import type { ScheduledTaskDraft } from './scheduledTaskEditorDraft';
import { MqttBrokerSelect } from './MqttBrokerSelect';

type Translation = (key: I18nKey, params?: I18nParams) => string;

const FieldLabel: React.FC<{ htmlFor?: string; required?: boolean; children: React.ReactNode }> = ({ htmlFor, required, children }) => (
  <div className="flex items-center gap-1.5">
    <label htmlFor={htmlFor} className="typography-meta font-medium text-foreground">
      {children}
      {required && <span className="ms-0.5 text-destructive">*</span>}
    </label>
  </div>
);

export const MqttTriggerFields: React.FC<{
  draft: ScheduledTaskDraft;
  setDraft: React.Dispatch<React.SetStateAction<ScheduledTaskDraft>>;
  t: Translation;
}> = ({ draft, setDraft, t }) => (
  <div className="flex flex-col gap-3 sm:col-span-2">
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor="sched-mqtt-topic" required>{t('sessions.scheduledTasks.editor.mqtt.topic.label')}</FieldLabel>
      <Input
        id="sched-mqtt-topic"
        value={draft.mqtt.topic}
        onChange={(event) => setDraft((prev) => ({ ...prev, mqtt: { ...prev.mqtt, topic: event.target.value } }))}
        placeholder="sensors/+/temperature"
        className="w-full font-mono"
      />
    </div>
    <div className="flex flex-col gap-1">
      <FieldLabel>{t('sessions.scheduledTasks.editor.mqtt.broker.label')}</FieldLabel>
      <MqttBrokerSelect
        value={draft.mqtt.broker}
        t={t}
        onSelect={(broker) => setDraft((prev) => ({
          ...prev,
          mqtt: { ...prev.mqtt, broker: broker.url, username: broker.username, password: broker.password },
        }))}
      />
    </div>
    <div className="flex flex-col gap-1">
      <FieldLabel>{t('sessions.scheduledTasks.editor.mqtt.payloadTemplate.label')}</FieldLabel>
      <Input
        value={draft.mqtt.payloadTemplate}
        onChange={(event) => setDraft((prev) => ({ ...prev, mqtt: { ...prev.mqtt, payloadTemplate: event.target.value } }))}
        placeholder="{{payload}}"
        className="w-full"
      />
    </div>
    <div className="flex flex-col gap-1">
      <FieldLabel>{t('sessions.scheduledTasks.editor.mqtt.topicTemplate.label')}</FieldLabel>
      <Input
        value={draft.mqtt.topicTemplate}
        onChange={(event) => setDraft((prev) => ({ ...prev, mqtt: { ...prev.mqtt, topicTemplate: event.target.value } }))}
        placeholder="{{topic}}"
        className="w-full"
      />
    </div>
    <label className="flex items-center gap-2 typography-meta">
      <input
        type="checkbox"
        checked={draft.mqtt.handleRetained}
        onChange={(event) => setDraft((prev) => ({ ...prev, mqtt: { ...prev.mqtt, handleRetained: event.target.checked } }))}
      />
      {t('sessions.scheduledTasks.editor.mqtt.handleRetained.label')}
    </label>
  </div>
);
