import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'El email es requerido')
        .email('Email inválido'),
    password: z
        .string()
        .min(1, 'La contraseña es requerida')
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre es demasiado largo'),
    email: z
        .string()
        .min(1, 'El email es requerido')
        .email('Email inválido'),
    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(100, 'La contraseña es demasiado larga'),
    phone: z
        .string()
        .regex(/^[0-9+\s()-]+$/, 'Teléfono inválido')
        .optional()
        .or(z.literal('')),
});

export const changePasswordSchema = z.object({
    current_password: z
        .string()
        .min(1, 'La contraseña actual es requerida'),
    new_password: z
        .string()
        .min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
    new_password_confirmation: z
        .string()
        .min(1, 'Confirma la nueva contraseña'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['new_password_confirmation'],
});

// ============================================
// RESERVATION SCHEMAS
// ============================================

export const reserveClassSchema = z.object({
    classId: z
        .number()
        .int('ID inválido')
        .positive('ID debe ser positivo'),
});

export const cancelReservationSchema = z.object({
    reservation_id: z
        .number()
        .int('ID inválido')
        .positive('ID debe ser positivo'),
});

// ============================================
// CHECK-IN SCHEMAS
// ============================================

export const checkInSchema = z.object({
    user_id: z
        .number()
        .int('ID de usuario inválido')
        .positive('ID debe ser positivo')
        .optional(),
    dni: z
        .string()
        .min(1, 'El DNI es requerido')
        .optional(),
    qr_data: z
        .string()
        .min(1, 'Datos de QR requeridos')
        .optional(),
    discipline_id: z
        .number()
        .int('ID de disciplina inválido')
        .positive('ID debe ser positivo')
        .optional(),

}).refine((data) => data.user_id || data.qr_data || data.dni, {
    message: 'Debes proporcionar user_id, dni o qr_data',
});

export const qrDataSchema = z.object({
    id: z.number().int().positive(),
    t: z.number().int().positive(),
    exp: z.number().int().positive(),
    h: z.string().length(16),
});

export const accessRequestSchema = z.object({
    qr_code: z
        .string()
        .min(1, 'Código QR requerido')
        .startsWith('GYM_ACCESS_POINT_', 'QR inválido'),
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const reportTransferSchema = z.object({
    plan_id: z
        .number()
        .int('ID de plan inválido')
        .positive('ID debe ser positivo'),
    proof_photo: z
        .string()
        .min(1, 'La foto del comprobante es requerida')
        .or(z.instanceof(File)),
});

export const approvePaymentSchema = z.object({
    payment_id: z
        .number()
        .int('ID de pago inválido')
        .positive('ID debe ser positivo'),
    notes: z
        .string()
        .max(500, 'Las notas son demasiado largas')
        .optional(),
});

export const rejectPaymentSchema = z.object({
    payment_id: z
        .number()
        .int('ID de pago inválido')
        .positive('ID debe ser positivo'),
    reason: z
        .string()
        .min(1, 'El motivo de rechazo es requerido')
        .max(500, 'El motivo es demasiado largo'),
});

// ============================================
// PLAN SCHEMAS (ADMIN)
// ============================================

export const createPlanSchema = z.object({
    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .max(100, 'El nombre es demasiado largo'),
    description: z
        .string()
        .max(500, 'La descripción es demasiado larga')
        .optional(),
    price: z
        .number()
        .positive('El precio debe ser mayor a 0'),
    credits: z
        .number()
        .int('Los créditos deben ser un número entero')
        .min(0, 'Los créditos no pueden ser negativos'),
    is_unlimited: z
        .boolean()
        .default(false),
    duration_days: z
        .number()
        .int('La duración debe ser un número entero')
        .positive('La duración debe ser mayor a 0')
        .default(30),
    discipline_id: z
        .number()
        .int('ID de disciplina inválido')
        .positive('ID debe ser positivo'),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
    id: z
        .number()
        .int('ID inválido')
        .positive('ID debe ser positivo'),
});

// ============================================
// CLASS SCHEMAS
// ============================================

export const createClassSchema = z.object({
    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .max(100, 'El nombre es demasiado largo'),
    discipline_id: z
        .number()
        .int('ID de disciplina inválido')
        .positive('ID debe ser positivo'),
    instructor_name: z
        .string()
        .max(100, 'El nombre del instructor es demasiado largo')
        .optional(),
    start_time: z
        .string()
        .datetime('Fecha/hora inválida')
        .or(z.date()),
    end_time: z
        .string()
        .datetime('Fecha/hora inválida')
        .or(z.date()),
    capacity: z
        .number()
        .int('La capacidad debe ser un número entero')
        .positive('La capacidad debe ser mayor a 0')
        .max(100, 'Capacidad máxima de 100 personas'),
    description: z
        .string()
        .max(500, 'La descripción es demasiado larga')
        .optional(),
}).refine((data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
}, {
    message: 'La hora de fin debe ser posterior a la de inicio',
    path: ['end_time'],
});

// ============================================
// PUSH TOKEN SCHEMA
// ============================================

export const pushTokenSchema = z.object({
    push_token: z
        .string()
        .min(1, 'El token es requerido')
        .startsWith('ExponentPushToken[', 'Token de Expo inválido'),
});

// ============================================
// TYPES (inferidos de schemas)
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ReserveClassInput = z.infer<typeof reserveClassSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ReportTransferInput = z.infer<typeof reportTransferSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
