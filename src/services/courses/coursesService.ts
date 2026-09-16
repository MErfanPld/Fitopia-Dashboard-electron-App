import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { Course, CourseInput, CourseEnrollInput } from '../../types/api';

function normalizeTime(t?: string | null): string | null {
  if (!t) return null;
  let raw = String(t).trim();
  if (raw.includes('T')) raw = raw.split('T')[1] || raw;
  raw = raw.replace('Z', '').split('.')[0];
  const parts = raw.split(':');
  const h = (parts[0] || '0').padStart(2, '0');
  const m = (parts[1] || '0').padStart(2, '0');
  const sec = (parts[2] || '00').padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function toIntOrNull(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sanitizePayload(payload: Partial<CourseInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (!partial || payload.title !== undefined) {
    body.title = String(payload.title ?? '').trim();
  }
  if (!partial || payload.description !== undefined) {
    body.description = payload.description != null ? String(payload.description) : '';
  }
  if (!partial || payload.sport !== undefined) {
    body.sport = payload.sport != null && Number(payload.sport) > 0 ? Number(payload.sport) : null;
  }
  if (!partial || payload.offering !== undefined) {
    body.offering = payload.offering != null && Number(payload.offering) > 0 ? Number(payload.offering) : null;
  }
  if (!partial || payload.coach !== undefined) {
    body.coach = payload.coach != null && Number(payload.coach) > 0 ? Number(payload.coach) : null;
  }
  if (!partial || payload.start_date !== undefined) {
    body.start_date = payload.start_date || null;
  }
  if (!partial || payload.end_date !== undefined) {
    body.end_date = payload.end_date || null;
  }
  if (!partial || payload.start_time !== undefined) {
    body.start_time = normalizeTime(payload.start_time);
  }
  if (!partial || payload.end_time !== undefined) {
    body.end_time = normalizeTime(payload.end_time);
  }
  if (!partial || payload.days_of_week !== undefined) {
    body.days_of_week = payload.days_of_week != null ? String(payload.days_of_week) : '';
  }
  if (!partial || payload.capacity !== undefined) {
    body.capacity = toIntOrNull(payload.capacity);
  }
  if (!partial || payload.price !== undefined) {
    body.price = toIntOrNull(payload.price);
  }
  if (!partial || payload.status !== undefined) {
    body.status = payload.status || 'draft';
  }
  if (!partial || payload.is_active !== undefined) {
    body.is_active = payload.is_active !== false;
  }

  if (!partial) {
    if (!body.title) throw new Error('عنوان دوره الزامی است');
  }

  return body;
}

export const coursesService = {
  async list(gymId: number): Promise<Course[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/courses/`);
      return unwrapList<Course>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت دوره‌ها'));
    }
  },

  async get(gymId: number, id: number): Promise<Course> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/courses/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'دوره پیدا نشد'));
    }
  },

  async create(gymId: number, payload: CourseInput): Promise<Course> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/courses/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت دوره'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<CourseInput>): Promise<Course> {
    try {
      const { data } = await api.patch(
        `/gym-panel/gyms/${gymId}/courses/${id}/`,
        sanitizePayload(payload, true),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی دوره'));
    }
  },

  async replace(gymId: number, id: number, payload: CourseInput): Promise<Course> {
    try {
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/courses/${id}/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی دوره'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/courses/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف دوره'));
    }
  },

  async enroll(gymId: number, courseId: number, payload: CourseEnrollInput): Promise<unknown> {
    try {
      const body: Record<string, unknown> = { customer: Number(payload.customer) };
      if (payload.price_paid != null) body.price_paid = Number(payload.price_paid);
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/courses/${courseId}/enroll/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت‌نام در دوره'));
    }
  },
};

export default coursesService;
