/**
 * Backward-compatible alias. Prefer services/coaches/coachesService.
 * Real path: /api/gym-panel/gyms/{gym_id}/coaches/
 */
import coachesService from './coaches/coachesService';
import type { GymCoach, GymCoachInput } from '../types/api';

export const coachService = {
  list: (gymId: number) => coachesService.list(gymId),
  get: (gymId: number, id: number) => coachesService.get(gymId, id),
  create: (gymId: number, payload: GymCoachInput) => coachesService.create(gymId, payload),
  update: (gymId: number, coachId: number, payload: Partial<GymCoachInput>) =>
    coachesService.update(gymId, coachId, payload),
  replace: (gymId: number, coachId: number, payload: GymCoachInput) =>
    coachesService.replace(gymId, coachId, payload),
  remove: (gymId: number, coachId: number) => coachesService.remove(gymId, coachId),
};

export default coachService;
