import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAgent() {
  const [isAgent, setIsAgent] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAgentRole();
    } else {
      setIsAgent(false);
      setIsApproved(false);
      setLoading(false);
    }
  }, [user]);

  const checkAgentRole = async () => {
    if (!user) return;
    try {
      // 1. Check user_roles first (preferred)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, is_approved')
        .eq('user_id', user.id)
        .eq('role', 'agent')
        .maybeSingle();

      if (roleData) {
        setIsAgent(true);
        setIsApproved(!!roleData.is_approved);
        return;
      }

      // 2. Fallback: Check agents table (for initial signup/legacy)
      const { data: agentData, error: agentError } = await supabase
        .from('agents' as any)
        .select('id, is_approved')
        .eq('user_id', user.id)
        .maybeSingle();

      if (agentData) {
        setIsAgent(true);
        setIsApproved(!!(agentData as any).is_approved);
      } else {
        setIsAgent(false);
        setIsApproved(false);
      }

      if (roleError && !agentData) console.error("Error checking user_roles:", roleError);
      if (agentError) console.error("Error checking agents table:", agentError);

    } catch (error) {
      console.error('Error checking agent role:', error);
      setIsAgent(false);
      setIsApproved(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAgent, isApproved, loading, refetch: checkAgentRole };
}
