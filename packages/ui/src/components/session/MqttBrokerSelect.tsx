import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { I18nKey, I18nParams } from '@/lib/i18n';
import { readMqttBrokers, type MqttBroker } from '@/lib/mqttBrokers';

type Translation = (key: I18nKey, params?: I18nParams) => string;

export const MqttBrokerSelect: React.FC<{
  value: string;
  t: Translation;
  onSelect: (broker: MqttBroker) => void;
}> = ({ value, t, onSelect }) => {
  const brokers = readMqttBrokers();
  const matched = brokers.find((broker) => broker.url === value);

  return (
    <Select
      value={matched?.id ?? brokers[0]?.id ?? ''}
      onValueChange={(id) => {
        const broker = brokers.find((item) => item.id === id);
        if (broker) onSelect(broker);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('sessions.scheduledTasks.editor.mqtt.broker.placeholder')}>
          {(id) => brokers.find((broker) => broker.id === id)?.name ?? id}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {brokers.map((broker) => (
          <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
