// One-time migration: grant existing doctors/centers (pre-dating the subscription
// system) an active PRO subscription so they aren't locked out. Run: node prisma/backfill-subscriptions.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const endsAt = new Date(Date.now() + 365 * 86400000);

  const doctors = await prisma.doctorProfile.findMany({
    where: { subscription: null },
    select: { id: true },
  });
  for (const d of doctors) {
    await prisma.subscription.create({
      data: { doctorId: d.id, plan: "PRO", status: "ACTIVE", endsAt },
    });
  }

  const centers = await prisma.diagnosticCenter.findMany({
    where: { subscription: null },
    select: { id: true },
  });
  for (const c of centers) {
    await prisma.subscription.create({
      data: { centerId: c.id, plan: "PRO", status: "ACTIVE", endsAt },
    });
  }

  console.log(`Backfilled ${doctors.length} doctor(s) and ${centers.length} center(s) with active PRO subscriptions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
