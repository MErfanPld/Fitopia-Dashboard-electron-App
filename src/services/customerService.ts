/**
 * Backward-compatible alias. Prefer membersService.
 * Real OpenAPI path: /api/gym-panel/gyms/{gym_id}/members/
 */
import membersService from './members/membersService';
import type { GymMember, GymMemberInput } from '../types/api';

export const customerService = {
  async listCustomers(gymId: number): Promise<GymMember[]> {
    return membersService.list(gymId);
  },
  async createCustomer(gymId: number, data: GymMemberInput): Promise<GymMember> {
    return membersService.create(gymId, data);
  },
  async getCustomer(gymId: number, customerId: number): Promise<GymMember> {
    return membersService.get(gymId, customerId);
  },
  async updateCustomer(gymId: number, customerId: number, data: GymMemberInput): Promise<GymMember> {
    return membersService.replace(gymId, customerId, data);
  },
  async patchCustomer(gymId: number, customerId: number, data: Partial<GymMemberInput>): Promise<GymMember> {
    return membersService.update(gymId, customerId, data);
  },
  async deleteCustomer(gymId: number, customerId: number): Promise<void> {
    return membersService.remove(gymId, customerId);
  },
};

export default customerService;
