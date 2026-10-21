import { useNavigate, useParams } from "react-router-dom";

type NonEmptyList<T> = readonly [T, ...T[]];

function findRedirectPath<T extends string, S extends string>(
  basePath: string,
  tabIds: NonEmptyList<T>,
  activeTab: T | undefined,
  tabSectionIds: NonEmptyList<S> | undefined,
  activeSection: S | undefined,
  requestedSection: string | undefined,
): string | null {
  if (!activeTab) return `${basePath}/${tabIds[0]}`;
  if (tabSectionIds && !activeSection) return `${basePath}/${activeTab}/${tabSectionIds[0]}`;
  if (!tabSectionIds && requestedSection !== undefined) return `${basePath}/${activeTab}`;
  return null;
}

export function useDashboardRoute<T extends string, S extends string = never>(
  basePath: string,
  tabIds: NonEmptyList<T>,
  sectionIdsByTab: Partial<Record<T, NonEmptyList<S>>> = {},
) {
  const { tab, section } = useParams<{ tab: string; section: string }>();
  const navigate = useNavigate();
  const activeTab = tabIds.find((id) => id === tab);
  const tabSectionIds = activeTab ? sectionIdsByTab[activeTab] : undefined;
  const activeSection = tabSectionIds?.find((id) => id === section);
  const redirectPath = findRedirectPath(
    basePath,
    tabIds,
    activeTab,
    tabSectionIds,
    activeSection,
    section,
  );
  const setActiveTab = (nextTab: T) => navigate(`${basePath}/${nextTab}`);
  const setActiveSection = (nextSection: S) => navigate(`${basePath}/${activeTab}/${nextSection}`);
  return { activeTab, activeSection, redirectPath, setActiveTab, setActiveSection };
}
