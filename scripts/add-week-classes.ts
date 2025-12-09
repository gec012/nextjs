// Script para agregar clases de una semana
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWeekClasses() {
    try {
        // Obtener disciplinas
        const crossfit = await prisma.discipline.findUnique({ where: { name: 'CrossFit' } });
        const yoga = await prisma.discipline.findUnique({ where: { name: 'Yoga' } });
        const spinning = await prisma.discipline.findUnique({ where: { name: 'Spinning' } });

        if (!crossfit || !yoga || !spinning) {
            throw new Error('Disciplinas no encontradas');
        }

        const now = new Date();
        const classes = [];

        // LUNES (mañana = day 1)
        classes.push(
            { name: 'CrossFit Morning WOD', disciplineId: crossfit.id, instructorName: 'Ana García', startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Yoga Sunrise', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), capacity: 20 },
            { name: 'CrossFit Noon', disciplineId: crossfit.id, instructorName: 'Carlos Ruiz', startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), capacity: 12 },
            { name: 'Spinning Power', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), capacity: 25 },
            { name: 'Yoga Relax', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), capacity: 20 },

            // MARTES
            { name: 'CrossFit Strength', disciplineId: crossfit.id, instructorName: 'Pedro Gómez', startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Spinning Cardio', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), capacity: 25 },
            { name: 'Yoga Flow', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), capacity: 20 },
            { name: 'CrossFit Evening', disciplineId: crossfit.id, instructorName: 'Ana García', startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Spinning Night', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), capacity: 25 },

            // MIÉRCOLES
            { name: 'CrossFit AMRAP', disciplineId: crossfit.id, instructorName: 'Carlos Ruiz', startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), capacity: 12 },
            { name: 'Yoga Energy', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), capacity: 20 },
            { name: 'Spinning Hills', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), capacity: 25 },
            { name: 'CrossFit MetCon', disciplineId: crossfit.id, instructorName: 'Pedro Gómez', startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Yoga Sunset', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), capacity: 20 },

            // JUEVES
            { name: 'CrossFit Hero WOD', disciplineId: crossfit.id, instructorName: 'Ana García', startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Spinning Intervals', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), capacity: 25 },
            { name: 'Yoga Balance', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), capacity: 20 },
            { name: 'CrossFit Gymnastics', disciplineId: crossfit.id, instructorName: 'Carlos Ruiz', startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), capacity: 12 },
            { name: 'Spinning Endurance', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), capacity: 25 },

            // VIERNES
            { name: 'CrossFit Partner WOD', disciplineId: crossfit.id, instructorName: 'Pedro Gómez', startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), capacity: 16 },
            { name: 'Yoga Stretch', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), capacity: 20 },
            { name: 'Spinning Sprint', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), capacity: 25 },
            { name: 'CrossFit Friday Fun', disciplineId: crossfit.id, instructorName: 'Ana García', startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Yoga Chill', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), capacity: 20 },

            // SÁBADO
            { name: 'CrossFit Saturday Special', disciplineId: crossfit.id, instructorName: 'Carlos Ruiz', startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), capacity: 20 },
            { name: 'Yoga Morning Flow', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), capacity: 25 },
            { name: 'Spinning Weekend', disciplineId: spinning.id, instructorName: 'Laura Díaz', startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), capacity: 30 },
            { name: 'CrossFit Open Gym', disciplineId: crossfit.id, instructorName: 'Pedro Gómez', startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), capacity: 15 },
            { name: 'Yoga Restore', disciplineId: yoga.id, instructorName: 'María Torres', startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), capacity: 20 }
        );

        // Crear todas las clases
        for (const classData of classes) {
            await prisma.class.create({
                data: {
                    ...classData,
                    isActive: true,
                },
            });
        }

        console.log(`✅ ${classes.length} clases agregadas exitosamente!`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addWeekClasses();
