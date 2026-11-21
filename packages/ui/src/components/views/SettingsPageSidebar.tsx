import React from 'react';
import { AgentsSidebar } from '@/components/sections/agents/AgentsSidebar';
import { CommandsSidebar } from '@/components/sections/commands/CommandsSidebar';
import { SkillsSidebar } from '@/components/sections/skills/SkillsSidebar';
import { ProjectsSidebar } from '@/components/sections/projects/ProjectsSidebar';
import { UsageSidebar } from '@/components/sections/usage/UsageSidebar';
import { MagicPromptsSidebar } from '@/components/sections/magic-prompts/MagicPromptsSidebar';
import { SnippetsSidebar } from '@/components/sections/snippets/SnippetsSidebar';
import type { SettingsPageSlug } from '@/lib/settings/metadata';

export const SettingsPageSidebar: React.FC<{
  slug: SettingsPageSlug;
  onItemSelect?: () => void;
}> = ({ slug, onItemSelect }) => {
  switch (slug) {
    case 'projects':
      return <ProjectsSidebar onItemSelect={onItemSelect} />;
    case 'agents':
      return <AgentsSidebar onItemSelect={onItemSelect} />;
    case 'commands':
      return <CommandsSidebar onItemSelect={onItemSelect} />;
    case 'skills.installed':
      return <SkillsSidebar onItemSelect={onItemSelect} />;
    case 'usage':
      return <UsageSidebar onItemSelect={onItemSelect} />;
    case 'magic-prompts':
      return <MagicPromptsSidebar onItemSelect={onItemSelect} />;
    case 'snippets':
      return <SnippetsSidebar onItemSelect={onItemSelect} />;
    default:
      return null;
  }
};
