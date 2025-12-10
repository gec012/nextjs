import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Actualizando rol de usuario...');

    // Buscar el primer usuario que no sea admin
    const user = await prisma.user.findFirst({
        where: {
            role: 'CLIENT'
        }
    });

    if (!user) {
        console.log('❌ No se encontró ningún usuario CLIENT');
        return;
    }

    // Actualizar a ADMIN
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
    });

    console.log('✅ Usuario actualizado:');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Nombre: ${updated.name}`);
    console.log(`   Rol anterior: CLIENT`);
    console.log(`   Rol nuevo: ${updated.role}`);
    console.log('\n📝 Cierra sesión y vuelve a iniciar para ver el cambio.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
