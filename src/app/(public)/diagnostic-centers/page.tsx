import { prisma } from "@/lib/db";
import { DiagnosticCard } from "@/components/shared/diagnostic-card";
import { FlaskConical } from "lucide-react";
import { activePlanFilter } from "@/lib/subscription";

export default async function DiagnosticCentersPage() {
  const centers = await prisma.diagnosticCenter.findMany({
    where: { verificationStatus: "VERIFIED", isActive: true, subscription: activePlanFilter() },
    orderBy: [{ rating: "desc" }],
    include: {
      services: { take: 5, orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ডায়াগনস্টিক সেন্টার</h1>
        <p className="text-gray-500 mt-1">নির্ভরযোগ্য ল্যাব ও ডায়াগনস্টিক সেবা</p>
      </div>

      {centers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600">কোনো ডায়াগনস্টিক সেন্টার পাওয়া যায়নি</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {centers.map((center) => (
            <DiagnosticCard
              key={center.id}
              center={{
                ...center,
                thana: center.thana ?? null,
                services: center.services.map((s) => ({
                  nameEn: s.nameEn,
                  nameBn: s.nameBn,
                  price: s.price,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
