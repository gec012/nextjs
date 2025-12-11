import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

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
        const { classes, startDate, endDate } = body;

        if (!Array.isArray(classes) || classes.length === 0) {
            return NextResponse.json(
                { message: 'Proporciona un array de clases válido' },
                { status: 400 }
            );
        }

        if (!startDate || !endDate) {
            return NextResponse.json(
                { message: 'Debes especificar fechas de inicio y fin' },
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

        // Parsear fechas del rango
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999); // Incluir todo el día final

        // Iterar por cada día del rango
        let currentDate = new Date(rangeStart);

        while (currentDate <= rangeEnd) {
            const dayOfWeek = currentDate.getDay();

            // Buscar clases programadas para este día de la semana
            for (const classData of classes) {
                if (classData.dayOfWeek === dayOfWeek) {
                    const [hours, minutes] = classData.time.split(':').map(Number);

                    // Crear fecha/hora de inicio
                    let classDate = new Date(currentDate);
                    classDate = setHours(classDate, hours);
                    classDate = setMinutes(classDate, minutes);
                    classDate = setSeconds(classDate, 0);
                    classDate = setMilliseconds(classDate, 0);

                    // Calcular fecha de fin
                    const classEndDate = new Date(classDate);
                    const endHours = hours + Math.floor(classData.duration / 60);
                    const endMinutes = minutes + (classData.duration % 60);
                    const finalEndDate = setHours(setMinutes(classEndDate, endMinutes), endHours);

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
            }

            // Avanzar al siguiente día
            currentDate.setDate(currentDate.getDate() + 1);
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
