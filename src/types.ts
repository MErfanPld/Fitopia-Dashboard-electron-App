export interface GymStaffAccess {
  id: number;
  gym: number;
  gym_name: string;
  gym_address?: string;
  role: 'owner' | 'staff' | string;
}

export type UserRole = 'admin' | 'manager' | 'coach' | 'member' | 'support';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  joinDate: string;
  gymName?: string;
  gymId?: string;
}

export type GymStatus = 'active' | 'pending' | 'suspended';
export type PlanTier = 'bronze' | 'silver' | 'gold' | 'enterprise';

export interface Gym {
  id: string;
  name: string;
  ownerName: string;
  ownerId: string;
  location: string;
  city: string;
  memberCount: number;
  capacity: number;
  status: GymStatus;
  planTier: PlanTier;
  monthlyFee: number;
  classesCount: number;
  coachesCount: number;
  phone: string;
  registrationDate: string;
}

export interface GymClass {
  id: string;
  title: string;
  coachName: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  gymId: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: 'user' | 'support';
  avatar?: string;
  message: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  submittedBy: string;
  userEmail: string;
  userRole: string;
  gymName?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  date: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'zarinpal' | 'bank_transfer' | 'pos' | 'card_to_card';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceNumber: string;
  memberName: string;
  userEmail: string;
  gymName: string;
  amount: number; // in Toman
  date: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  items: InvoiceItem[];
  tax: number;
  discount: number;
  finalAmount: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  type: 'user' | 'gym' | 'ticket' | 'payment' | 'system';
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardStats {
  activeMembers: number;
  activeMembersChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  openTickets: number;
  openTicketsChange: number;
  todayCheckIns: number;
  todayCheckInsChange: number;
}
