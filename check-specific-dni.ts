import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const dni7 = '4444444';
    const dni8 = '44444444';

    const user7 = await prisma.user.findFirst({ where: { dni: dni7 } });
    const user8 = await prisma.user.findFirst({ where: { dni: dni8 } });

    console.log(`Buscando DNI "${dni7}" (7 digitos): ${user7 ? 'ENCONTRADO: ' + user7.name : 'NO ENCONTRADO'}`);
    console.log(`Buscando DNI "${dni8}" (8 digitos): ${user8 ? 'ENCONTRADO: ' + user8.name : 'NO ENCONTRADO'}`);

    if (user8) {
        console.log('El usuario Ana García tiene 8 dígitos: 44444444');
    }
}

main().finally(() => prisma.$disconnect());
