import * as React from 'react';
import { hasMqttBrokers } from '@/lib/mqttBrokers';

export const useHasMqttBrokers = (): boolean => {
  const [available, setAvailable] = React.useState(hasMqttBrokers);

  React.useEffect(() => {
    const update = () => setAvailable(hasMqttBrokers());
    window.addEventListener('storage', update);
    window.addEventListener('openchamber:mqtt-brokers-changed', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('openchamber:mqtt-brokers-changed', update);
    };
  }, []);

  return available;
};
