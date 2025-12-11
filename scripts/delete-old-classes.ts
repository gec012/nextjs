import prisma from '../lib/prisma';

async function deleteOldClasses() {
    try {
        console.log('🗑️  Eliminando clases de 2024...');

        // Eliminar todas las clases cuya fecha sea anterior a 2025-01-01
        const result = await prisma.class.deleteMany({
            where: {
                startTime: {
                    lt: new Date('2025-01-01T00:00:00Z')
                }
            }
        });

        console.log(`✅ Se eliminaron ${result.count} clases de 2024`);

    } catch (error) {
        console.error('❌ Error eliminando clases:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteOldClasses();
