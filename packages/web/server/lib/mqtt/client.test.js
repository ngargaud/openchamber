import { describe, expect, it } from 'vitest';
import { normalizeBrokerUrl } from './broker-url.ts';
import { topicMatches } from './topics.ts';

describe('mqtt broker URLs', () => {
  it('keeps WebSocket broker URLs intact', () => {
    expect(normalizeBrokerUrl('ws://mqtt:1883')).toBe('ws://mqtt:1883');
    expect(normalizeBrokerUrl('wss://mqtt.example.com:443')).toBe('wss://mqtt.example.com:443');
    expect(normalizeBrokerUrl('wss://mqtt.example.com:8084/mqtt')).toBe('wss://mqtt.example.com:8084/mqtt');
  });

  it('keeps TCP broker URLs intact and prefixes bare hosts', () => {
    expect(normalizeBrokerUrl('mqtt://mqtt:1882')).toBe('mqtt://mqtt:1882');
    expect(normalizeBrokerUrl('mqtts://mqtt.example.com:8883')).toBe('mqtts://mqtt.example.com:8883');
    expect(normalizeBrokerUrl('mqtt:1882')).toBe('mqtt://mqtt:1882');
  });
});

describe('mqtt topicMatches', () => {
  it('matches exact topics', () => {
    expect(topicMatches('a/b', 'a/b')).toBe(true);
    expect(topicMatches('a/b', 'a/c')).toBe(false);
  });
  it('matches + wildcard', () => {
    expect(topicMatches('a/+/c', 'a/b/c')).toBe(true);
    expect(topicMatches('a/+/c', 'a/b/d')).toBe(false);
    expect(topicMatches('a/+/c', 'a/b/c/d')).toBe(false);
  });
  it('matches # wildcard', () => {
    expect(topicMatches('a/#', 'a/b/c')).toBe(true);
    expect(topicMatches('#', 'anything/goes')).toBe(true);
    expect(topicMatches('a/#', 'a')).toBe(true);
  });
});