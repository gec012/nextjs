import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Configurando usuario administrador...');

    const email = 'admin@gym.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buscar o crear usuario admin
    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            password: hashedPassword,
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Administrador',
            dni: '00000000',
            phone: '0000000000',
            role: 'ADMIN',
        },
    });

    console.log('✅ Usuario administrador configurado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n📝 Inicia sesión con estas credenciales para acceder al panel de admin.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
