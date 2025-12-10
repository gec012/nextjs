import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@gym.com' },
    });

    if (!admin) {
        console.log('❌ No se encontró el usuario admin');
        return;
    }

    console.log('✅ Usuario admin encontrado:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.name);
    console.log('  Rol:', admin.rol);
    console.log('  IsActive:', admin.isActive);
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
