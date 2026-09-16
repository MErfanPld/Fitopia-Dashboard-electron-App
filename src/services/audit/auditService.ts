import api, { unwrapList } from '../apiClient';
import type { AuditLog } from '../../types/api';
export const auditService = {
  async list(gymId: number): Promise<AuditLog[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/audit-logs/`);
    return unwrapList<AuditLog>(data);
  },
};
export default auditService;
