import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/tanstack-query";
import { DatabaseProvider } from "./database-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider>
        {children}
      </DatabaseProvider>
    </QueryClientProvider>
  );
}
