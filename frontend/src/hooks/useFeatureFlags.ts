import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlags {
  ENABLE_TRUST_ENGINE: boolean;
  ENABLE_COMPOSITE_SCORE: boolean;
  ENABLE_REJECTION_PORTAL: boolean;
  ENABLE_CODING_DNA: boolean;
  ENABLE_TRAJECTORY: boolean;
  ENABLE_GROWTH_VELOCITY: boolean;
}

const defaultFlags: FeatureFlags = {
  ENABLE_TRUST_ENGINE: false,
  ENABLE_COMPOSITE_SCORE: false,
  ENABLE_REJECTION_PORTAL: false,
  ENABLE_CODING_DNA: false,
  ENABLE_TRAJECTORY: false,
  ENABLE_GROWTH_VELOCITY: false,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('flag_name, enabled');
        
        if (error || !data) {
          setIsLoading(false);
          return;
        }

        const flagMap = { ...defaultFlags };
        data.forEach((row: any) => {
          if (row.flag_name in flagMap) {
            (flagMap as any)[row.flag_name] = row.enabled;
          }
        });
        setFlags(flagMap);
      } catch (err) {
        console.error('Failed to fetch feature flags:', err);
      }
      setIsLoading(false);
    };

    fetchFlags();
  }, []);

  return { flags, isLoading };
}
