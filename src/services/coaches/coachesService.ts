import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymCoach, GymCoachInput } from '../../types/api';

/**
 * Gym panel coaches API — OpenAPI contract:
 * /api/gym-panel/gyms/{gym_id}/coaches/
 * Fields: full_name, image, specialty, sports[]
 * Image: multipart File preferred; string URL allowed in JSON body.
 */
function appendCoachFormData(payload: Partial<GymCoachInput>): FormData {
  const fd = new FormData();
  if (payload.full_name !== undefined) {
    fd.append('full_name', String(payload.full_name).trim());
  }
  if (payload.specialty !== undefined) {
    fd.append('specialty', String(payload.specialty ?? '').trim());
  }
  if (payload.sports !== undefined) {
    (payload.sports || []).forEach((id) => fd.append('sports', String(id)));
  }
  if (payload.image instanceof File) {
    fd.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image) {
    fd.append('image', payload.image);
  }
  return fd;
}

function toJsonBody(payload: Partial<GymCoachInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.full_name !== undefined) {
    body.full_name = String(payload.full_name).trim();
  }
  if (payload.specialty !== undefined) {
    body.specialty = String(payload.specialty ?? '').trim();
  }
  if (payload.sports !== undefined) {
    body.sports = payload.sports || [];
  }
  // API schema: image is string (URI). Only send string URLs in JSON.
  if (typeof payload.image === 'string') {
    body.image = payload.image;
  }
  return body;
}

function shouldUseMultipart(payload: Partial<GymCoachInput>): boolean {
  return payload.image instanceof File;
}

export const coachesService = {
  async list(gymId: number): Promise<GymCoach[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/coaches/`);
      return unwrapList<GymCoach>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'دریافت اطلاعات مربیان با خطا مواجه شد'));
    }
  },

  async get(gymId: number, id: number): Promise<GymCoach> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/coaches/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'مربی پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymCoachInput): Promise<GymCoach> {
    try {
      const name = String(payload.full_name ?? '').trim();
      if (!name) throw new Error('نام و نام خانوادگی الزامی است');

      if (shouldUseMultipart(payload)) {
        const { data } = await api.post(
          `/gym-panel/gyms/${gymId}/coaches/`,
          appendCoachFormData(payload),
        );
        return data;
      }
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, toJsonBody(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت مربی'));
    }
  },

  /** Partial update (PATCH) */
  async update(gymId: number, id: number, payload: Partial<GymCoachInput>): Promise<GymCoach> {
    try {
      if (shouldUseMultipart(payload)) {
        const { data } = await api.patch(
          `/gym-panel/gyms/${gymId}/coaches/${id}/`,
          appendCoachFormData(payload),
        );
        return data;
      }
      const { data } = await api.patch(
        `/gym-panel/gyms/${gymId}/coaches/${id}/`,
        toJsonBody(payload),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی مربی'));
    }
  },

  /** Full replace (PUT) */
  async replace(gymId: number, id: number, payload: GymCoachInput): Promise<GymCoach> {
    try {
      if (shouldUseMultipart(payload)) {
        const { data } = await api.put(
          `/gym-panel/gyms/${gymId}/coaches/${id}/`,
          appendCoachFormData(payload),
        );
        return data;
      }
      const { data } = await api.put(
        `/gym-panel/gyms/${gymId}/coaches/${id}/`,
        toJsonBody(payload),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی مربی'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/coaches/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف مربی'));
    }
  },
};

export default coachesService;
