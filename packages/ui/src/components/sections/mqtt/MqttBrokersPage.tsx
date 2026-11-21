import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { SettingsPageLayout } from '@/components/sections/shared/SettingsPageLayout';
import { SettingsSection } from '@/components/sections/shared/SettingsSection';
import { runtimeFetch } from '@/lib/runtime-fetch';
import { readMqttBrokers, writeMqttBrokers } from '@/lib/mqttBrokers';
import { generateUuid } from '@/lib/uuid';

export function MqttBrokersPage() {
  const { t } = useI18n();
  const [brokers, setBrokers] = React.useState(() => readMqttBrokers());
  const [name, setName] = React.useState('');
  const [url, setUrl] = React.useState('mqtt://localhost:1883');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [testing, setTesting] = React.useState(false);

  const testConnection = async () => {
    if (!url.trim()) { toast.error(t('settings.mqtt.toast.urlRequired')); return; }
    setTesting(true);
    try {
      const response = await runtimeFetch('/api/openchamber/mqtt/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url: url.trim(), username: username.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.ok) {
        toast.success(t('settings.mqtt.toast.testOk'));
      } else {
        toast.error(t('settings.mqtt.toast.testFailed'), { description: data?.error });
      }
    } catch (error) {
      toast.error(t('settings.mqtt.toast.testFailed'), { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setTesting(false);
    }
  };

  const add = () => {
    if (!url.trim()) { toast.error(t('settings.mqtt.toast.urlRequired')); return; }
    const next = [...brokers, { id: generateUuid(), name: name.trim() || url.trim(), url: url.trim(), username: username.trim(), password }];
    setBrokers(next);
    writeMqttBrokers(next);
    setName(''); setUrl('mqtt://localhost:1883'); setUsername(''); setPassword('');
    toast.success(t('settings.mqtt.toast.saved'));
  };

  const remove = (id: string) => {
    const next = brokers.filter((b) => b.id !== id);
    setBrokers(next);
    writeMqttBrokers(next);
  };

  return (
    <SettingsPageLayout title={t('settings.mqtt.title')} description={t('settings.mqtt.description')}>
      <SettingsSection title={t('settings.mqtt.section.saved')}>
        {brokers.length === 0 ? (
          <p className="typography-meta text-muted-foreground">{t('settings.mqtt.empty')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {brokers.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <div className="flex flex-col">
                  <span className="typography-meta font-medium">{b.name}</span>
                  <span className="typography-micro text-muted-foreground">{b.url}</span>
                </div>
                <Button type="button" variant="ghost" size="xs" onClick={() => remove(b.id)}>{t('common.delete')}</Button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
      <SettingsSection title={t('settings.mqtt.section.add')}>
        <div className="flex flex-col gap-2">
          <Input placeholder={t('settings.mqtt.field.name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={t('settings.mqtt.field.url')} value={url} onChange={(e) => setUrl(e.target.value)} />
          <p className="typography-micro text-muted-foreground">{t('settings.mqtt.field.url.hint')}</p>
          <Input placeholder={t('settings.mqtt.field.username')} value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder={t('settings.mqtt.field.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={testConnection} disabled={testing}>{testing ? t('settings.mqtt.action.testing') : t('settings.mqtt.action.test')}</Button>
            <Button type="button" onClick={add}>{t('settings.mqtt.action.add')}</Button>
          </div>
        </div>
      </SettingsSection>
    </SettingsPageLayout>
  );
}