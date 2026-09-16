import api, { tokenStorage, getErrorMessage } from '../apiClient';
import type { AuthUser, GymAccess, LoginResponse } from '../../types/api';

const GYMS_KEY = 'fitopia_gym_access';
const CURRENT_GYM_KEY = 'fitopia_current_gym';
const USER_KEY = 'fitopia_user';

function isJwt(token: string): boolean {
  return token.split('.').length === 3 && token.length > 20;
}

export const authService = {
  async login(username: string, password: string) {
    try {
      const { data } = await api.post<LoginResponse>('/gym-panel/auth/login/', {
        username: username.trim(),
        password,
      });
      const access = data?.tokens?.access;
      const refresh = data?.tokens?.refresh;
      if (!access || !isJwt(access)) throw new Error('پاسخ سرور فاقد توکن معتبر است.');
      const gyms: GymAccess[] = Array.isArray(data.gyms) ? data.gyms : [];
      const user = data.user || ({} as AuthUser);
      tokenStorage.setTokens(access, refresh);
      localStorage.setItem(GYMS_KEY, JSON.stringify(gyms));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (gyms.length > 0) localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gyms[0]));
      else localStorage.removeItem(CURRENT_GYM_KEY);
      return { access, refresh: refresh || '', user, gyms };
    } catch (e) {
      throw new Error(getErrorMessage(e, 'نام کاربری یا رمز عبور اشتباه است.'));
    }
  },
  logout() {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
  },
  getStoredSession() {
    const access = tokenStorage.getAccess();
    let gyms: GymAccess[] = [];
    let currentGym: GymAccess | null = null;
    let user: AuthUser | null = null;
    try { const g = localStorage.getItem(GYMS_KEY); if (g) gyms = JSON.parse(g); } catch { /* */ }
    try { const c = localStorage.getItem(CURRENT_GYM_KEY); if (c) currentGym = JSON.parse(c); } catch { /* */ }
    try { const u = localStorage.getItem(USER_KEY); if (u) user = JSON.parse(u); } catch { /* */ }
    if (currentGym && gyms.length) {
      const still = gyms.find((g) => g.gym === currentGym!.gym);
      if (!still) currentGym = gyms[0];
    } else if (!currentGym && gyms.length) currentGym = gyms[0];
    return { access, gyms, currentGym, user };
  },
  persistCurrentGym(gym: GymAccess) {
    localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gym));
  },
  /**
   * Create a Fitopia user account (OpenAPI: POST /accounts/register/).
   * Used when onboarding a new employee so StaffAccess.user points to a real User.
   */
  async registerUser(payload: {
    phone_number?: string;
    username?: string;
    full_name?: string;
    password: string;
  }): Promise<{ id: number; username?: string; phone_number?: string; full_name?: string }> {
    try {
      const body: Record<string, string> = { password: payload.password };
      if (payload.phone_number?.trim()) body.phone_number = payload.phone_number.trim();
      if (payload.username?.trim()) body.username = payload.username.trim();
      if (payload.full_name?.trim()) body.full_name = payload.full_name.trim();
      const { data } = await api.post('/accounts/register/', body);
      const id =
        Number(data?.id) ||
        Number(data?.user?.id) ||
        Number(data?.pk) ||
        Number(data?.user_id);
      if (!id || Number.isNaN(id)) {
        throw new Error('ثبت کاربر انجام شد اما شناسه کاربر از پاسخ سرور دریافت نشد.');
      }
      return {
        id,
        username: data?.username ?? data?.user?.username,
        phone_number: data?.phone_number ?? data?.user?.phone_number ?? data?.phone,
        full_name: data?.full_name ?? data?.user?.full_name,
      };
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ایجاد حساب کاربری کارمند'));
    }
  },
  async fetchMyGyms() {
    const { data } = await api.get('/gym-panel/gyms/');
    const list: GymAccess[] = Array.isArray(data) ? data : [];
    localStorage.setItem(GYMS_KEY, JSON.stringify(list));
    return list;
  },
};
export default authService;
