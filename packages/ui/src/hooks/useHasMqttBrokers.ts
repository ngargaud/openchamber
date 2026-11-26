import * as React from 'react';
import { readMqttBrokers } from '@/lib/mqttBrokers';

export const useHasMqttBrokers = (): boolean => {
  const [available, setAvailable] = React.useState(() => {
    try {
      const raw = localStorage.getItem('openchamber.mqtt.brokers');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    let cancelled = false;
    const update = async () => {
      try {
        const brokers = await readMqttBrokers();
        if (!cancelled) setAvailable(brokers.length > 0);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    };
    void update();
    const onEvent = () => { void update(); };
    window.addEventListener('storage', onEvent);
    window.addEventListener('openchamber:mqtt-brokers-changed', onEvent);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onEvent);
      window.removeEventListener('openchamber:mqtt-brokers-changed', onEvent);
    };
  }, []);

  return available;
};
