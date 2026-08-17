/**
 * DOC&TEST Seed Data
 * Realistic Bangladesh healthcare demo data
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DOC&TEST database...");

  // ─── Specialties ──────────────────────────────────────────────
  const specialties = await Promise.all([
    prisma.specialty.upsert({
      where: { slug: "medicine" },
      update: {},
      create: { nameEn: "Medicine", nameBn: "মেডিসিন", slug: "medicine", icon: "💊", sortOrder: 1 },
    }),
    prisma.specialty.upsert({
      where: { slug: "gynecology" },
      update: {},
      create: { nameEn: "Gynecology", nameBn: "গাইনি ও প্রসূতি", slug: "gynecology", icon: "🌸", sortOrder: 2 },
    }),
    prisma.specialty.upsert({
      where: { slug: "pediatrics" },
      update: {},
      create: { nameEn: "Pediatrics", nameBn: "শিশু বিশেষজ্ঞ", slug: "pediatrics", icon: "👶", sortOrder: 3 },
    }),
    prisma.specialty.upsert({
      where: { slug: "cardiology" },
      update: {},
      create: { nameEn: "Cardiology", nameBn: "হৃদরোগ বিশেষজ্ঞ", slug: "cardiology", icon: "❤️", sortOrder: 4 },
    }),
    prisma.specialty.upsert({
      where: { slug: "dermatology" },
      update: {},
      create: { nameEn: "Dermatology", nameBn: "চর্মরোগ বিশেষজ্ঞ", slug: "dermatology", icon: "🧴", sortOrder: 5 },
    }),
    prisma.specialty.upsert({
      where: { slug: "ent" },
      update: {},
      create: { nameEn: "ENT", nameBn: "নাক-কান-গলা বিশেষজ্ঞ", slug: "ent", icon: "👂", sortOrder: 6 },
    }),
    prisma.specialty.upsert({
      where: { slug: "orthopedics" },
      update: {},
      create: { nameEn: "Orthopedics", nameBn: "অর্থোপেডিক বিশেষজ্ঞ", slug: "orthopedics", icon: "🦴", sortOrder: 7 },
    }),
    prisma.specialty.upsert({
      where: { slug: "neurology" },
      update: {},
      create: { nameEn: "Neurology", nameBn: "নিউরোলজি বিশেষজ্ঞ", slug: "neurology", icon: "🧠", sortOrder: 8 },
    }),
    prisma.specialty.upsert({
      where: { slug: "dental" },
      update: {},
      create: { nameEn: "Dental", nameBn: "দন্ত বিশেষজ্ঞ", slug: "dental", icon: "🦷", sortOrder: 9 },
    }),
  ]);

  // ─── Locations ────────────────────────────────────────────────
  const locationDhaka = await prisma.location.create({
    data: { division: "ঢাকা", district: "ঢাকা", thana: "মিরপুর", area: "মিরপুর-১০" },
  });
  const locationLalmonirhat = await prisma.location.create({
    data: { division: "রংপুর", district: "লালমনিরহাট", thana: "সদর" },
  });
  const locationChittagong = await prisma.location.create({
    data: { division: "চট্টগ্রাম", district: "চট্টগ্রাম", thana: "পাহাড়তলী" },
  });

  const hash = await bcrypt.hash("demo1234", 12);

  // ─── Admin ────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@demo.com",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  // ─── Patient ──────────────────────────────────────────────────
  const patientUser = await prisma.user.upsert({
    where: { email: "patient@demo.com" },
    update: {},
    create: {
      name: "রহিম উদ্দিন",
      email: "patient@demo.com",
      phone: "01711111111",
      passwordHash: hash,
      role: "PATIENT",
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      nameBn: "রহিম উদ্দিন",
      nameEn: "Rahim Uddin",
      gender: "MALE",
      bloodGroup: "O+",
      division: "ঢাকা",
      district: "ঢাকা",
      thana: "মিরপুর",
    },
  });

  // ─── Doctors ──────────────────────────────────────────────────
  const doctorData = [
    {
      email: "doctor@demo.com",
      nameBn: "ডাঃ মোস্তাফিজুর রহমান",
      nameEn: "Dr. Md. Mostafizur Rahman",
      slug: "dr-mostafizur-rahman",
      specialty: "medicine",
      degrees: JSON.stringify([
        { title: "MBBS", institution: "ঢাকা মেডিকেল কলেজ", year: "2005" },
        { title: "FCPS (Medicine)", institution: "BCPS", year: "2012" },
      ]),
      about: "ডাঃ মোস্তাফিজুর রহমান ১৫ বছরেরও বেশি সময় ধরে মেডিসিন বিভাগে সেবা প্রদান করছেন। তিনি বিভিন্ন জটিল রোগ নির্ণয় ও চিকিৎসায় বিশেষজ্ঞ।",
      experience: 15,
      consultationFee: 800,
      followUpFee: 400,
      rating: 4.8,
      totalReviews: 320,
      gender: "MALE",
      services: JSON.stringify([
        "ডায়াবেটিস চিকিৎসা",
        "উচ্চ রক্তচাপ",
        "থাইরয়েড রোগ",
        "হার্টের সমস্যা",
        "কিডনি রোগ",
        "ওজন নিয়ন্ত্রণ",
      ]),
      locationId: locationLalmonirhat.id,
    },
    {
      email: "doctor2@demo.com",
      nameBn: "ডাঃ ফারহানা বেগম",
      nameEn: "Dr. Farhana Begum",
      slug: "dr-farhana-begum",
      specialty: "gynecology",
      degrees: JSON.stringify([
        { title: "MBBS", institution: "চট্টগ্রাম মেডিকেল কলেজ", year: "2008" },
        { title: "FCPS (Obs & Gynae)", institution: "BCPS", year: "2015" },
      ]),
      about: "ডাঃ ফারহানা বেগম গাইনি ও প্রসূতিবিদ্যায় বিশেষজ্ঞ। তিনি মহিলাদের স্বাস্থ্যসেবায় ১২ বছরের অভিজ্ঞতা রাখেন।",
      experience: 12,
      consultationFee: 700,
      followUpFee: 350,
      rating: 4.9,
      totalReviews: 280,
      gender: "FEMALE",
      services: JSON.stringify([
        "গর্ভকালীন সেবা",
        "সন্তান প্রসব",
        "মহিলা রোগ",
        "পলিসিস্টিক ওভারি",
        "ইনফার্টিলিটি",
      ]),
      locationId: locationDhaka.id,
    },
    {
      email: "doctor3@demo.com",
      nameBn: "ডাঃ আব্দুল করিম",
      nameEn: "Dr. Abdul Karim",
      slug: "dr-abdul-karim",
      specialty: "cardiology",
      degrees: JSON.stringify([
        { title: "MBBS", institution: "ময়মনসিংহ মেডিকেল কলেজ", year: "2000" },
        { title: "MD (Cardiology)", institution: "BSMMU", year: "2008" },
        { title: "FRCP", institution: "Royal College of Physicians", year: "2015" },
      ]),
      about: "হৃদরোগ বিশেষজ্ঞ ডাঃ আব্দুল করিম ২০ বছরের অভিজ্ঞতায় হাজার হাজার রোগীর সেবা করেছেন।",
      experience: 20,
      consultationFee: 1200,
      followUpFee: 600,
      rating: 4.7,
      totalReviews: 450,
      gender: "MALE",
      services: JSON.stringify([
        "ইকো কার্ডিওগ্রাম",
        "হার্ট ব্লক চিকিৎসা",
        "উচ্চ রক্তচাপ",
        "হার্ট ফেইলিউর",
        "করোনারি আর্টারি ডিজিজ",
      ]),
      locationId: locationDhaka.id,
    },
    {
      email: "doctor4@demo.com",
      nameBn: "ডাঃ সুমাইয়া হাসান",
      nameEn: "Dr. Sumaiya Hasan",
      slug: "dr-sumaiya-hasan",
      specialty: "pediatrics",
      degrees: JSON.stringify([
        { title: "MBBS", institution: "রাজশাহী মেডিকেল কলেজ", year: "2010" },
        { title: "DCH", institution: "BCPS", year: "2014" },
      ]),
      about: "শিশু বিশেষজ্ঞ ডাঃ সুমাইয়া হাসান শিশুদের রোগ নির্ণয় ও চিকিৎসায় বিশেষ দক্ষ।",
      experience: 10,
      consultationFee: 600,
      followUpFee: 300,
      rating: 4.9,
      totalReviews: 210,
      gender: "FEMALE",
      services: JSON.stringify([
        "নবজাতক সেবা",
        "শিশু টিকা",
        "শিশু পুষ্টি",
        "শিশু রোগ",
      ]),
      locationId: locationChittagong.id,
    },
  ];

  const createdDoctors = [];

  for (const doc of doctorData) {
    const existing = await prisma.user.findUnique({ where: { email: doc.email } });
    let userRecord = existing;

    if (!existing) {
      userRecord = await prisma.user.create({
        data: {
          name: doc.nameBn,
          email: doc.email,
          passwordHash: hash,
          role: "DOCTOR",
        },
      });
    }

    if (!userRecord) continue;

    let doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: userRecord.id },
    });

    if (!doctorProfile) {
      doctorProfile = await prisma.doctorProfile.create({
        data: {
          userId: userRecord.id,
          slug: doc.slug,
          nameEn: doc.nameEn,
          nameBn: doc.nameBn,
          degrees: doc.degrees,
          about: doc.about,
          experience: doc.experience,
          consultationFee: doc.consultationFee,
          followUpFee: doc.followUpFee,
          rating: doc.rating,
          totalReviews: doc.totalReviews,
          gender: doc.gender,
          services: doc.services,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
          isAvailableToday: true,
          locationId: doc.locationId,
        },
      });
    }

    // Active subscription so seeded doctors show up in listings
    await prisma.subscription.upsert({
      where: { doctorId: doctorProfile.id },
      update: {},
      create: {
        doctorId: doctorProfile.id,
        plan: "PRO",
        status: "ACTIVE",
        endsAt: new Date(Date.now() + 365 * 86400000),
      },
    });

    // Link specialty
    const specialty = specialties.find((s) => s.slug === doc.specialty);
    if (specialty) {
      await prisma.doctorSpecialty.upsert({
        where: { doctorId_specialtyId: { doctorId: doctorProfile.id, specialtyId: specialty.id } },
        update: {},
        create: { doctorId: doctorProfile.id, specialtyId: specialty.id, isPrimary: true },
      });
    }

    createdDoctors.push(doctorProfile);
  }

  // ─── Chambers for first doctor ────────────────────────────────
  if (createdDoctors[0]) {
    const chamber1 = await prisma.doctorChamber.upsert({
      where: { id: "chamber-demo-1" },
      update: {},
      create: {
        id: "chamber-demo-1",
        doctorId: createdDoctors[0].id,
        nameEn: "Popular Diagnostic Center",
        nameBn: "পপুলার ডায়াগনস্টিক সেন্টার",
        address: "লালমনিরহাট সদর, রংপুর",
        locationId: locationLalmonirhat.id,
        phone: "01700000001",
        avgConsultDuration: 10,
        dailyLimit: 30,
        appointmentType: "SERIAL",
      },
    });

    // Weekly schedule Sun-Thu
    for (const day of [0, 1, 2, 3, 4]) {
      await prisma.chamberSchedule.upsert({
        where: { id: `sched-demo-1-${day}` },
        update: {},
        create: {
          id: `sched-demo-1-${day}`,
          chamberId: chamber1.id,
          dayOfWeek: day,
          startTime: "14:00",
          endTime: "20:00",
        },
      });
    }

    const chamber2 = await prisma.doctorChamber.upsert({
      where: { id: "chamber-demo-2" },
      update: {},
      create: {
        id: "chamber-demo-2",
        doctorId: createdDoctors[0].id,
        nameEn: "Sadar Hospital",
        nameBn: "সদর হাসপাতাল",
        address: "সদর হাসপাতাল রোড, লালমনিরহাট",
        locationId: locationLalmonirhat.id,
        phone: "01700000002",
        avgConsultDuration: 8,
        dailyLimit: 40,
        appointmentType: "SERIAL",
      },
    });

    for (const day of [5, 6]) {
      await prisma.chamberSchedule.upsert({
        where: { id: `sched-demo-2-${day}` },
        update: {},
        create: {
          id: `sched-demo-2-${day}`,
          chamberId: chamber2.id,
          dayOfWeek: day,
          startTime: "10:00",
          endTime: "14:00",
        },
      });
    }
  }

  // ─── Diagnostic Centers ───────────────────────────────────────
  const centerUser1 = await prisma.user.upsert({
    where: { email: "center@demo.com" },
    update: {},
    create: {
      name: "পপুলার ডায়াগনস্টিক",
      email: "center@demo.com",
      passwordHash: hash,
      role: "DIAGNOSTIC",
    },
  });

  const center1 = await prisma.diagnosticCenter.upsert({
    where: { userId: centerUser1.id },
    update: {},
    create: {
      userId: centerUser1.id,
      slug: "popular-diagnostic-lalmonirhat",
      nameEn: "Popular Diagnostic Center Lalmonirhat",
      nameBn: "পপুলার ডায়াগনস্টিক সেন্টার",
      about: "লালমনিরহাটের সবচেয়ে আধুনিক ডায়াগনস্টিক সেন্টার। সর্বাধুনিক যন্ত্রপাতি ও অভিজ্ঞ টেকনিশিয়ান দ্বারা পরিচালিত।",
      phone: "01711000000",
      address: "সদর রোড",
      division: "রংপুর",
      district: "লালমনিরহাট",
      thana: "সদর",
      openingTime: "08:00",
      closingTime: "20:00",
      openDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU"]),
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      rating: 4.6,
      totalReviews: 180,
      locationId: locationLalmonirhat.id,
    },
  });

  await prisma.subscription.upsert({
    where: { centerId: center1.id },
    update: {},
    create: {
      centerId: center1.id,
      plan: "PRO",
      status: "ACTIVE",
      endsAt: new Date(Date.now() + 365 * 86400000),
    },
  });

  // Services
  const services = [
    { nameBn: "সম্পূর্ণ রক্ত গণনা (CBC)", nameEn: "CBC", category: "রক্ত পরীক্ষা", price: 250, preparation: "খালি পেটে আসুন", reportTime: "৩ ঘণ্টা" },
    { nameBn: "রক্তে শর্করা (ফাস্টিং)", nameEn: "Blood Glucose (Fasting)", category: "রক্ত পরীক্ষা", price: 120, preparation: "৮ ঘণ্টা না খেয়ে আসুন", reportTime: "২ ঘণ্টা" },
    { nameBn: "বুকের এক্স-রে", nameEn: "Chest X-Ray", category: "ইমেজিং", price: 350, preparation: "কোনো বিশেষ প্রস্তুতি নেই", reportTime: "১ ঘণ্টা" },
    { nameBn: "আল্ট্রাসনোগ্রাম (পেট)", nameEn: "USG (Abdomen)", category: "ইমেজিং", price: 600, preparation: "৪ গ্লাস পানি পান করুন", reportTime: "১ ঘণ্টা" },
    { nameBn: "ECG", nameEn: "ECG", category: "হার্ট পরীক্ষা", price: 200, preparation: "কোনো প্রস্তুতি নেই", reportTime: "৩০ মিনিট" },
    { nameBn: "প্রস্রাব পরীক্ষা (R/E)", nameEn: "Urine R/E", category: "প্রস্রাব পরীক্ষা", price: 100, preparation: "সকালের প্রথম প্রস্রাব নিয়ে আসুন", reportTime: "২ ঘণ্টা" },
    { nameBn: "থাইরয়েড (TSH)", nameEn: "TSH", category: "রক্ত পরীক্ষা", price: 400, preparation: "খালি পেটে আসুন", reportTime: "২৪ ঘণ্টা" },
    { nameBn: "HbA1c (ডায়াবেটিস)", nameEn: "HbA1c", category: "রক্ত পরীক্ষা", price: 500, preparation: "খালি পেটে আসুন", reportTime: "৪ ঘণ্টা" },
  ];

  for (let i = 0; i < services.length; i++) {
    await prisma.diagnosticService.upsert({
      where: { id: `service-demo-${i}` },
      update: {},
      create: {
        id: `service-demo-${i}`,
        centerId: center1.id,
        ...services[i],
        isActive: true,
        sortOrder: i,
      },
    });
  }

  // Link doctor to center
  if (createdDoctors[0]) {
    await prisma.centerDoctor.upsert({
      where: { centerId_doctorId: { centerId: center1.id, doctorId: createdDoctors[0].id } },
      update: {},
      create: { centerId: center1.id, doctorId: createdDoctors[0].id },
    });
  }

  console.log("✅ Seeding complete!");
  console.log("\nDemo credentials:");
  console.log("  Patient: patient@demo.com / demo1234");
  console.log("  Doctor:  doctor@demo.com / demo1234");
  console.log("  Center:  center@demo.com / demo1234");
  console.log("  Admin:   admin@demo.com / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
