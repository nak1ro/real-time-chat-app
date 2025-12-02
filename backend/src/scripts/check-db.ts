
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking MessageDeliveryStatus enum...');
        const enumRange = await prisma.$queryRaw`SELECT enum_range(NULL::"MessageDeliveryStatus")`;
        console.log('Enum Range:', enumRange);

        console.log('Checking for rows with DELIVERED status...');
        const deliveredRows = await prisma.$queryRaw`SELECT count(*) FROM "MessageReceipt" WHERE "status"::text = 'DELIVERED'`;
        console.log('Rows with DELIVERED:', deliveredRows);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
