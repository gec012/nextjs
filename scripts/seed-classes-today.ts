import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creando clases para hoy...');

    // Obtener disciplinas existentes
    const disciplines = await prisma.discipline.findMany();

    if (disciplines.length === 0) {
        console.error('❌ No hay disciplinas en la base de datos');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Crear clases para diferentes horarios de hoy
    const classesToCreate = [
        {
            name: 'CrossFit WOD',
            disciplineId: disciplines.find(d => d.name.includes('CrossFit'))?.id || disciplines[0].id,
            startTime: new Date(today.getTime() + (12 * 60 + 0) * 60000), // 12:00 PM
            duration: 60,
            capacity: 15,
            instructorName: 'Juan Pérez',
        },
        {
            name: 'Yoga Flow',
            disciplineId: disciplines.find(d => d.name.includes('Yoga'))?.id || disciplines[0].id,
            startTime: new Date(today.getTime() + (12 * 60 + 30) * 60000), // 12:30 PM
            duration: 60,
            capacity: 20,
            instructorName: 'María González',
        },
        {
            name: 'Spinning Power',
            disciplineId: disciplines.find(d => d.name.includes('Spinning'))?.id || disciplines[0].id,
            startTime: new Date(today.getTime() + (13 * 60 + 0) * 60000), // 1:00 PM
            duration: 45,
            capacity: 25,
            instructorName: 'Carlos Martínez',
        },
        {
            name: 'CrossFit Strength',
            disciplineId: disciplines.find(d => d.name.includes('CrossFit'))?.id || disciplines[0].id,
            startTime: new Date(today.getTime() + (14 * 60 + 0) * 60000), // 2:00 PM
            duration: 60,
            capacity: 15,
            instructorName: 'Juan Pérez',
        },
        {
            name: 'Yoga Relax',
            disciplineId: disciplines.find(d => d.name.includes('Yoga'))?.id || disciplines[0].id,
            startTime: new Date(today.getTime() + (15 * 60 + 0) * 60000), // 3:00 PM
            duration: 60,
            capacity: 20,
            instructorName: 'María González',
        },
        {
            name: 'Spinning Cardio',
            disciplineId: disciplines.find(d => d.name.includes('Spinning'))?.id || disciplines[0].id,
            startTime: new Date(today.getTime() + (16 * 60 + 0) * 60000), // 4:00 PM
            duration: 45,
            capacity: 25,
            instructorName: 'Carlos Martínez',
        },
    ];

    for (const classData of classesToCreate) {
        const endTime = new Date(classData.startTime.getTime() + classData.duration * 60000);

        const createdClass = await prisma.class.create({
            data: {
                name: classData.name,
                disciplineId: classData.disciplineId,
                instructorName: classData.instructorName,
                startTime: classData.startTime,
                endTime: endTime,
                capacity: classData.capacity,
                isActive: true,
            },
        });

        console.log(`✅ Clase creada: ${createdClass.name} - ${classData.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`);
    }

    console.log('✨ Clases creadas exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
