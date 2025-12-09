-- Script para agregar clases de una semana completa
-- Obtener IDs de disciplinas
DO $$
DECLARE crossfit_id INT;
yoga_id INT;
spinning_id INT;
BEGIN
SELECT id INTO crossfit_id
FROM "Discipline"
WHERE name = 'CrossFit';
SELECT id INTO yoga_id
FROM "Discipline"
WHERE name = 'Yoga';
SELECT id INTO spinning_id
FROM "Discipline"
WHERE name = 'Spinning';
-- LUNES
INSERT INTO "Class" (
        name,
        "disciplineId",
        "instructorName",
        "startTime",
        "endTime",
        capacity,
        "isActive",
        "createdAt",
        "updatedAt"
    )
VALUES (
        'CrossFit Morning WOD',
        crossfit_id,
        'Ana García',
        NOW() + INTERVAL '1 day 6 hours',
        NOW() + INTERVAL '1 day 7 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Sunrise',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '1 day 7 hours',
        NOW() + INTERVAL '1 day 8 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    (
        'CrossFit Noon',
        crossfit_id,
        'Carlos Ruiz',
        NOW() + INTERVAL '1 day 12 hours',
        NOW() + INTERVAL '1 day 13 hours',
        12,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Power',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '1 day 18 hours',
        NOW() + INTERVAL '1 day 19 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Relax',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '1 day 19 hours',
        NOW() + INTERVAL '1 day 20 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    -- MARTES
    (
        'CrossFit Strength',
        crossfit_id,
        'Pedro Gómez',
        NOW() + INTERVAL '2 days 6 hours',
        NOW() + INTERVAL '2 days 7 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Cardio',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '2 days 8 hours',
        NOW() + INTERVAL '2 days 9 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Flow',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '2 days 10 hours',
        NOW() + INTERVAL '2 days 11 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    (
        'CrossFit Evening',
        crossfit_id,
        'Ana García',
        NOW() + INTERVAL '2 days 18 hours',
        NOW() + INTERVAL '2 days 19 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Night',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '2 days 20 hours',
        NOW() + INTERVAL '2 days 21 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    -- MIÉRCOLES
    (
        'CrossFit AMRAP',
        crossfit_id,
        'Carlos Ruiz',
        NOW() + INTERVAL '3 days 6 hours',
        NOW() + INTERVAL '3 days 7 hours',
        12,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Energy',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '3 days 7 hours',
        NOW() + INTERVAL '3 days 8 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Hills',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '3 days 12 hours',
        NOW() + INTERVAL '3 days 13 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    (
        'CrossFit MetCon',
        crossfit_id,
        'Pedro Gómez',
        NOW() + INTERVAL '3 days 18 hours',
        NOW() + INTERVAL '3 days 19 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Sunset',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '3 days 19 hours',
        NOW() + INTERVAL '3 days 20 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    -- JUEVES
    (
        'CrossFit Hero WOD',
        crossfit_id,
        'Ana García',
        NOW() + INTERVAL '4 days 6 hours',
        NOW() + INTERVAL '4 days 7 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Intervals',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '4 days 8 hours',
        NOW() + INTERVAL '4 days 9 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Balance',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '4 days 10 hours',
        NOW() + INTERVAL '4 days 11 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    (
        'CrossFit Gymnastics',
        crossfit_id,
        'Carlos Ruiz',
        NOW() + INTERVAL '4 days 18 hours',
        NOW() + INTERVAL '4 days 19 hours',
        12,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Endurance',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '4 days 20 hours',
        NOW() + INTERVAL '4 days 21 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    -- VIERNES
    (
        'CrossFit Partner WOD',
        crossfit_id,
        'Pedro Gómez',
        NOW() + INTERVAL '5 days 6 hours',
        NOW() + INTERVAL '5 days 7 hours',
        16,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Stretch',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '5 days 7 hours',
        NOW() + INTERVAL '5 days 8 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Sprint',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '5 days 12 hours',
        NOW() + INTERVAL '5 days 13 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    (
        'CrossFit Friday Fun',
        crossfit_id,
        'Ana García',
        NOW() + INTERVAL '5 days 18 hours',
        NOW() + INTERVAL '5 days 19 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Chill',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '5 days 19 hours',
        NOW() + INTERVAL '5 days 20 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    -- SÁBADO
    (
        'CrossFit Saturday Special',
        crossfit_id,
        'Carlos Ruiz',
        NOW() + INTERVAL '6 days 9 hours',
        NOW() + INTERVAL '6 days 10 hours',
        20,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Morning Flow',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '6 days 10 hours',
        NOW() + INTERVAL '6 days 11 hours',
        25,
        true,
        NOW(),
        NOW()
    ),
    (
        'Spinning Weekend',
        spinning_id,
        'Laura Díaz',
        NOW() + INTERVAL '6 days 11 hours',
        NOW() + INTERVAL '6 days 12 hours',
        30,
        true,
        NOW(),
        NOW()
    ),
    (
        'CrossFit Open Gym',
        crossfit_id,
        'Pedro Gómez',
        NOW() + INTERVAL '6 days 16 hours',
        NOW() + INTERVAL '6 days 17 hours',
        15,
        true,
        NOW(),
        NOW()
    ),
    (
        'Yoga Restore',
        yoga_id,
        'María Torres',
        NOW() + INTERVAL '6 days 17 hours',
        NOW() + INTERVAL '6 days 18 hours',
        20,
        true,
        NOW(),
        NOW()
    );
END $$;