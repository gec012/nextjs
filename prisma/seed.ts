import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed...');

    // Limpiar base de datos (cuidado en producción!)
    await prisma.accessLog.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.class.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.discipline.deleteMany();
    await prisma.user.deleteMany();
    await prisma.bankInfo.deleteMany();

    console.log('✅ Base de datos limpiada');

    // ============================================
    // 1. CREAR DISCIPLINAS
    // ============================================
    const musculacion = await prisma.discipline.create({
        data: {
            name: 'Musculación',
            description: 'Entrenamiento con pesas y máquinas',
            requiresReservation: false,
            color: '#3B82F6',
            icon: 'dumbbell',
        },
    });

    const crossfit = await prisma.discipline.create({
        data: {
            name: 'CrossFit',
            description: 'Entrenamiento funcional de alta intensidad',
            requiresReservation: true,
            color: '#EF4444',
            icon: 'flame',
        },
    });

    const yoga = await prisma.discipline.create({
        data: {
            name: 'Yoga',
            description: 'Equilibrio, flexibilidad y relajación',
            requiresReservation: true,
            color: '#10B981',
            icon: 'flower',
        },
    });

    const spinning = await prisma.discipline.create({
        data: {
            name: 'Spinning',
            description: 'Ciclismo indoor al ritmo de la música',
            requiresReservation: true,
            color: '#F59E0B',
            icon: 'bike',
        },
    });

    console.log('✅ Disciplinas creadas');

    // ============================================
    // 2. CREAR PLANES
    // ============================================
    const planMusculacion12 = await prisma.plan.create({
        data: {
            name: 'Pack Musculación 12',
            description: '12 clases mensuales de musculación',
            price: 25000,
            credits: 12,
            isUnlimited: false,
            durationDays: 30,
            disciplineId: musculacion.id,
        },
    });

    const planMusculacionIlimitado = await prisma.plan.create({
        data: {
            name: 'Musculación Ilimitado',
            description: 'Acceso ilimitado a musculación',
            price: 35000,
            credits: 0,
            isUnlimited: true,
            durationDays: 30,
            disciplineId: musculacion.id,
        },
    });

    const planCrossfit16 = await prisma.plan.create({
        data: {
            name: 'Pack Crossfit 16',
            description: '16 clases mensuales de CrossFit',
            price: 32000,
            credits: 16,
            isUnlimited: false,
            durationDays: 30,
            disciplineId: crossfit.id,
        },
    });

    const planYoga8 = await prisma.plan.create({
        data: {
            name: 'Pack Yoga 8',
            description: '8 clases mensuales de Yoga',
            price: 18000,
            credits: 8,
            isUnlimited: false,
            durationDays: 30,
            disciplineId: yoga.id,
        },
    });

    const planSpinning12 = await prisma.plan.create({
        data: {
            name: 'Pack Spinning 12',
            description: '12 clases mensuales de Spinning',
            price: 22000,
            credits: 12,
            isUnlimited: false,
            durationDays: 30,
            disciplineId: spinning.id,
        },
    });

    console.log('✅ Planes creados');

    // ============================================
    // 3. CREAR USUARIOS
    // ============================================
    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Gastón Admin',
            email: 'admin@gym.com',
            password: hashedPassword,
            rol: 'ADMIN',
            phone: '+54 9 11 1234-5678',
        },
    });

    const recepcionista = await prisma.user.create({
        data: {
            name: 'María Recepcionista',
            email: 'recepcion@gym.com',
            password: hashedPassword,
            rol: 'RECEPCIONISTA',
            phone: '+54 9 11 2345-6789',
        },
    });

    const cliente1 = await prisma.user.create({
        data: {
            name: 'Juan Cliente',
            email: 'cliente@gym.com',
            password: hashedPassword,
            rol: 'CLIENTE',
            phone: '+54 9 11 3456-7890',
        },
    });

    const cliente2 = await prisma.user.create({
        data: {
            name: 'Ana García',
            email: 'ana@example.com',
            password: hashedPassword,
            rol: 'CLIENTE',
            phone: '+54 9 11 4567-8901',
        },
    });

    const cliente3 = await prisma.user.create({
        data: {
            name: 'Carlos López',
            email: 'carlos@example.com',
            password: hashedPassword,
            rol: 'CLIENTE',
            phone: '+54 9 11 5678-9012',
        },
    });

    console.log('✅ Usuarios creados');

    // ============================================
    // 4. CREAR MEMBRESÍAS
    // ============================================
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Cliente 1: Musculación ilimitada + CrossFit
    await prisma.membership.create({
        data: {
            userId: cliente1.id,
            planId: planMusculacionIlimitado.id,
            disciplineId: musculacion.id,
            totalCredits: 0,
            remainingCredits: 0,
            isUnlimited: true,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    await prisma.membership.create({
        data: {
            userId: cliente1.id,
            planId: planCrossfit16.id,
            disciplineId: crossfit.id,
            totalCredits: 16,
            remainingCredits: 16,
            isUnlimited: false,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    // Cliente 2: Musculación 12 + Yoga 8
    await prisma.membership.create({
        data: {
            userId: cliente2.id,
            planId: planMusculacion12.id,
            disciplineId: musculacion.id,
            totalCredits: 12,
            remainingCredits: 10,
            isUnlimited: false,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    await prisma.membership.create({
        data: {
            userId: cliente2.id,
            planId: planYoga8.id,
            disciplineId: yoga.id,
            totalCredits: 8,
            remainingCredits: 8,
            isUnlimited: false,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    // Cliente 3: Spinning
    await prisma.membership.create({
        data: {
            userId: cliente3.id,
            planId: planSpinning12.id,
            disciplineId: spinning.id,
            totalCredits: 12,
            remainingCredits: 12,
            isUnlimited: false,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    console.log('✅ Membresías creadas');

    // ============================================
    // 5. CREAR CLASES
    // ============================================
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const tomorrow19 = new Date(tomorrow);
    tomorrow19.setHours(19, 0, 0, 0);

    await prisma.class.create({
        data: {
            name: 'CrossFit WOD',
            disciplineId: crossfit.id,
            instructorName: 'Coach Mike',
            startTime: tomorrow,
            endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
            capacity: 15,
            description: 'Entrenamiento del día',
        },
    });

    await prisma.class.create({
        data: {
            name: 'Yoga Flow',
            disciplineId: yoga.id,
            instructorName: 'Laura',
            startTime: tomorrow,
            endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
            capacity: 20,
            description: 'Flujo suave para todos los niveles',
        },
    });

    await prisma.class.create({
        data: {
            name: 'Spinning Power',
            disciplineId: spinning.id,
            instructorName: 'Roberto',
            startTime: tomorrow19,
            endTime: new Date(tomorrow19.getTime() + 45 * 60 * 1000),
            capacity: 25,
            description: 'Sesión de alta intensidad',
        },
    });

    console.log('✅ Clases creadas');

    // ============================================
    // 6. CREAR INFORMACIÓN BANCARIA
    // ============================================
    await prisma.bankInfo.create({
        data: {
            cbu: '0170099520000012345678',
            alias: 'GYM.PAGO.AR',
            cuit: '20-12345678-9',
            bankName: 'Banco Galicia',
            accountHolder: 'Mi Gimnasio S.A.',
        },
    });

    console.log('✅ Información bancaria creada');

    // ============================================
    // 7. CREAR CONFIGURACIÓN DEL SISTEMA
    // ============================================
    await prisma.systemConfig.createMany({
        data: [
            {
                key: 'gym_name',
                value: 'Mi Gimnasio',
                description: 'Nombre del gimnasio',
            },
            {
                key: 'qr_expiration_minutes',
                value: '30',
                description: 'Minutos de validez del QR',
            },
            {
                key: 'cancellation_hours',
                value: '3',
                description: 'Horas mínimas para cancelar con reembolso',
            },
        ],
    });

    console.log('✅ Configuración del sistema creada');

    console.log('\n🎉 Seed completado exitosamente!\n');
    console.log('📝 Usuarios de prueba:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin:');
    console.log('   Email: admin@gym.com');
    console.log('   Password: 123456\n');
    console.log('🖥️  Recepcionista:');
    console.log('   Email: recepcion@gym.com');
    console.log('   Password: 123456\n');
    console.log('👤 Cliente:');
    console.log('   Email: cliente@gym.com');
    console.log('   Password: 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
