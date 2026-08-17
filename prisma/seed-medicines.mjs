// Run: node prisma/seed-medicines.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const medicines = [
  // Analgesic / Antipyretic
  { nameEn: "Paracetamol", genericName: "Paracetamol", type: "TABLET", strength: "500mg", nameBn: "প্যারাসিটামল" },
  { nameEn: "Paracetamol Syrup", genericName: "Paracetamol", type: "SYRUP", strength: "120mg/5ml", nameBn: "প্যারাসিটামল সিরাপ" },
  { nameEn: "Ibuprofen", genericName: "Ibuprofen", type: "TABLET", strength: "400mg" },
  { nameEn: "Ibuprofen", genericName: "Ibuprofen", type: "TABLET", strength: "200mg" },
  { nameEn: "Diclofenac", genericName: "Diclofenac Sodium", type: "TABLET", strength: "50mg" },
  { nameEn: "Naproxen", genericName: "Naproxen", type: "TABLET", strength: "500mg" },
  { nameEn: "Tramadol", genericName: "Tramadol HCl", type: "CAPSULE", strength: "50mg" },
  { nameEn: "Aspirin", genericName: "Acetylsalicylic Acid", type: "TABLET", strength: "75mg" },
  { nameEn: "Aspirin", genericName: "Acetylsalicylic Acid", type: "TABLET", strength: "300mg" },
  { nameEn: "Mefenamic Acid", genericName: "Mefenamic Acid", type: "CAPSULE", strength: "500mg" },
  // Antibiotics
  { nameEn: "Amoxicillin", genericName: "Amoxicillin", type: "CAPSULE", strength: "500mg" },
  { nameEn: "Amoxicillin Syrup", genericName: "Amoxicillin", type: "SYRUP", strength: "125mg/5ml" },
  { nameEn: "Azithromycin", genericName: "Azithromycin", type: "TABLET", strength: "500mg" },
  { nameEn: "Azithromycin", genericName: "Azithromycin", type: "TABLET", strength: "250mg" },
  { nameEn: "Ciprofloxacin", genericName: "Ciprofloxacin HCl", type: "TABLET", strength: "500mg" },
  { nameEn: "Metronidazole", genericName: "Metronidazole", type: "TABLET", strength: "400mg" },
  { nameEn: "Metronidazole Syrup", genericName: "Metronidazole", type: "SYRUP", strength: "200mg/5ml" },
  { nameEn: "Doxycycline", genericName: "Doxycycline HCl", type: "CAPSULE", strength: "100mg" },
  { nameEn: "Cefixime", genericName: "Cefixime", type: "TABLET", strength: "200mg" },
  { nameEn: "Cefixime", genericName: "Cefixime", type: "CAPSULE", strength: "400mg" },
  { nameEn: "Cefuroxime", genericName: "Cefuroxime Axetil", type: "TABLET", strength: "500mg" },
  { nameEn: "Clarithromycin", genericName: "Clarithromycin", type: "TABLET", strength: "500mg" },
  { nameEn: "Erythromycin", genericName: "Erythromycin", type: "TABLET", strength: "500mg" },
  { nameEn: "Cotrimoxazole", genericName: "Sulfamethoxazole + Trimethoprim", type: "TABLET", strength: "480mg" },
  { nameEn: "Levofloxacin", genericName: "Levofloxacin", type: "TABLET", strength: "500mg" },
  { nameEn: "Ceftriaxone", genericName: "Ceftriaxone Sodium", type: "INJECTION", strength: "1g" },
  { nameEn: "Amikacin", genericName: "Amikacin Sulfate", type: "INJECTION", strength: "500mg" },
  { nameEn: "Cloxacillin", genericName: "Cloxacillin Sodium", type: "CAPSULE", strength: "500mg" },
  // Antacid / GI
  { nameEn: "Omeprazole", genericName: "Omeprazole", type: "CAPSULE", strength: "20mg" },
  { nameEn: "Pantoprazole", genericName: "Pantoprazole Sodium", type: "TABLET", strength: "40mg" },
  { nameEn: "Esomeprazole", genericName: "Esomeprazole", type: "CAPSULE", strength: "40mg" },
  { nameEn: "Rabeprazole", genericName: "Rabeprazole Sodium", type: "TABLET", strength: "20mg" },
  { nameEn: "Ranitidine", genericName: "Ranitidine HCl", type: "TABLET", strength: "150mg" },
  { nameEn: "Domperidone", genericName: "Domperidone", type: "TABLET", strength: "10mg" },
  { nameEn: "Metoclopramide", genericName: "Metoclopramide HCl", type: "TABLET", strength: "10mg" },
  { nameEn: "Ondansetron", genericName: "Ondansetron HCl", type: "TABLET", strength: "8mg" },
  { nameEn: "Ondansetron", genericName: "Ondansetron HCl", type: "TABLET", strength: "4mg" },
  { nameEn: "Loperamide", genericName: "Loperamide HCl", type: "CAPSULE", strength: "2mg" },
  { nameEn: "ORS", genericName: "Oral Rehydration Salts", type: "OTHER", strength: "27.9g/sachet" },
  { nameEn: "Sucralfate", genericName: "Sucralfate", type: "TABLET", strength: "1g" },
  // Antihistamine
  { nameEn: "Cetirizine", genericName: "Cetirizine HCl", type: "TABLET", strength: "10mg" },
  { nameEn: "Loratadine", genericName: "Loratadine", type: "TABLET", strength: "10mg" },
  { nameEn: "Fexofenadine 120", genericName: "Fexofenadine HCl", type: "TABLET", strength: "120mg" },
  { nameEn: "Fexofenadine 180", genericName: "Fexofenadine HCl", type: "TABLET", strength: "180mg" },
  { nameEn: "Levocetirizine", genericName: "Levocetirizine HCl", type: "TABLET", strength: "5mg" },
  { nameEn: "Chlorpheniramine", genericName: "Chlorpheniramine Maleate", type: "TABLET", strength: "4mg" },
  { nameEn: "Desloratadine", genericName: "Desloratadine", type: "TABLET", strength: "5mg" },
  // Respiratory
  { nameEn: "Salbutamol", genericName: "Salbutamol Sulfate", type: "TABLET", strength: "4mg" },
  { nameEn: "Salbutamol Inhaler", genericName: "Salbutamol", type: "INHALER", strength: "100mcg/dose" },
  { nameEn: "Montelukast", genericName: "Montelukast Sodium", type: "TABLET", strength: "10mg" },
  { nameEn: "Theophylline", genericName: "Theophylline", type: "TABLET", strength: "200mg" },
  { nameEn: "Ambroxol", genericName: "Ambroxol HCl", type: "TABLET", strength: "30mg" },
  { nameEn: "Ambroxol Syrup", genericName: "Ambroxol HCl", type: "SYRUP", strength: "15mg/5ml" },
  { nameEn: "Bromhexine", genericName: "Bromhexine HCl", type: "TABLET", strength: "8mg" },
  { nameEn: "Budesonide Inhaler", genericName: "Budesonide", type: "INHALER", strength: "200mcg/dose" },
  // Cardiovascular
  { nameEn: "Atenolol 50", genericName: "Atenolol", type: "TABLET", strength: "50mg" },
  { nameEn: "Atenolol 100", genericName: "Atenolol", type: "TABLET", strength: "100mg" },
  { nameEn: "Amlodipine 5", genericName: "Amlodipine Besylate", type: "TABLET", strength: "5mg" },
  { nameEn: "Amlodipine 10", genericName: "Amlodipine Besylate", type: "TABLET", strength: "10mg" },
  { nameEn: "Enalapril", genericName: "Enalapril Maleate", type: "TABLET", strength: "5mg" },
  { nameEn: "Losartan", genericName: "Losartan Potassium", type: "TABLET", strength: "50mg" },
  { nameEn: "Bisoprolol", genericName: "Bisoprolol Fumarate", type: "TABLET", strength: "5mg" },
  { nameEn: "Furosemide", genericName: "Furosemide", type: "TABLET", strength: "40mg" },
  { nameEn: "Spironolactone", genericName: "Spironolactone", type: "TABLET", strength: "25mg" },
  { nameEn: "Clopidogrel", genericName: "Clopidogrel Bisulfate", type: "TABLET", strength: "75mg" },
  { nameEn: "Isosorbide Mononitrate", genericName: "Isosorbide Mononitrate", type: "TABLET", strength: "30mg" },
  { nameEn: "Digoxin", genericName: "Digoxin", type: "TABLET", strength: "0.25mg" },
  // Lipid-lowering
  { nameEn: "Atorvastatin 10", genericName: "Atorvastatin Calcium", type: "TABLET", strength: "10mg" },
  { nameEn: "Atorvastatin 20", genericName: "Atorvastatin Calcium", type: "TABLET", strength: "20mg" },
  { nameEn: "Rosuvastatin", genericName: "Rosuvastatin Calcium", type: "TABLET", strength: "10mg" },
  { nameEn: "Simvastatin", genericName: "Simvastatin", type: "TABLET", strength: "20mg" },
  // Diabetes
  { nameEn: "Metformin 500", genericName: "Metformin HCl", type: "TABLET", strength: "500mg" },
  { nameEn: "Metformin 1000", genericName: "Metformin HCl", type: "TABLET", strength: "1000mg" },
  { nameEn: "Glibenclamide", genericName: "Glibenclamide", type: "TABLET", strength: "5mg" },
  { nameEn: "Glimepiride", genericName: "Glimepiride", type: "TABLET", strength: "2mg" },
  { nameEn: "Sitagliptin", genericName: "Sitagliptin Phosphate", type: "TABLET", strength: "100mg" },
  { nameEn: "Insulin Regular", genericName: "Human Insulin", type: "INJECTION", strength: "100IU/ml" },
  { nameEn: "Insulin Glargine", genericName: "Insulin Glargine", type: "INJECTION", strength: "100IU/ml" },
  // Corticosteroids
  { nameEn: "Prednisolone 5", genericName: "Prednisolone", type: "TABLET", strength: "5mg" },
  { nameEn: "Prednisolone 20", genericName: "Prednisolone", type: "TABLET", strength: "20mg" },
  { nameEn: "Dexamethasone", genericName: "Dexamethasone", type: "TABLET", strength: "0.5mg" },
  // Neurology / Psychiatry
  { nameEn: "Phenytoin", genericName: "Phenytoin Sodium", type: "TABLET", strength: "100mg" },
  { nameEn: "Carbamazepine", genericName: "Carbamazepine", type: "TABLET", strength: "200mg" },
  { nameEn: "Valproate", genericName: "Sodium Valproate", type: "TABLET", strength: "500mg" },
  { nameEn: "Levetiracetam", genericName: "Levetiracetam", type: "TABLET", strength: "500mg" },
  { nameEn: "Diazepam", genericName: "Diazepam", type: "TABLET", strength: "5mg" },
  { nameEn: "Alprazolam", genericName: "Alprazolam", type: "TABLET", strength: "0.25mg" },
  { nameEn: "Amitriptyline", genericName: "Amitriptyline HCl", type: "TABLET", strength: "25mg" },
  { nameEn: "Fluoxetine", genericName: "Fluoxetine HCl", type: "CAPSULE", strength: "20mg" },
  { nameEn: "Sertraline", genericName: "Sertraline HCl", type: "TABLET", strength: "50mg" },
  { nameEn: "Escitalopram", genericName: "Escitalopram Oxalate", type: "TABLET", strength: "10mg" },
  { nameEn: "Risperidone", genericName: "Risperidone", type: "TABLET", strength: "2mg" },
  // Vitamins / Supplements
  { nameEn: "Vitamin B Complex", genericName: "Vitamin B Complex", type: "TABLET", strength: "" },
  { nameEn: "Vitamin C 500", genericName: "Ascorbic Acid", type: "TABLET", strength: "500mg" },
  { nameEn: "Vitamin D3 1000", genericName: "Cholecalciferol", type: "CAPSULE", strength: "1000IU" },
  { nameEn: "Vitamin D3 5000", genericName: "Cholecalciferol", type: "CAPSULE", strength: "5000IU" },
  { nameEn: "Folic Acid", genericName: "Folic Acid", type: "TABLET", strength: "5mg" },
  { nameEn: "Ferrous Sulfate", genericName: "Ferrous Sulfate", type: "TABLET", strength: "200mg" },
  { nameEn: "Calcium + Vit D3", genericName: "Calcium Carbonate + Vitamin D3", type: "TABLET", strength: "500mg" },
  { nameEn: "Zinc Sulfate", genericName: "Zinc Sulfate", type: "TABLET", strength: "20mg" },
  { nameEn: "Multivitamin", genericName: "Multivitamin + Multimineral", type: "TABLET", strength: "" },
  // Antiparasitic / Antifungal
  { nameEn: "Albendazole", genericName: "Albendazole", type: "TABLET", strength: "400mg" },
  { nameEn: "Mebendazole", genericName: "Mebendazole", type: "TABLET", strength: "100mg" },
  { nameEn: "Ivermectin", genericName: "Ivermectin", type: "TABLET", strength: "6mg" },
  { nameEn: "Fluconazole", genericName: "Fluconazole", type: "CAPSULE", strength: "150mg" },
  { nameEn: "Clotrimazole Cream", genericName: "Clotrimazole", type: "CREAM", strength: "1%" },
  { nameEn: "Ketoconazole", genericName: "Ketoconazole", type: "TABLET", strength: "200mg" },
  // Others
  { nameEn: "Hydroxychloroquine", genericName: "Hydroxychloroquine Sulfate", type: "TABLET", strength: "200mg" },
  { nameEn: "Colchicine", genericName: "Colchicine", type: "TABLET", strength: "0.5mg" },
  { nameEn: "Allopurinol 100", genericName: "Allopurinol", type: "TABLET", strength: "100mg" },
  { nameEn: "Allopurinol 300", genericName: "Allopurinol", type: "TABLET", strength: "300mg" },
  { nameEn: "Warfarin", genericName: "Warfarin Sodium", type: "TABLET", strength: "5mg" },
  { nameEn: "Dydrogesterone", genericName: "Dydrogesterone", type: "TABLET", strength: "10mg" },
  { nameEn: "Clomifene", genericName: "Clomifene Citrate", type: "TABLET", strength: "50mg" },
  { nameEn: "Misoprostol", genericName: "Misoprostol", type: "TABLET", strength: "200mcg" },
];

async function main() {
  console.log("Seeding", medicines.length, "medicines...");
  let n = 0;
  for (const m of medicines) {
    const uid = `med_${m.nameEn.toLowerCase().replace(/\W+/g, "_")}_${(m.strength || "x").replace(/\W+/g, "")}`;
    await prisma.medicine.upsert({
      where: { id: uid },
      update: {},
      create: { id: uid, nameEn: m.nameEn, nameBn: m.nameBn ?? null, genericName: m.genericName, type: m.type, strength: m.strength || null },
    });
    n++;
  }
  console.log(`Done: ${n} medicines seeded.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
