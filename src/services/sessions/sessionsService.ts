import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { SingleSession, SingleSessionInput } from '../../types/api';

function sanitizeCreate(payload: SingleSessionInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    customer: Number(payload.customer),
    price: Math.max(0, Math.floor(Number(payload.price) || 0)),
  };
  if (payload.sport != null && Number(payload.sport) > 0) {
    body.sport = Number(payload.sport);
  }
  if (payload.status) {
    body.status = payload.status;
  }
  if (payload.expires_at) {
    body.expires_at = payload.expires_at;
  }
  if (!body.customer || Number(body.customer) <= 0) {
    throw new Error('انتخاب عضو الزامی است');
  }
  return body;
}

export const sessionsService = {
  async list(gymId: number): Promise<SingleSession[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/single-sessions/`);
      return unwrapList<SingleSession>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت جلسات تکی'));
    }
  },

  async create(gymId: number, payload: SingleSessionInput): Promise<SingleSession> {
    try {
      const { data } = await api.post(
        `/gym-panel/gyms/${gymId}/single-sessions/`,
        sanitizeCreate(payload),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت جلسه تکی'));
    }
  },
};

export default sessionsService;
