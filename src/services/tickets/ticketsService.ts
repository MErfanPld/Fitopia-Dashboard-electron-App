import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymChangeRequest, TicketMessage } from '../../types/api';

/** Create field-edit ticket body (OpenAPI FieldEditRequest) */
export interface FieldEditRequest {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SuggestSportRequest {
  name: string;
  category_id: number;
}

/**
 * Tickets / change-requests
 * List:   GET  /gym-panel/gyms/{id}/change-requests/list/
 * Create field edit: POST /gym-panel/gyms/{id}/change-requests/
 * Suggest sport:     POST /gym-panel/gyms/{id}/suggest-sport/
 * Detail: GET  /gym-panel/gyms/{id}/tickets/{id}/
 * Reply:  POST /gym-panel/gyms/{id}/tickets/{ticket_id}/messages/
 *
 * No DELETE endpoint in OpenAPI for tickets.
 */
export const ticketsService = {
  async list(gymId: number): Promise<GymChangeRequest[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/change-requests/list/`);
      return unwrapList<GymChangeRequest>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت تیکت‌ها'));
    }
  },

  async get(gymId: number, id: number): Promise<GymChangeRequest> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/tickets/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'تیکت پیدا نشد'));
    }
  },

  async createFieldEdit(gymId: number, payload: FieldEditRequest): Promise<GymChangeRequest> {
    try {
      const body: Record<string, unknown> = {};
      if (payload.name?.trim()) body.name = payload.name.trim();
      if (payload.address?.trim()) body.address = payload.address.trim();
      if (payload.latitude != null && payload.latitude !== ('' as unknown)) {
        body.latitude = Number(payload.latitude);
      }
      if (payload.longitude != null && payload.longitude !== ('' as unknown)) {
        body.longitude = Number(payload.longitude);
      }
      if (!Object.keys(body).length) {
        throw new Error('حداقل یکی از فیلدهای نام، آدرس یا موقعیت را پر کنید');
      }
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/change-requests/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت درخواست'));
    }
  },

  async suggestSport(gymId: number, payload: SuggestSportRequest): Promise<GymChangeRequest> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/suggest-sport/`, {
        name: payload.name.trim(),
        category_id: Number(payload.category_id),
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ارسال پیشنهاد رشته'));
    }
  },

  async reply(gymId: number, ticketId: number, message: string): Promise<TicketMessage> {
    try {
      const text = message.trim();
      if (!text) throw new Error('متن پیام خالی است');
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/tickets/${ticketId}/messages/`, {
        message: text,
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ارسال پیام'));
    }
  },
};

export default ticketsService;
