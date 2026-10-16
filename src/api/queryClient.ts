import { QueryClient } from '@tanstack/react-query';

/** Configuración común de TanStack Query para toda la app. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});
