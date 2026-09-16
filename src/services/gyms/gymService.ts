import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymAccess, GymUpdatePayload, GymChangeRequest } from '../../types/api';

/** Public/panel gym detail used to prefill settings */
export interface GymDetail {
  id: number;
  name?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  website?: string | null;
  working_hours?: string | null;
  rules?: string | null;
  cover_image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function asUriOrOmit(v?: string | null): string | undefined {
  const s = (v ?? '').trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s) || s.startsWith('tg://')) return s;
  if (s.startsWith('@')) return `https://t.me/${s.slice(1)}`;
  if (!s.includes('://') && s.includes('.')) return `https://${s}`;
  return s;
}

function sanitizeUpdate(payload: GymUpdatePayload): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.description !== undefined) body.description = payload.description ?? '';
  if (payload.phone !== undefined) body.phone = (payload.phone ?? '').trim();
  if (payload.whatsapp !== undefined) body.whatsapp = (payload.whatsapp ?? '').trim();
  if (payload.rules !== undefined) body.rules = payload.rules ?? '';
  if (payload.working_hours !== undefined) body.working_hours = (payload.working_hours ?? '').trim();

  const telegram = asUriOrOmit(payload.telegram);
  if (telegram !== undefined) body.telegram = telegram;
  const instagram = asUriOrOmit(payload.instagram);
  if (instagram !== undefined) body.instagram = instagram;
  const website = asUriOrOmit(payload.website);
  if (website !== undefined) body.website = website;

  return body;
}

export const gymService = {
  async listMine(): Promise<GymAccess[]> {
    const { data } = await api.get('/gym-panel/gyms/');
    return unwrapList<GymAccess>(data).map((g) => ({
      id: g.id,
      gym: g.gym,
      gym_name: g.gym_name,
      gym_address: (g as GymAccess).gym_address,
      role: g.role,
    }));
  },

  async getDetail(gymId: number): Promise<GymDetail> {
    try {
      const { data } = await api.get(`/gym/${gymId}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت اطلاعات باشگاه'));
    }
  },

  async update(gymId: number, payload: GymUpdatePayload): Promise<unknown> {
    try {
      const body = sanitizeUpdate(payload);
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/update/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ذخیره اطلاعات باشگاه'));
    }
  },

  async listChangeRequests(gymId: number): Promise<GymChangeRequest[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/change-requests/list/`);
      return unwrapList<GymChangeRequest>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت تیکت‌ها'));
    }
  },

  async createChangeRequest(gymId: number, payload: Record<string, unknown>): Promise<unknown> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/change-requests/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت درخواست'));
    }
  },
};

export default gymService;
