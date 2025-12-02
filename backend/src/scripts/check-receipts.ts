import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking all MessageReceipt rows...');

        // Get all receipts
        const receipts = await prisma.messageReceipt.findMany({
            select: {
                id: true,
                messageId: true,
                userId: true,
                status: true,
            },
            take: 10,
        });

        console.log(`Found ${receipts.length} receipts (showing first 10):`);
        receipts.forEach((r, i) => {
            console.log(`${i + 1}. ID: ${r.id}, Message: ${r.messageId}, User: ${r.userId}, Status: ${r.status}`);
        });

        // Count by status using raw query
        console.log('\nStatus distribution (raw query):');
        const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM "MessageReceipt" 
      GROUP BY status
    `;
        console.log(statusCounts);

        // Total count
        const total = await prisma.messageReceipt.count();
        console.log(`\nTotal receipts: ${total}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
