import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { Sport, SportCategory } from '../../types/api';

function mapCategory(raw: unknown): SportCategory | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!id || Number.isNaN(id)) return null;
  const title = String(o.title ?? o.name ?? '').trim();
  return {
    id,
    title: title || undefined,
    name: title || `دسته ${id}`,
    slug: o.slug ? String(o.slug) : undefined,
  };
}

function mapSport(raw: unknown): Sport | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!id || Number.isNaN(id)) return null;
  const name = String(o.name ?? o.title ?? '').trim();
  return {
    id,
    name: name || `رشته ${id}`,
    category: o.category != null ? Number(o.category) : null,
    category_name: o.category_name ? String(o.category_name) : undefined,
  };
}

/** Public catalog endpoints: /api/gym/categories/, /api/gym/sports/ */
export const sportsService = {
  async listCategories(): Promise<SportCategory[]> {
    try {
      const { data } = await api.get('/gym/categories/');
      return unwrapList<unknown>(data).map(mapCategory).filter(Boolean) as SportCategory[];
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت دسته‌بندی‌ها'));
    }
  },

  async listSports(): Promise<Sport[]> {
    try {
      const { data } = await api.get('/gym/sports/');
      return unwrapList<unknown>(data).map(mapSport).filter(Boolean) as Sport[];
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت رشته‌های ورزشی'));
    }
  },
};

export default sportsService;
