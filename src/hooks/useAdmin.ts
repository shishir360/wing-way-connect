import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const { user, role, loading } = useAuth();

  // If auth is loading, admin status is loading.
  // If not loading, admin status is determined by role === 'admin'
  const isAdmin = !loading && !!user && role === 'admin';

  return { isAdmin, loading };
}
