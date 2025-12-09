import { UserRole, MembershipStatus, ReservationStatus, PaymentStatus } from '@prisma/client';

// ============================================
// USER TYPES
// ============================================

export interface User {
    id: number;
    name: string;
    email: string;
    rol: UserRole;
    phone?: string;
    profilePhoto?: string;
    isActive: boolean;
}

export interface AuthUser extends User {
    access_token: string;
    token_type: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

// ============================================
// MEMBERSHIP TYPES
// ============================================

export interface Membership {
    id: number;
    discipline: string;
    discipline_id: number;
    total_credits: number;
    remaining_credits: number;
    is_unlimited: boolean;
    start_date: string;
    expiration_date: string;
    days_remaining: number;
    status: MembershipStatus;
}

// ============================================
// CLASS & RESERVATION TYPES
// ============================================

export interface Class {
    id: number;
    name: string;
    discipline_id: number;
    discipline_name: string;
    instructor_name?: string;
    start_time: string;
    end_time: string;
    capacity: number;
    enrolled: number;
    available_spots: number;
    is_full: boolean;
}

export interface Reservation {
    id: number;
    class_name: string;
    discipline_name: string;
    discipline_id: number;
    start_time: string;
    end_time: string;
    status: ReservationStatus;
    attended: boolean;
}

export interface ReservationHistory extends Reservation {
    cancelled_at?: string;
}

// ============================================
// CHECK-IN TYPES
// ============================================

export interface CheckInRequest {
    user_id?: number;
    qr_data?: string;
    discipline_id: number;
}

export interface CheckInResponse {
    status: 'success' | 'error';
    message: string;
    data?: {
        discipline: string;
        remaining_credits: number;
        photo_url?: string;
        type: 'reservation' | 'direct_access';
    };
}

export interface QRData {
    id: number;
    t: number;  // timestamp
    exp: number; // expiration
    h: string;   // hash
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface Payment {
    id: number;
    user_name: string;
    plan_name: string;
    amount: number;
    method: string;
    status: PaymentStatus;
    proof_photo?: string;
    created_at: string;
    approved_at?: string;
    rejected_at?: string;
}

export interface BankInfo {
    cbu: string;
    alias: string;
    cuit: string;
    bankName: string;
    accountHolder: string;
}

// ============================================
// PLAN TYPES
// ============================================

export interface Plan {
    id: number;
    name: string;
    description?: string;
    price: number;
    credits: number;
    is_unlimited: boolean;
    duration_days: number;
    discipline_id: number;
    discipline_name: string;
    isActive: boolean;
}

// ============================================
// STATS TYPES
// ============================================

export interface DailyStats {
    total_check_ins: number;
    active_members: number;
    pending_payments: number;
    revenue_today: number;
    classes_today: number;
}

export interface AccessLog {
    id: number;
    user_name: string;
    granted: boolean;
    reason: string;
    discipline_name?: string;
    timestamp: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
    status?: 'success' | 'error' | 'warning';
    message?: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    last_page: number;
}

// ============================================
// ERROR TYPES
// ============================================

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    required_role?: UserRole;
    current_role?: UserRole;
}
