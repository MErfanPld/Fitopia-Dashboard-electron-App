import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymOffering, GymOfferingInput, OfferingSchedule } from '../../types/api';

/**
 * Gym panel offerings — OpenAPI: gym-mgmt-offerings
 * /api/gym-panel/gyms/{gym_id}/offerings/
 */

function normalizeTime(t?: string | null): string {
  if (!t) return '00:00:00';
  let raw = String(t).trim();
  if (raw.includes('T')) raw = raw.split('T')[1] || raw;
  raw = raw.replace('Z', '').split('.')[0];
  const parts = raw.split(':');
  const h = (parts[0] || '0').padStart(2, '0');
  const m = (parts[1] || '0').padStart(2, '0');
  const sec = (parts[2] || '00').padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function sanitizeSchedule(s: OfferingSchedule, includeId = true): Record<string, unknown> {
  const row: Record<string, unknown> = {
    day_of_week: Number(s.day_of_week),
    start_time: normalizeTime(s.start_time),
    end_time: normalizeTime(s.end_time),
  };
  if (includeId && s.id != null) row.id = s.id;
  return row;
}

function toIntOrNull(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sanitizePayload(payload: Partial<GymOfferingInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (!partial || payload.sport !== undefined) {
    body.sport = payload.sport != null && payload.sport !== 0 ? Number(payload.sport) : null;
  }
  if (!partial || payload.description !== undefined) {
    body.description = payload.description != null ? String(payload.description) : '';
  }
  if (!partial || payload.coaches !== undefined) {
    body.coaches = Array.isArray(payload.coaches)
      ? payload.coaches.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];
  }
  if (!partial || payload.capacity !== undefined) {
    body.capacity = toIntOrNull(payload.capacity);
  }
  if (!partial || payload.single_session_price !== undefined) {
    body.single_session_price = toIntOrNull(payload.single_session_price);
  }
  if (!partial || payload.course_price !== undefined) {
    body.course_price = toIntOrNull(payload.course_price);
  }
  if (!partial || payload.monthly_price !== undefined) {
    body.monthly_price = toIntOrNull(payload.monthly_price);
  }
  if (!partial || payload.duration_minutes !== undefined) {
    body.duration_minutes = toIntOrNull(payload.duration_minutes);
  }
  if (!partial || payload.skill_level !== undefined) {
    body.skill_level = payload.skill_level || 'all';
  }
  if (!partial || payload.gender_restriction !== undefined) {
    body.gender_restriction = payload.gender_restriction || 'all';
  }
  if (!partial || payload.min_age !== undefined) {
    body.min_age = toIntOrNull(payload.min_age);
  }
  if (!partial || payload.max_age !== undefined) {
    body.max_age = toIntOrNull(payload.max_age);
  }
  if (!partial || payload.is_active !== undefined) {
    body.is_active = payload.is_active !== false;
  }
  if (!partial || payload.schedules !== undefined) {
    body.schedules = (payload.schedules || []).map((s) => sanitizeSchedule(s, true));
  }

  if (!partial) {
    if (body.sport == null) throw new Error('انتخاب رشته ورزشی الزامی است');
  }

  return body;
}

export const offeringsService = {
  async list(gymId: number): Promise<GymOffering[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/offerings/`);
      return unwrapList<GymOffering>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت خدمات باشگاه'));
    }
  },

  async get(gymId: number, id: number): Promise<GymOffering> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/offerings/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خدمت پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymOfferingInput): Promise<GymOffering> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/offerings/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت خدمت'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<GymOfferingInput>): Promise<GymOffering> {
    try {
      const { data } = await api.patch(
        `/gym-panel/gyms/${gymId}/offerings/${id}/`,
        sanitizePayload(payload, true),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی خدمت'));
    }
  },

  async replace(gymId: number, id: number, payload: GymOfferingInput): Promise<GymOffering> {
    try {
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/offerings/${id}/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی خدمت'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/offerings/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف خدمت'));
    }
  },

  async suggestSport(gymId: number, payload: { name: string; category_id: number }): Promise<unknown> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/suggest-sport/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ارسال پیشنهاد رشته'));
    }
  },
};

export default offeringsService;
