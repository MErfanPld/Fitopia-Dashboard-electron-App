import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymPrice, GymPriceInput } from '../../types/api';

/**
 * Gym panel prices — OpenAPI gym prices endpoints
 * /api/gym-panel/gyms/{gym_id}/prices/
 */
function toIntOrNull(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sanitizePayload(payload: Partial<GymPriceInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (!partial || payload.sport !== undefined) {
    if (payload.sport != null && Number(payload.sport) > 0) {
      body.sport = Number(payload.sport);
    }
  }
  if (!partial || payload.session_price !== undefined) {
    body.session_price = toIntOrNull(payload.session_price);
  }
  if (!partial || payload.monthly_price !== undefined) {
    body.monthly_price = toIntOrNull(payload.monthly_price) ?? 0;
  }
  if (!partial || payload.quarterly_price !== undefined) {
    body.quarterly_price = toIntOrNull(payload.quarterly_price);
  }
  if (!partial || payload.yearly_price !== undefined) {
    body.yearly_price = toIntOrNull(payload.yearly_price) ?? 0;
  }

  if (!partial) {
    if (!body.sport) throw new Error('انتخاب رشته ورزشی الزامی است');
  }

  return body;
}

export const pricesService = {
  async list(gymId: number): Promise<GymPrice[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/prices/`);
      return unwrapList<GymPrice>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت قیمت‌ها'));
    }
  },

  async get(gymId: number, id: number): Promise<GymPrice> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/prices/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'قیمت پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymPriceInput): Promise<GymPrice> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/prices/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت قیمت'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<GymPriceInput>): Promise<GymPrice> {
    try {
      const { data } = await api.patch(
        `/gym-panel/gyms/${gymId}/prices/${id}/`,
        sanitizePayload(payload, true),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی قیمت'));
    }
  },

  async replace(gymId: number, id: number, payload: GymPriceInput): Promise<GymPrice> {
    try {
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/prices/${id}/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی قیمت'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/prices/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف قیمت'));
    }
  },
};

export default pricesService;
