import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Sample data
const users = [
  // Citizens
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    password: "password123",
    phone: "+91-9876543210",
    address: "123 Rohini Sector 8, Delhi",
    role: "CITIZEN",
    ngoStatus: "VERIFIED",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    password: "password123",
    phone: "+91-9876543211",
    address: "456 Dwarka Sector 10, Delhi",
    role: "CITIZEN",
    ngoStatus: "VERIFIED",
  },
  {
    name: "Amit Patel",
    email: "amit.patel@email.com",
    password: "password123",
    phone: "+91-9876543212",
    address: "789 Gurgaon Sector 44, Haryana",
    role: "CITIZEN",
    ngoStatus: "VERIFIED",
  },
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@email.com",
    password: "password123",
    phone: "+91-9876543213",
    address: "321 Noida Sector 62, UP",
    role: "CITIZEN",
    ngoStatus: "VERIFIED",
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@email.com",
    password: "password123",
    phone: "+91-9876543214",
    address: "654 Faridabad Sector 16, Haryana",
    role: "CITIZEN",
    ngoStatus: "VERIFIED",
  },

  // NGOs - Mixture of VERIFIED and PENDING
  {
    name: "Green Earth Foundation",
    email: "contact@greenearth.org",
    password: "password123",
    phone: "+91-9876543301",
    address: "456 Environmental Street, Gurgaon",
    role: "NGO",
    ngoStatus: "VERIFIED",
    organization: "Green Earth Foundation",
    serviceArea: "Gurgaon",
  },
  {
    name: "Urban Development Trust",
    email: "info@urbantrust.org",
    password: "password123",
    phone: "+91-9876543302",
    address: "789 Civic Center, Delhi",
    role: "NGO",
    ngoStatus: "VERIFIED",
    organization: "Urban Development Trust",
    serviceArea: "Delhi",
  },
  {
    name: "Community Care Initiative",
    email: "help@communitycare.org",
    password: "password123",
    phone: "+91-9876543303",
    address: "321 Social Welfare Road, Noida",
    role: "NGO",
    ngoStatus: "PENDING", // Pending verification for admin demo
    organization: "Community Care Initiative",
    serviceArea: "Noida",
  },
  {
    name: "Public Service Alliance",
    email: "support@psa.org",
    password: "password123",
    phone: "+91-9876543304",
    address: "654 Service Lane, Dwarka",
    role: "NGO",
    ngoStatus: "PENDING", // Pending verification
    organization: "Public Service Alliance",
    serviceArea: "Dwarka",
  },

  // Admins
  {
    name: "Admin User",
    email: "admin@citycouncil.gov",
    password: "admin123",
    phone: "+91-9876543401",
    address: "Delhi Municipal Corporation, Delhi",
    role: "ADMIN",
    ngoStatus: "VERIFIED",
    department: "Public Works",
  },
  {
    name: "John Smith",
    email: "john.smith@citycouncil.gov",
    password: "admin123",
    phone: "+91-9876543402",
    address: "Gurgaon Municipal Office, Haryana",
    role: "ADMIN",
    ngoStatus: "VERIFIED",
    department: "Sanitation",
  },
];

const complaintCategories = [
  "Pothole",
  "Garbage Collection",
  "Street Light",
  "Water Supply",
  "Drainage",
  "Road Repair",
  "Traffic Signal",
  "Public Toilet",
  "Park Maintenance",
  "Electricity",
  "Sewage",
  "Footpath",
];

const statuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"];

const locations = [
  { name: "Rohini Sector 8", lat: 28.745, lng: 77.125, city: "Delhi" },
  { name: "Dwarka Sector 10", lat: 28.58, lng: 77.04, city: "Delhi" },
  { name: "Gurgaon Sector 44", lat: 28.46, lng: 77.03, city: "Gurgaon, Haryana" },
  { name: "Noida Sector 62", lat: 28.625, lng: 77.375, city: "Noida, UP" },
  { name: "Faridabad Sector 16", lat: 28.385, lng: 77.305, city: "Faridabad, Haryana" },
];

