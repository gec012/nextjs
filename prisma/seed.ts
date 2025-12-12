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
            dni: '11111111',
        },
    });

    const recepcionista = await prisma.user.create({
        data: {
            name: 'María Recepcionista',
            email: 'recepcion@gym.com',
            password: hashedPassword,
            rol: 'STAFF',
            phone: '+54 9 11 2345-6789',
            dni: '22222222',
        },
    });

    const monitor = await prisma.user.create({
        data: {
            name: 'Puesto de Acceso',
            email: 'monitor@gym.com',
            password: hashedPassword,
            rol: 'MONITOR',
            phone: '',
            dni: '00000000',
        },
    });

    const cliente1 = await prisma.user.create({
        data: {
            name: 'Juan Cliente',
            email: 'cliente@gym.com',
            password: hashedPassword,
            rol: 'CLIENT',
            phone: '+54 9 11 3456-7890',
            dni: '33333333',
        },
    });

    const cliente2 = await prisma.user.create({
        data: {
            name: 'Ana García',
            email: 'ana@example.com',
            password: hashedPassword,
            rol: 'CLIENT',
            phone: '+54 9 11 4567-8901',
            dni: '44444444',
        },
    });

    const cliente3 = await prisma.user.create({
        data: {
            name: 'Carlos López',
            email: 'carlos@example.com',
            password: hashedPassword,
            rol: 'CLIENT',
            phone: '+54 9 11 5678-9012',
            dni: '55555555',
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
    // 6. CREAR PAGOS (para reportes)
    // ============================================
    const paymentMethods = ['CASH', 'TRANSFER', 'CREDIT', 'DEBIT', 'MERCADOPAGO'];
    const today = new Date();

    // Pagos del cliente 1
    await prisma.payment.create({
        data: {
            userId: cliente1.id,
            planId: planMusculacionIlimitado.id,
            amount: 35000,
            method: 'TRANSFER',
            status: 'APPROVED',
            createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        },
    });

    await prisma.payment.create({
        data: {
            userId: cliente1.id,
            planId: planCrossfit16.id,
            amount: 32000,
            method: 'MERCADOPAGO',
            status: 'APPROVED',
            createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // Ayer
        },
    });

    // Pagos del cliente 2
    await prisma.payment.create({
        data: {
            userId: cliente2.id,
            planId: planMusculacion12.id,
            amount: 25000,
            method: 'CASH',
            status: 'APPROVED',
            createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
        },
    });

    await prisma.payment.create({
        data: {
            userId: cliente2.id,
            planId: planYoga8.id,
            amount: 18000,
            method: 'DEBIT',
            status: 'APPROVED',
            createdAt: today,
        },
    });

    // Pagos del cliente 3
    await prisma.payment.create({
        data: {
            userId: cliente3.id,
            planId: planSpinning12.id,
            amount: 22000,
            method: 'CREDIT',
            status: 'APPROVED',
            createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // Ayer
        },
    });

    // Más clientes y pagos para estadísticas
    const cliente4 = await prisma.user.create({
        data: {
            name: 'Laura Martínez',
            email: 'laura@example.com',
            password: hashedPassword,
            rol: 'CLIENT',
            phone: '+54 9 11 6789-0123',
        },
    });

    await prisma.membership.create({
        data: {
            userId: cliente4.id,
            planId: planMusculacion12.id,
            disciplineId: musculacion.id,
            totalCredits: 12,
            remainingCredits: 12,
            isUnlimited: false,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    await prisma.payment.create({
        data: {
            userId: cliente4.id,
            planId: planMusculacion12.id,
            amount: 25000,
            method: 'TRANSFER',
            status: 'APPROVED',
            createdAt: today,
        },
    });

    console.log('✅ Pagos creados');

    // ============================================
    // 7. CREAR ASISTENCIAS (para reportes)
    // ============================================
    // Asistencias de los últimos 7 días
    for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);

        // Cliente 1 - Musculación (casi todos los días)
        if (i !== 6) { // Descansa los domingos
            await prisma.attendance.create({
                data: {
                    userId: cliente1.id,
                    disciplineId: musculacion.id,
                    type: 'direct_access',
                    createdAt: date,
                },
            });
        }

        // Cliente 2 - Musculación (3 veces por semana)
        if (i % 2 === 0) {
            await prisma.attendance.create({
                data: {
                    userId: cliente2.id,
                    disciplineId: musculacion.id,
                    type: 'direct_access',
                    createdAt: date,
                },
            });
        }

        // Cliente 3 y 4 - Spinning (2-3 veces por semana)
        if (i < 3) {
            await prisma.attendance.create({
                data: {
                    userId: cliente3.id,
                    disciplineId: spinning.id,
                    type: 'direct_access',
                    createdAt: date,
                },
            });
        }

        if (i < 2) {
            await prisma.attendance.create({
                data: {
                    userId: cliente4.id,
                    disciplineId: musculacion.id,
                    type: 'direct_access',
                    createdAt: date,
                },
            });
        }
    }

    console.log('✅ Asistencias creadas');

    // ============================================
    // 8. CREAR RESERVAS (para reportes)
    // ============================================
    const classCrossfit = await prisma.class.findFirst({
        where: { name: 'CrossFit WOD' },
    });

    const classYoga = await prisma.class.findFirst({
        where: { name: 'Yoga Flow' },
    });

    const classSpinning = await prisma.class.findFirst({
        where: { name: 'Spinning Power' },
    });

    // Obtener membresías para las reservas
    const membership1Crossfit = await prisma.membership.findFirst({
        where: { userId: cliente1.id, disciplineId: crossfit.id },
    });

    const membership2Yoga = await prisma.membership.findFirst({
        where: { userId: cliente2.id, disciplineId: yoga.id },
    });

    const membership3Spinning = await prisma.membership.findFirst({
        where: { userId: cliente3.id, disciplineId: spinning.id },
    });

    const membership4Musculacion = await prisma.membership.findFirst({
        where: { userId: cliente4.id, disciplineId: musculacion.id },
    });

    if (classCrossfit && membership1Crossfit) {
        await prisma.reservation.create({
            data: {
                userId: cliente1.id,
                classId: classCrossfit.id,
                membershipId: membership1Crossfit.id,
                status: 'ACTIVE',
            },
        });
    }

    if (classYoga && membership2Yoga) {
        await prisma.reservation.create({
            data: {
                userId: cliente2.id,
                classId: classYoga.id,
                membershipId: membership2Yoga.id,
                status: 'ACTIVE',
            },
        });
    }

    if (classSpinning && membership3Spinning) {
        await prisma.reservation.create({
            data: {
                userId: cliente3.id,
                classId: classSpinning.id,
                membershipId: membership3Spinning.id,
                status: 'ACTIVE',
            },
        });
    }

    // Cliente 4 no tiene membresía de Spinning, mejor crear una nueva
    const membership4Spinning = await prisma.membership.create({
        data: {
            userId: cliente4.id,
            planId: planSpinning12.id,
            disciplineId: spinning.id,
            totalCredits: 12,
            remainingCredits: 11,
            isUnlimited: false,
            startDate: now,
            expirationDate: in30Days,
            status: 'ACTIVE',
        },
    });

    if (classSpinning) {
        await prisma.reservation.create({
            data: {
                userId: cliente4.id,
                classId: classSpinning.id,
                membershipId: membership4Spinning.id,
                status: 'ACTIVE',
            },
        });
    }

    // Algunas reservas completadas (de la semana pasada)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oldClass = await prisma.class.create({
        data: {
            name: 'CrossFit WOD - Semana Pasada',
            disciplineId: crossfit.id,
            instructorName: 'Coach Mike',
            startTime: lastWeek,
            endTime: new Date(lastWeek.getTime() + 60 * 60 * 1000),
            capacity: 15,
            isActive: false,
        },
    });

    if (membership1Crossfit) {
        await prisma.reservation.create({
            data: {
                userId: cliente1.id,
                classId: oldClass.id,
                membershipId: membership1Crossfit.id,
                status: 'ATTENDED',
                createdAt: new Date(lastWeek.getTime() - 24 * 60 * 60 * 1000),
            },
        });
    }

    // Cliente 2 necesita membresía de CrossFit para esta reserva pasada
    const membership2Crossfit = await prisma.membership.create({
        data: {
            userId: cliente2.id,
            planId: planCrossfit16.id,
            disciplineId: crossfit.id,
            totalCredits: 16,
            remainingCredits: 15,
            isUnlimited: false,
            startDate: new Date(lastWeek.getTime() - 30 * 24 * 60 * 60 * 1000),
            expirationDate: lastWeek,
            status: 'EXPIRED',
        },
    });

    await prisma.reservation.create({
        data: {
            userId: cliente2.id,
            classId: oldClass.id,
            membershipId: membership2Crossfit.id,
            status: 'ATTENDED',
            createdAt: new Date(lastWeek.getTime() - 24 * 60 * 60 * 1000),
        },
    });

    console.log('✅ Reservas creadas');

    // ============================================
    // 9. CREAR INFORMACIÓN BANCARIA
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
