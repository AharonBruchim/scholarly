import { useNavigate, useParams } from "react-router-dom";

export function useDashboardTab<T extends string>(basePath: string, tabIds: readonly T[]) {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab = tabIds.find((id) => id === tab);
  const setActiveTab = (nextTab: T) => navigate(`${basePath}/${nextTab}`);
  return { activeTab, setActiveTab };
}
