import type { I18nKey, I18nParams } from '@/lib/i18n';

type Translation = (key: I18nKey, params?: I18nParams) => string;

type HeaderSurfaceTitle = { title: string; subtitle: string | null };

export const resolveHeaderSurfaceTitle = (args: {
  guestPage: { pageTitle?: string | null; name: string } | null | undefined;
  isScheduledSurfaceOpen: boolean;
  isEventTasksSurfaceOpen: boolean;
  isArchiveSurfaceOpen: boolean;
  isIntegrationsCatalogSurfaceOpen: boolean;
  isUsageStatsSurfaceOpen: boolean;
  isSourceBoardSurfaceOpen: boolean;
  isOverviewSurfaceOpen: boolean;
  worktreesSurfaceProjectId: string | null;
  spacesSurfaceProjectId: string | null;
  surfaceProjectLabel: string | null;
  runOverviewKey: string | null;
  overviewRunTitle: string | null;
  t: Translation;
}): HeaderSurfaceTitle | null => {
  const {
    guestPage,
    isScheduledSurfaceOpen,
    isEventTasksSurfaceOpen,
    isArchiveSurfaceOpen,
    isIntegrationsCatalogSurfaceOpen,
    isUsageStatsSurfaceOpen,
    isSourceBoardSurfaceOpen,
    isOverviewSurfaceOpen,
    worktreesSurfaceProjectId,
    spacesSurfaceProjectId,
    surfaceProjectLabel,
    runOverviewKey,
    overviewRunTitle,
    t,
  } = args;
  if (guestPage) return { title: guestPage.pageTitle ?? guestPage.name, subtitle: null };
  if (isScheduledSurfaceOpen) return { title: t('sessions.scheduledTasks.dialog.title'), subtitle: null };
  if (isEventTasksSurfaceOpen) return { title: t('sessions.sidebar.header.actions.eventTasks'), subtitle: null };
  if (isArchiveSurfaceOpen) return { title: t('sessions.archivePage.title'), subtitle: null };
  if (isIntegrationsCatalogSurfaceOpen) return { title: t('integrationsCatalog.page.title'), subtitle: null };
  if (isUsageStatsSurfaceOpen) return { title: t('usageStats.title'), subtitle: null };
  if (isSourceBoardSurfaceOpen) return { title: t('sourceBoard.title'), subtitle: null };
  if (isOverviewSurfaceOpen) return { title: t('overview.title'), subtitle: null };
  if (worktreesSurfaceProjectId) {
    return { title: t('sessions.worktreesPage.title', { project: surfaceProjectLabel ?? '' }), subtitle: null };
  }
  if (spacesSurfaceProjectId) {
    return { title: t('spaces.page.title', { project: surfaceProjectLabel ?? '' }), subtitle: null };
  }
  if (runOverviewKey) {
    return { title: overviewRunTitle ?? t('multirun.overview.headerTitle'), subtitle: t('multirun.overview.headerTitle') };
  }
  return null;
};
