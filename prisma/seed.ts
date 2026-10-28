import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.users.upsert({
    where: { email: "admin@villabooking.com" },
    update: {},
    create: {
      email: "admin@villabooking.com",
      passwordHash: adminPassword,
      name: "Admin",
      role: Role.ADMIN,
      avatar: null,
      isActive: true,
    },
  });
  console.log("Created admin:", admin.email);

  // Create manajer user
  const manajerPassword = await hash("manajer123", 12);
  const manajer = await prisma.users.upsert({
    where: { email: "manajer@villabooking.com" },
    update: {},
    create: {
      email: "manajer@villabooking.com",
      passwordHash: manajerPassword,
      name: "Manajer Operasional",
      role: Role.MANAJER,
      avatar: null,
      isActive: true,
    },
  });
  console.log("Created manajer:", manajer.email);

  // Create marketing user
  const marketingPassword = await hash("marketing123", 12);
  const marketing = await prisma.users.upsert({
    where: { email: "marketing@villabooking.com" },
    update: {},
    create: {
      email: "marketing@villabooking.com",
      passwordHash: marketingPassword,
      name: "Staff Marketing",
      role: Role.MARKETING,
      avatar: null,
      isActive: true,
    },
  });
  console.log("Created marketing:", marketing.email);

  // Create maintenance user
  const maintenancePassword = await hash("maintenance123", 12);
  const maintenance = await prisma.users.upsert({
    where: { email: "maintenance@villabooking.com" },
    update: {},
    create: {
      email: "maintenance@villabooking.com",
      passwordHash: maintenancePassword,
      name: "Staff Maintenance",
      role: Role.MAINTENANCE,
      avatar: null,
      isActive: true,
    },
  });
  console.log("Created maintenance:", maintenance.email);

  // Create sample villas
  const villas = [
    {
      name: "Flor Villa",
      slug: "flor-villa",
      description:
        "Villa mewah dengan private pool dan pemandangan gunung yang indah. Cocok untuk keluarga atau gathering kecil.",
      pricePerNight: 1500000,
      capacity: 10,
      bedrooms: 2,
      bathrooms: 2,
      location: "Puncak, Bogor",
      amenities: ["Private Pool", "WiFi", "AC", "BBQ Area", "Parking", "Kitchen"],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
        "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      ],
      isFeatured: true,
    },
    {
      name: "Sehamparan Villa",
      slug: "sehamparan-villa",
      description:
        "Villa luas dengan halaman hijau yang asri. Kapasitas besar untuk acara keluarga atau gathering kantor.",
      pricePerNight: 1200000,
      capacity: 20,
      bedrooms: 2,
      bathrooms: 2,
      location: "Cisarua, Bogor",
      amenities: ["Garden", "WiFi", "AC", "BBQ Area", "Parking", "Kitchen", "Karaoke"],
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
      ],
      isFeatured: true,
    },
    {
      name: "The Joanne Villa",
      slug: "the-joanne-villa",
      description:
        "Villa premium dengan desain modern minimalis. Dilengkapi fasilitas lengkap untuk kenyamanan maksimal.",
      pricePerNight: 2300000,
      capacity: 10,
      bedrooms: 3,
      bathrooms: 4,
      location: "Puncak, Bogor",
      amenities: ["Private Pool", "WiFi", "AC", "BBQ Area", "Parking", "Kitchen", "Billiard"],
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
      ],
      isFeatured: true,
    },
    {
      name: "The Imari Villa",
      slug: "the-imari-villa",
      description:
        "Villa eksklusif dengan arsitektur Jepang modern. Suasana tenang dan nyaman untuk relaksasi.",
      pricePerNight: 1900000,
      capacity: 20,
      bedrooms: 3,
      bathrooms: 4,
      location: "Megamendung, Bogor",
      amenities: ["Private Pool", "WiFi", "AC", "Garden", "Parking", "Kitchen", "Hot Tub"],
      images: [
        "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
        "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
        "https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800",
      ],
      isFeatured: false,
    },
    {
      name: "Alora Villa",
      slug: "alora-villa",
      description:
        "Villa besar dengan 6 kamar tidur. Ideal untuk gathering keluarga besar atau acara kantor.",
      pricePerNight: 1900000,
      capacity: 25,
      bedrooms: 6,
      bathrooms: 3,
      location: "Cisarua, Bogor",
      amenities: ["Pool", "WiFi", "AC", "BBQ Area", "Parking", "Kitchen", "Meeting Room"],
      images: [
        "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
      ],
      isFeatured: false,
    },
  ];

  for (const villa of villas) {
    const { ...createData } = villa;
    const created = await prisma.villas.upsert({
      where: { slug: villa.slug },
      update: createData,
      create: createData,
    });
    console.log("Created villa:", created.name);
  }

  // Create site configs
  const configs = [
    { key: "site_name", value: "singgahsana", type: "string" },
    { key: "site_logo", value: "/logo.png", type: "string" },
    { key: "watermark_text", value: "singgahsana", type: "string" },
    { key: "site_description", value: "Pengelola villa terdepan di Puncak, Bogor yang menawarkan akomodasi berkualitas dengan harga terjangkau dan fasilitas modern.", type: "string" },
    { key: "site_tagline", value: "Pengalaman menginap lengkap untuk momen yang lebih berkesan", type: "string" },
    { key: "hero_title", value: "Villa & Resort Booking Puncak Bogor", type: "string" },
    { key: "hero_subtitle", value: "Pengalaman menginap lengkap untuk momen yang lebih berkesan.", type: "string" },
    { key: "hero_image", value: "", type: "string" },
    { key: "hero_video", value: "https://www.youtube.com/embed/_hofBX5yvfE?autoplay=1&mute=1&loop=1&playlist=_hofBX5yvfE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&cc_load_policy=0", type: "string" },
    { key: "auth_video", value: "https://www.youtube.com/embed/_hofBX5yvfE?autoplay=1&mute=1&loop=1&playlist=_hofBX5yvfE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&cc_load_policy=0", type: "string" },
    { key: "login_title", value: "Selamat Datang", type: "string" },
    { key: "login_subtitle", value: "Masuk untuk melihat riwayat booking dan mengelola akun Anda", type: "string" },
    { key: "register_title", value: "Bergabung Bersama Kami", type: "string" },
    { key: "register_subtitle", value: "Daftar sekarang untuk mulai menikmati pengalaman booking villa yang mudah", type: "string" },
    { key: "stats_properties", value: "50+", type: "string" },
    { key: "stats_guests", value: "10K+", type: "string" },
    { key: "stats_rating", value: "4.8", type: "string" },
    { key: "contact_phone_1", value: "(+62) 811-1141-052", type: "string" },
    { key: "contact_phone_2", value: "(+62) 8521-9949-626", type: "string" },
    { key: "contact_email", value: "singgahsana.id@gmail.com", type: "string" },
    { key: "contact_address", value: "Jl. Alternatif Puncak\nCisarua – Bogor 16750", type: "string" },
    { key: "cta_title", value: "Siap Untuk Liburan?", type: "string" },
    { key: "cta_subtitle", value: "Hubungi kami dan dapatkan penawaran terbaik untuk villa impian Anda", type: "string" },
    { key: "primary_color", value: "#2563eb", type: "string" },
    { key: "secondary_color", value: "#10b981", type: "string" },
    { key: "company_name", value: "PT LANDTARA AKSES INDO", type: "string" },
    { key: "social_facebook", value: "https://www.facebook.com/singgahsana", type: "string" },
    { key: "social_instagram", value: "https://www.instagram.com/singgahsana", type: "string" },
    { key: "social_youtube", value: "", type: "string" },
    { key: "social_tiktok", value: "https://www.tiktok.com/@singgahsana", type: "string" },
    { key: "font_body", value: "DM Sans", type: "string" },
    { key: "font_display", value: "Playfair Display", type: "string" },
  ];

  for (const config of configs) {
    await prisma.site_configs.upsert({
      where: { key: config.key },
      update: { value: config.value, type: config.type },
      create: {
        key: config.key,
        value: config.value,
        type: config.type,
      },
    });
  }
  console.log("Created site configs");

  // Create sample testimonials
  const testimonials = [
    {
      name: "Budi Santoso",
      content: "Tempatnya enak banget banyak space buat seru seruan. Staff ramah dan responsif. Pasti balik lagi!",
      rating: 5,
      isFeatured: true,
    },
    {
      name: "Sari Mulyani",
      content: "Villa-nya bersih, pemandangannya luar biasa. Anak-anak senang banget main di kolam renang. Recommended banget untuk keluarga!",
      rating: 5,
      isFeatured: true,
    },
    {
      name: "Andi Pratama",
      content: "Perfect buat gathering kantor. Tempatnya luas, fasilitasnya lengkap, harga sangat terjangkau.",
      rating: 5,
      isFeatured: true,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonials.create({
      data: {
        name: testimonial.name,
        content: testimonial.content,
        rating: testimonial.rating,
        isFeatured: testimonial.isFeatured,
        avatar: null,
        villaId: null,
      },
    });
  }
  console.log("Created testimonials");

  // Create sample promos
  const samplePromos = [
    {
      title: "Promo Liburan Akhir Pekan",
      description: "Diskon 15% untuk booking minimal 2 malam di semua unit villa.",
      discountPercent: 15,
      code: "WEEKEND15",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: "Promo Spesial Keluarga",
      description: "Diskon 20% khusus booking unit berkapasitas di atas 10 orang.",
      discountPercent: 20,
      code: "FAMILY20",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ];

  for (const promo of samplePromos) {
    await prisma.promos.upsert({
      where: { code: promo.code },
      update: {},
      create: promo,
    });
  }
  console.log("Created sample promos");

  // Create sample bookings
  const firstVilla = await prisma.villas.findFirst({ where: { slug: "flor-villa" } });
  const secondVilla = await prisma.villas.findFirst({ where: { slug: "sehamparan-villa" } });

  if (firstVilla) {
    await prisma.bookings.upsert({
      where: { code: "BK-FLOR01" },
      update: {},
      create: {
        code: "BK-FLOR01",
        villaId: firstVilla.id,
        guestName: "Rian Hidayat",
        guestPhone: "081234567890",
        guestEmail: "rian.hidayat@example.com",
        checkIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        totalPrice: firstVilla.pricePerNight * 2,
        status: "PENDING",
        notes: "Menunggu bukti transfer bank BCA nominal Rp 3.000.000",
        assignedToId: manajer.id,
      },
    });

    await prisma.bookings.upsert({
      where: { code: "BK-FLOR02" },
      update: {},
      create: {
        code: "BK-FLOR02",
        villaId: firstVilla.id,
        guestName: "Dewi Anggraini",
        guestPhone: "081987654321",
        guestEmail: "dewi.a@example.com",
        checkIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalPrice: firstVilla.pricePerNight * 2,
        status: "CONFIRMED",
        notes: "Pembayaran telah diverifikasi. Tamu minta extra bed.",
        assignedToId: manajer.id,
      },
    });
  }

  if (secondVilla) {
    await prisma.bookings.upsert({
      where: { code: "BK-SEHAM01" },
      update: {},
      create: {
        code: "BK-SEHAM01",
        villaId: secondVilla.id,
        guestName: "Hendra Wijaya",
        guestPhone: "081345678912",
        guestEmail: "hendra.w@example.com",
        checkIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        totalPrice: secondVilla.pricePerNight * 2,
        status: "COMPLETED",
        notes: "Selesai check-out. Unit siap dibersihkan.",
        assignedToId: manajer.id,
      },
    });

    // Update status villa to CLEANING for demo
    await prisma.villas.update({
      where: { id: secondVilla.id },
      data: { status: "CLEANING" },
    });
  }
  console.log("Created sample bookings");

  // Create sample maintenance tasks
  if (firstVilla && secondVilla) {
    const existingTasks = await prisma.maintenance_tasks.count();
    if (existingTasks === 0) {
      await prisma.maintenance_tasks.create({
        data: {
          villaId: secondVilla.id,
          assignedToId: maintenance.id,
          title: "Housekeeping & Penggantian Linen Kamar Utama",
          description: "Pembersihan total pasca checkout tamu Hendra Wijaya.",
          isCompleted: false,
          dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      });

      await prisma.maintenance_tasks.create({
        data: {
          villaId: firstVilla.id,
          assignedToId: maintenance.id,
          title: "Pembersihan & Treatment Kolam Renang",
          description: "Pemeriksaan filter sirkulasi dan kadar klorin air kolam renang.",
          isCompleted: false,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await prisma.maintenance_tasks.create({
        data: {
          villaId: firstVilla.id,
          assignedToId: maintenance.id,
          title: "Pengecekan Water Heater Kamar Mandi 2",
          description: "Water heater sudah dicek dan kembali berfungsi normal.",
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }
  }
  console.log("Created sample maintenance tasks");

  // Create sample activity logs
  const existingLogs = await prisma.activity_logs.count();
  if (existingLogs === 0) {
    await prisma.activity_logs.create({
      data: {
        userId: admin.id,
        action: "UPDATE_CONFIG",
        entity: "site_configs",
        details: "Memperbarui konfigurasi nomor WhatsApp dan hero video.",
      },
    });

    await prisma.activity_logs.create({
      data: {
        userId: manajer.id,
        action: "CONFIRM_PAYMENT",
        entity: "bookings",
        entityId: "BK-FLOR02",
        details: "Verifikasi bukti transfer manual sebesar Rp 3.000.000 untuk tamu Dewi Anggraini.",
      },
    });
  }
  console.log("Created sample activity logs");

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
