import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, startOfWeek } from 'date-fns';

// POST /api/classes/bulk - Crear múltiples clases a la vez
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF')) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { classes } = body;

        if (!Array.isArray(classes) || classes.length === 0) {
            return NextResponse.json(
                { message: 'Proporciona un array de clases válido' },
                { status: 400 }
            );
        }

        // Validar cada clase
        for (const classData of classes) {
            if (!classData.name || !classData.disciplineId || !classData.time || !classData.capacity || classData.dayOfWeek === undefined) {
                return NextResponse.json(
                    { message: 'Datos incompletos en una o más clases' },
                    { status: 400 }
                );
            }
        }

        // Crear las clases
        const createdClasses = [];

        // Obtener la fecha de inicio de la semana actual (próximo lunes)
        const now = new Date();
        const nextWeekStart = startOfWeek(addDays(now, 7), { weekStartsOn: 1 }); // Lunes

        for (const classData of classes) {
            const [hours, minutes] = classData.time.split(':').map(Number);

            // Calcular la fecha para el día de la semana especificado
            const daysToAdd = classData.dayOfWeek === 0 ? 6 : classData.dayOfWeek - 1; // Domingo es 0, pero queremos que sea el último día
            let classDate = addDays(nextWeekStart, daysToAdd);
            classDate = setHours(classDate, hours);
            classDate = setMinutes(classDate, minutes);
            classDate = setSeconds(classDate, 0);
            classDate = setMilliseconds(classDate, 0);

            // Calcular fecha de fin
            const endDate = addDays(classDate, 0);
            const endHours = hours + Math.floor(classData.duration / 60);
            const endMinutes = minutes + (classData.duration % 60);
            const finalEndDate = setHours(setMinutes(endDate, endMinutes), endHours);

            const newClass = await prisma.class.create({
                data: {
                    name: classData.name,
                    disciplineId: classData.disciplineId,
                    instructorName: classData.instructorName,
                    startTime: classDate,
                    endTime: finalEndDate,
                    capacity: classData.capacity,
                    isActive: true,
                },
            });

            createdClasses.push(newClass);
        }

        return NextResponse.json({
            message: 'Clases creadas exitosamente',
            created: createdClasses.length,
            classes: createdClasses,
        });
    } catch (error) {
        console.error('Bulk create classes error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
