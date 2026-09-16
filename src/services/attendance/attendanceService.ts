import api, { unwrapList, getErrorMessage } from '../apiClient';
import type {
  AttendanceStats,
  GymVisit,
  AttendanceCheckInInput,
} from '../../types/api';

function normalizeStats(raw: unknown): AttendanceStats {
  if (!raw || typeof raw !== 'object') {
    return { today_visits: 0, currently_inside: 0, month_visits: 0, total_visits: 0 };
  }
  const o = raw as Record<string, unknown>;
  const num = (...keys: string[]) => {
    for (const k of keys) {
      if (o[k] != null && Number.isFinite(Number(o[k]))) return Number(o[k]);
    }
    return 0;
  };
  return {
    today_visits: num('today_visits', 'today', 'visits_today'),
    currently_inside: num('currently_inside', 'inside', 'open_visits', 'present'),
    month_visits: num('month_visits', 'this_month', 'monthly_visits'),
    total_visits: num('total_visits', 'total', 'all_visits'),
  };
}

/**
 * Backend CheckInSerializer (Fitopia-API):
 *   customer_id: int (required)
 *   method: qr|token|manual|membership (default manual)
 *   sport_id: int optional
 */
function sanitizeCheckIn(payload: AttendanceCheckInInput): Record<string, unknown> {
  const customerId =
    payload.customer_id != null && Number(payload.customer_id) > 0
      ? Number(payload.customer_id)
      : payload.customer != null && Number(payload.customer) > 0
        ? Number(payload.customer)
        : null;

  if (!customerId) {
    throw new Error('انتخاب عضو الزامی است');
  }

  const body: Record<string, unknown> = {
    customer_id: customerId,
    method: payload.method || 'manual',
  };

  const sportId =
    payload.sport_id != null && Number(payload.sport_id) > 0
      ? Number(payload.sport_id)
      : payload.sport != null && Number(payload.sport) > 0
        ? Number(payload.sport)
        : null;

  if (sportId) {
    body.sport_id = sportId;
  }

  return body;
}

export const attendanceService = {
  async list(
    gymId: number,
    params?: { date?: string; is_open?: boolean },
  ): Promise<GymVisit[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/`, { params });
      return unwrapList<GymVisit>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت لیست حضور'));
    }
  },

  async stats(gymId: number): Promise<AttendanceStats> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/stats/`);
      return normalizeStats(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت آمار حضور'));
    }
  },

  async checkIn(gymId: number, payload: AttendanceCheckInInput): Promise<GymVisit | unknown> {
    try {
      const { data } = await api.post(
        `/gym-panel/gyms/${gymId}/attendance/check-in/`,
        sanitizeCheckIn(payload),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت ورود'));
    }
  },

  /** Backend CheckOutSerializer: { visit_id: int } */
  async checkOut(gymId: number, visitId: number): Promise<GymVisit | unknown> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/attendance/check-out/`, {
        visit_id: visitId,
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت خروج'));
    }
  },
};

export default attendanceService;
