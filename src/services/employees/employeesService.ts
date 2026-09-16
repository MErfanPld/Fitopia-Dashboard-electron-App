import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { PermissionCode, StaffEmployee, StaffEmployeeInput } from '../../types/api';

/**
 * Gym panel employees API — OpenAPI: gym-mgmt-employees
 * /api/gym-panel/gyms/{gym_id}/employees/
 * Schema: StaffAccess
 * Permissions: PUT .../employees/{id}/permissions/
 */
function sanitizePayload(payload: Partial<StaffEmployeeInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (!partial || payload.user !== undefined) {
    if (payload.user != null && Number(payload.user) > 0) {
      body.user = Number(payload.user);
    }
  }

  if (!partial || payload.role !== undefined) {
    if (payload.role) body.role = payload.role;
  }

  if (!partial || payload.is_active !== undefined) {
    body.is_active = payload.is_active !== false;
  }

  if (!partial || payload.start_date !== undefined) {
    body.start_date = payload.start_date || null;
  }

  if (!partial || payload.end_date !== undefined) {
    body.end_date = payload.end_date || null;
  }

  if (!partial || payload.employee_number !== undefined) {
    body.employee_number = payload.employee_number != null ? String(payload.employee_number).trim() : '';
  }

  if (!partial) {
    if (!body.user) throw new Error('شناسه کاربر فیتوپیا الزامی است');
    if (!body.role) throw new Error('نقش کارمند الزامی است');
  }

  return body;
}

export const employeesService = {
  async list(gymId: number): Promise<StaffEmployee[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/employees/`);
      return unwrapList<StaffEmployee>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت کارکنان'));
    }
  },

  async get(gymId: number, id: number): Promise<StaffEmployee> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/employees/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'کارمند پیدا نشد'));
    }
  },

  async create(gymId: number, payload: StaffEmployeeInput): Promise<StaffEmployee> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/employees/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت کارمند'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<StaffEmployeeInput>): Promise<StaffEmployee> {
    try {
      const body = sanitizePayload(payload, true);
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/employees/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی کارمند'));
    }
  },

  async replace(gymId: number, id: number, payload: StaffEmployeeInput): Promise<StaffEmployee> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/employees/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی کارمند'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/employees/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف کارمند'));
    }
  },

  /**
   * PUT /employees/{id}/permissions/
   * OpenAPI omits body schema; backend typically expects permission codes list.
   */
  async setPermissions(gymId: number, id: number, codes: PermissionCode[]): Promise<void> {
    try {
      await api.put(`/gym-panel/gyms/${gymId}/employees/${id}/permissions/`, {
        permission_codes: codes,
        codes,
      });
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ذخیره مجوزها'));
    }
  },
};

export default employeesService;
