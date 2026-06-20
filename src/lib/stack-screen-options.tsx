import { useThemeConfig } from '@/lib/use-theme-config';

export function useStackScreenOptions() {
  const theme = useThemeConfig();

  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.text,
  };
}
