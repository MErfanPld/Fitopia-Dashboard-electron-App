import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymMember, GymMemberInput } from '../../types/api';

/**
 * Gym panel members API (OpenAPI: gym-mgmt-customers).
 * Base: /api/gym-panel/gyms/{gym_id}/members/
 */
export const membersService = {
  async list(gymId: number): Promise<GymMember[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/members/`);
      return unwrapList<GymMember>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت اعضای باشگاه'));
    }
  },

  async get(gymId: number, id: number): Promise<GymMember> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/members/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'عضو پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.post(
        `/gym-panel/gyms/${gymId}/members/`,
        toRequestBody(body, payload.photo),
        payload.photo instanceof File ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت عضو'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<GymMemberInput>): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload as GymMemberInput, true);
      const { data } = await api.patch(
        `/gym-panel/gyms/${gymId}/members/${id}/`,
        toRequestBody(body, payload.photo),
        payload.photo instanceof File ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی عضو'));
    }
  },

  async replace(gymId: number, id: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/members/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی عضو'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/members/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف عضو'));
    }
  },
};

function normalizePhone(raw: string): string {
  let phone = String(raw ?? '').trim().replace(/\s+/g, '').replace(/[-()]/g, '');
  if (phone.startsWith('+98')) phone = '0' + phone.slice(3);
  if (phone.startsWith('98') && phone.length === 12) phone = '0' + phone.slice(2);
  if (/^9\d{9}$/.test(phone)) phone = '0' + phone;
  return phone;
}

function sanitizePayload(payload: Partial<GymMemberInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (!partial || payload.full_name !== undefined) {
    body.full_name = String(payload.full_name ?? '').trim();
  }
  if (!partial || payload.phone !== undefined) {
    body.phone = normalizePhone(String(payload.phone ?? ''));
  }
  if (!partial || payload.join_date !== undefined) {
    if (payload.join_date) body.join_date = String(payload.join_date);
  }

  if (payload.sport != null && payload.sport !== 0) {
    body.sport = payload.sport;
  } else if (partial && payload.sport === null) {
    body.sport = null;
  }

  if (payload.coach != null && payload.coach !== 0) {
    body.coach = payload.coach;
  } else if (partial && payload.coach === null) {
    body.coach = null;
  }

  if (payload.fitopia_user != null) {
    body.fitopia_user = payload.fitopia_user;
  }

  if (payload.source) body.source = payload.source;
  else if (!partial) body.source = 'manual';

  if (!partial || payload.sessions_total !== undefined) {
    if (payload.sessions_total != null) body.sessions_total = Number(payload.sessions_total);
  }
  if (!partial || payload.sessions_remaining !== undefined) {
    if (payload.sessions_remaining != null) body.sessions_remaining = Number(payload.sessions_remaining);
  }
  if (!partial || payload.sessions_used !== undefined) {
    body.sessions_used = payload.sessions_used != null ? Number(payload.sessions_used) : 0;
  } else if (!partial) {
    body.sessions_used = 0;
  }

  if (!partial || payload.price_paid !== undefined) {
    if (payload.price_paid != null) body.price_paid = Number(payload.price_paid);
  }

  if (typeof payload.photo === 'string' && payload.photo) {
    body.photo = payload.photo;
  }

  if (payload.membership_status) body.membership_status = payload.membership_status;
  else if (!partial) body.membership_status = 'active';

  if (payload.membership_type) body.membership_type = payload.membership_type;

  if (payload.membership_start) body.membership_start = payload.membership_start;
  if (payload.membership_end) body.membership_end = payload.membership_end;

  if (!partial || payload.notes !== undefined) {
    body.notes = payload.notes != null ? String(payload.notes) : '';
  }

  if (!partial || payload.is_active !== undefined) {
    body.is_active = payload.is_active !== false;
  }

  if (!partial) {
    if (!body.full_name) throw new Error('نام و نام خانوادگی الزامی است');
    if (!body.phone) throw new Error('شماره موبایل الزامی است');
    if (!body.join_date) throw new Error('تاریخ عضویت الزامی است');
  }

  return body;
}

function toRequestBody(body: Record<string, unknown>, photo?: string | File | null): Record<string, unknown> | FormData {
  if (!(photo instanceof File)) return body;
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'boolean' || typeof v === 'number') fd.append(k, String(v));
    else fd.append(k, String(v));
  });
  fd.append('photo', photo);
  return fd;
}

export default membersService;
