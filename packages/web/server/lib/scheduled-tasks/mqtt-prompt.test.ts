import { describe, expect, it } from 'vitest';
import { renderMqttPrompt } from '../mqtt/prompt.js';

describe('renderMqttPrompt', () => {
  it('replaces {{payload}} with string payload', () => {
    expect(renderMqttPrompt('msg: {{payload}}', 'hello', 't')).toBe('msg: hello');
  });
  it('replaces {{topic}}', () => {
    expect(renderMqttPrompt('on {{topic}}', 'x', 'sensors/temp')).toBe('on sensors/temp');
  });
  it('supports nested {{payload.key}}', () => {
    expect(renderMqttPrompt('val={{payload.value}}', '{"value":42}', 't')).toBe('val=42');
  });
  it('supports deep nested paths', () => {
    expect(renderMqttPrompt('n={{payload.a.b}}', '{"a":{"b":"deep"}}', 't')).toBe('n=deep');
  });
  it('leaves unknown paths empty', () => {
    expect(renderMqttPrompt('x={{payload.missing}}', '{"v":1}', 't')).toBe('x=');
  });
  it('applies payloadTemplate override', () => {
    const cfg = { payloadTemplate: '{{payload.value}}' };
    expect(renderMqttPrompt('p={{payload}}', '{"value":7}', 't', cfg)).toBe('p=7');
  });
  it('applies topicTemplate override', () => {
    const cfg = { topicTemplate: '{{topic}}/x' };
    expect(renderMqttPrompt('t={{topic}}', 'p', 'base', cfg)).toBe('t=base/x');
  });
  it('stringifies non-string payloads', () => {
    expect(renderMqttPrompt('p={{payload}}', { n: 1 }, 't')).toBe('p={"n":1}');
  });
  it('returns non-string prompt unchanged', () => {
    expect(renderMqttPrompt(42, 'p', 't')).toBe(42);
  });
});