function generateComplaintId(index: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `CR${y}${m}${d}${String(index + 1000).slice(-4)}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("🌱 Starting database seeding...");

  console.log("🗑️ Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaintConfirmation.deleteMany();
  await prisma.complaintHelper.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleared");

  console.log("👥 Creating users...");
  const createdUsers = [];
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const { password, ...userDataWithoutPassword } = userData;
    const user = await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        passwordHash,
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Created ${createdUsers.length} users`);

  const citizenUsers = createdUsers.filter((user) => user.role === "CITIZEN");
  const ngoUsers = createdUsers.filter((user) => user.role === "NGO");
  const adminUser = createdUsers.find((user) => user.role === "ADMIN")!;

  console.log("📝 Creating complaints...");
  const complaints = [];
  const numComplaints = 60; // Clean dataset

  for (let i = 0; i < numComplaints; i++) {
    const citizen = getRandomElement(citizenUsers);
    const location = getRandomElement(locations);
    const category = getRandomElement(complaintCategories);
    const status = getRandomElement(statuses);
    const createdAt = getRandomDate(new Date(2025, 0, 1), new Date());

    const complaint = await prisma.complaint.create({
      data: {
        complaintId: generateComplaintId(i),
        title: `${category} Issue in ${location.name}`,
        description: `Severe ${category.toLowerCase()} reported in ${location.name}. Needs prompt resolution from municipal authorities.`,
        category,
        priority: "medium",
        status,
        latitude: location.lat + (Math.random() - 0.5) * 0.005,
        longitude: location.lng + (Math.random() - 0.5) * 0.005,
        address: `Block ${i + 1}, ${location.name}, ${location.city}`,
        imageUrl: `https://picsum.photos/400/300?random=${i}`,
        reportedById: citizen.id,
        assignedDept: getRandomElement([
          "Public Works",
          "Sanitation",
          "Roads & Transport",
          "Water Board",
          "Electricity Board",
        ]),
        createdAt,
        updatedAt: getRandomDate(createdAt, new Date()),
      },
    });
    complaints.push(complaint);
  }
  console.log(`✅ Created ${complaints.length} complaints`);

  console.log("👍 Seeding crowd confirmations...");
  let confirmationsCountTotal = 0;
  for (const complaint of complaints) {
    if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") continue;

    // Pick 1 to 4 other citizens to confirm this issue
    const otherCitizens = citizenUsers.filter((c) => c.id !== complaint.reportedById);
    const numConfirms = Math.floor(Math.random() * 4);

    for (let j = 0; j < numConfirms; j++) {
      const confirmingUser = otherCitizens[j];
      if (confirmingUser) {
        await prisma.complaintConfirmation.create({
          data: {
            complaintId: complaint.id,
            userId: confirmingUser.id,
            createdAt: getRandomDate(complaint.createdAt, new Date()),
          },
        });
        confirmationsCountTotal++;
      }
    }

    if (numConfirms > 0) {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { confirmationsCount: numConfirms },
      });
    }
  }
  console.log(`✅ Created ${confirmationsCountTotal} confirmations`);

  console.log("📜 Seeding status history audit logs...");
  for (const complaint of complaints) {
    if (complaint.status !== "PENDING") {
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: "PENDING",
          newStatus: complaint.status,
          changedById: adminUser.id,
          changedByRole: "ADMIN",
          notes: `Status updated to ${complaint.status} by Municipal Admin`,
          createdAt: getRandomDate(complaint.createdAt, complaint.updatedAt),
        },
      });
    }
  }
  console.log("✅ Audit trail histories created");

  console.log("🤝 Creating NGO helpers...");
  const verifiedNgos = ngoUsers.filter((n) => n.ngoStatus === "VERIFIED");
  for (let i = 0; i < 20; i++) {
    const complaint = getRandomElement(complaints);
    const ngo = getRandomElement(verifiedNgos);
    await prisma.complaintHelper.upsert({
      where: {
        complaintId_userId: {
          complaintId: complaint.id,
          userId: ngo.id,
        },
      },
      update: {},
      create: {
        complaintId: complaint.id,
        userId: ngo.id,
        status: "HELPING",
        message: `Pledged support to resolve ${complaint.category} in ${complaint.address}`,
      },
    });
  }
  console.log("✅ NGO Helpers created");

  console.log("🔔 Creating sample notifications...");
  for (const citizen of citizenUsers) {
    await prisma.notification.create({
      data: {
        userId: citizen.id,
        title: "Welcome to JanSamvedan",
        message: "Report civic issues in your neighborhood or confirm existing issues to prioritize action.",
        isRead: false,
      },
    });
  }
  console.log("✅ Notifications created");

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });