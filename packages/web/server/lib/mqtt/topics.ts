export const topicMatches = (pattern: string, topic: string): boolean => {
  if (pattern === topic) return true;
  const patternParts = pattern.split('/');
  const topicParts = topic.split('/');
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index];
    if (part === '#') return true;
    if (index >= topicParts.length) return false;
    if (part !== '+' && part !== topicParts[index]) return false;
  }
  return patternParts.length === topicParts.length;
};
