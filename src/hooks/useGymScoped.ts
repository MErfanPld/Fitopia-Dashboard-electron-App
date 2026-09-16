import { useAuth } from '../context/AuthContext';
import type { PermissionCode } from '../types/api';

export function useGymScoped(requiredPerm?: PermissionCode) {
  const { gymId, currentGym, can, loading } = useAuth();
  const hasGym = gymId != null && gymId > 0;
  const allowed = !requiredPerm || can(requiredPerm);
  return { gymId, currentGym, hasGym, allowed, loading, can };
}
