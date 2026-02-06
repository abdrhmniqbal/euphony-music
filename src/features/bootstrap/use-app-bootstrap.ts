import { useEffect, useState } from 'react';
import { bootstrapApp } from '@/features/bootstrap/bootstrap.service';

export function useAppBootstrap() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      await bootstrapApp();
      if (isMounted) {
        setIsInitialized(true);
      }
    }

    void initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isInitialized };
}
