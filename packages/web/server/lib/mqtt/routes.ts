import express from 'express';
import { asNonEmptyString, isRecord, isString } from '../shared/guards.js';
import type { Application, Request, Response } from '../shared/http-contracts.js';
import type { MqttClientApi } from './types.js';

type MqttTestBody = {
  url?: unknown;
  username?: unknown;
  password?: unknown;
};

type MqttRouteDependencies = {
  mqttClient?: MqttClientApi | null;
};

export const registerMqttRoutes = (app: Application, dependencies: MqttRouteDependencies): void => {
  const { mqttClient } = dependencies;

  app.post('/api/openchamber/mqtt/test', express.json({ limit: '16kb' }), async (req: Request<MqttTestBody>, res: Response) => {
    const body = isRecord(req.body) ? req.body : {};
    const url = asNonEmptyString(body.url);
    if (!url) return res.status(400).json({ ok: false, error: 'url is required' });
    if (!mqttClient) return res.status(503).json({ ok: false, error: 'MQTT client not available' });
    try {
      const result = await mqttClient.testConnection(url, {
        username: isString(body.username) ? body.username : undefined,
        password: isString(body.password) ? body.password : undefined,
      });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });
};
