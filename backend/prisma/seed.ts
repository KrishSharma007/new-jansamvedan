import { PrismaClient, UserRole, ComplaintStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data
const users = [
  // Citizens
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    password: 'password123',
    phone: '+91-9876543210',
    address: '123 Rohini Sector 8, Delhi',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    password: 'password123',
    phone: '+91-9876543211',
    address: '456 Dwarka Sector 10, Delhi',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@email.com',
    password: 'password123',
    phone: '+91-9876543212',
    address: '789 Gurgaon Sector 44, Haryana',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@email.com',
    password: 'password123',
    phone: '+91-9876543213',
    address: '321 Noida Sector 62, UP',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    password: 'password123',
    phone: '+91-9876543214',
    address: '654 Faridabad Sector 16, Haryana',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Anita Desai',
    email: 'anita.desai@email.com',
    password: 'password123',
    phone: '+91-9876543215',
    address: '987 Bahadurgarh City, Haryana',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Ravi Nair',
    email: 'ravi.nair@email.com',
    password: 'password123',
    phone: '+91-9876543216',
    address: '147 Rohini Sector 15, Delhi',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Kavya Iyer',
    email: 'kavya.iyer@email.com',
    password: 'password123',
    phone: '+91-9876543217',
    address: '258 Dwarka Sector 21, Delhi',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Suresh Gupta',
    email: 'suresh.gupta@email.com',
    password: 'password123',
    phone: '+91-9876543218',
    address: '369 Gurgaon Cyber City, Haryana',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Meera Joshi',
    email: 'meera.joshi@email.com',
    password: 'password123',
    phone: '+91-9876543219',
    address: '741 Noida Sector 137, UP',
    role: UserRole.CITIZEN,
  },

  // NGOs
  {
    name: 'Green Earth Foundation',
    email: 'contact@greenearth.org',
    password: 'password123',
    phone: '+91-9876543301',
    address: '456 Environmental Street, Gurgaon',
    role: UserRole.NGO,
    organization: 'Green Earth Foundation',
    serviceArea: 'Gurgaon & Faridabad',
  },
  {
    name: 'Urban Development Trust',
    email: 'info@urbantrust.org',
    password: 'password123',
    phone: '+91-9876543302',
    address: '789 Civic Center, Delhi',
    role: UserRole.NGO,
    organization: 'Urban Development Trust',
    serviceArea: 'Delhi NCR',
  },
  {
    name: 'Community Care Initiative',
    email: 'help@communitycare.org',
    password: 'password123',
    phone: '+91-9876543303',
    address: '321 Social Welfare Road, Noida',
    role: UserRole.NGO,
    organization: 'Community Care Initiative',
    serviceArea: 'Noida & Greater Noida',
  },
  {
    name: 'Public Service Alliance',
    email: 'support@psa.org',
    password: 'password123',
    phone: '+91-9876543304',
    address: '654 Service Lane, Dwarka',
    role: UserRole.NGO,
    organization: 'Public Service Alliance',
    serviceArea: 'Dwarka & Rohini',
  },
  {
    name: 'Civic Action Group',
    email: 'action@civicgroup.org',
    password: 'password123',
    phone: '+91-9876543305',
    address: '987 Action Street, Bahadurgarh',
    role: UserRole.NGO,
    organization: 'Civic Action Group',
    serviceArea: 'Bahadurgarh & Faridabad',
  },

  // Admins
  {
    name: 'Admin User',
    email: 'admin@citycouncil.gov',
    password: 'admin123',
    phone: '+91-9876543401',
    address: 'Delhi Municipal Corporation, Delhi',
    role: UserRole.ADMIN,
    department: 'Public Works',
  },
  {
    name: 'John Smith',
    email: 'john.smith@citycouncil.gov',
    password: 'admin123',
    phone: '+91-9876543402',
    address: 'Gurgaon Municipal Office, Haryana',
    role: UserRole.ADMIN,
    department: 'Sanitation',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@citycouncil.gov',
    password: 'admin123',
    phone: '+91-9876543403',
    address: 'Noida Authority Office, UP',
    role: UserRole.ADMIN,
    department: 'Roads & Transport',
  },
];

const complaintCategories = [
  'Pothole',
  'Garbage Collection',
  'Street Light',
  'Water Supply',
  'Drainage',
  'Road Repair',
  'Traffic Signal',
  'Public Toilet',
  'Park Maintenance',
  'Electricity',
  'Sewage',
  'Footpath',
  'Bus Stop',
  'Traffic Sign',
  'Public Garden',
];

const priorities = ['low', 'medium', 'high'];

const statuses = [
  ComplaintStatus.PENDING,
  ComplaintStatus.ASSIGNED,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.REJECTED,
];

const locations = [
  // Delhi NCR Areas
  { name: 'Rohini Sector 1', lat: 28.7404, lng: 77.1200 },
  { name: 'Rohini Sector 8', lat: 28.7450, lng: 77.1250 },
  { name: 'Rohini Sector 15', lat: 28.7500, lng: 77.1300 },
  { name: 'Rohini Sector 18', lat: 28.7550, lng: 77.1350 },
  { name: 'Rohini Sector 24', lat: 28.7600, lng: 77.1400 },
  
  { name: 'Dwarka Sector 1', lat: 28.5700, lng: 77.0300 },
  { name: 'Dwarka Sector 6', lat: 28.5750, lng: 77.0350 },
  { name: 'Dwarka Sector 10', lat: 28.5800, lng: 77.0400 },
  { name: 'Dwarka Sector 12', lat: 28.5850, lng: 77.0450 },
  { name: 'Dwarka Sector 21', lat: 28.5900, lng: 77.0500 },
  
  { name: 'Gurgaon Sector 14', lat: 28.4500, lng: 77.0200 },
  { name: 'Gurgaon Sector 29', lat: 28.4550, lng: 77.0250 },
  { name: 'Gurgaon Sector 44', lat: 28.4600, lng: 77.0300 },
  { name: 'Gurgaon Sector 56', lat: 28.4650, lng: 77.0350 },
  { name: 'Gurgaon Cyber City', lat: 28.4700, lng: 77.0400 },
  
  { name: 'Bahadurgarh City', lat: 28.6800, lng: 76.9200 },
  { name: 'Bahadurgarh Industrial Area', lat: 28.6850, lng: 76.9250 },
  { name: 'Bahadurgarh Sector 1', lat: 28.6900, lng: 76.9300 },
  
  { name: 'Faridabad Sector 15', lat: 28.3800, lng: 77.3000 },
  { name: 'Faridabad Sector 16', lat: 28.3850, lng: 77.3050 },
  { name: 'Faridabad Sector 21', lat: 28.3900, lng: 77.3100 },
  { name: 'Faridabad Industrial Area', lat: 28.3950, lng: 77.3150 },
  
  { name: 'Noida Sector 18', lat: 28.6200, lng: 77.3700 },
  { name: 'Noida Sector 62', lat: 28.6250, lng: 77.3750 },
  { name: 'Noida Sector 63', lat: 28.6300, lng: 77.3800 },
  { name: 'Noida Sector 137', lat: 28.6350, lng: 77.3850 },
  { name: 'Noida Greater Noida', lat: 28.6400, lng: 77.3900 },
  
  // Original Bangalore areas (keeping some for variety)
  { name: 'MG Road', lat: 12.9716, lng: 77.5946 },
  { name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
];

function generateComplaintId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const t = String(now.getTime()).slice(-6);
  return `CR${y}${m}${d}${t}`;
}

function generateRealisticAddress(location: { name: string; lat: number; lng: number }): string {
  const streetNumbers = ['123', '45', '78', '156', '89', '234', '67', '189', '345', '12'];
  const streetNames = ['Main Road', 'Park Street', 'Garden Avenue', 'Market Lane', 'Station Road', 'School Street', 'Hospital Road', 'Temple Street', 'Residential Area', 'Commercial Complex'];
  const houseTypes = ['House', 'Apartment', 'Building', 'Complex', 'Colony'];
  
  const streetNumber = getRandomElement(streetNumbers);
  const streetName = getRandomElement(streetNames);
  const houseType = getRandomElement(houseTypes);
  
  // Determine city based on location
  let city = 'Delhi';
  if (location.name.includes('Gurgaon')) city = 'Gurgaon, Haryana';
  else if (location.name.includes('Noida')) city = 'Noida, Uttar Pradesh';
  else if (location.name.includes('Faridabad')) city = 'Faridabad, Haryana';
  else if (location.name.includes('Bahadurgarh')) city = 'Bahadurgarh, Haryana';
  else if (location.name.includes('Bangalore') || location.name.includes('MG Road') || location.name.includes('Koramangala') || location.name.includes('Whitefield') || location.name.includes('Electronic City')) {
    city = 'Bangalore, Karnataka';
  }
  
  return `${streetNumber}, ${streetName}, ${location.name}, ${city}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🗑️ Clearing existing data...');
  await prisma.complaintHelper.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared');

  // Create users
  console.log('👥 Creating users...');
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

  // Get citizen and NGO users for complaints
  const citizenUsers = createdUsers.filter(user => user.role === UserRole.CITIZEN);
  const ngoUsers = createdUsers.filter(user => user.role === UserRole.NGO);

  // Create complaints
  console.log('📝 Creating complaints...');
  const complaints = [];
  const numComplaints = 500; // Large dataset

  for (let i = 0; i < numComplaints; i++) {
    const citizen = getRandomElement(citizenUsers);
    const location = getRandomElement(locations);
    const category = getRandomElement(complaintCategories);
    const priority = getRandomElement(priorities);
    const status = getRandomElement(statuses);
    const createdAt = getRandomDate(
      new Date(2024, 0, 1), // Start of 2024
      new Date() // Now
    );

    const complaint = await prisma.complaint.create({
      data: {
        complaintId: generateComplaintId(),
        title: `${category} Issue in ${location.name}`,
        description: `Detailed description of the ${category.toLowerCase()} problem in ${location.name}. This issue has been affecting the local community and requires immediate attention from the concerned authorities.`,
        category,
        priority,
        status,
        latitude: location.lat + (Math.random() - 0.5) * 0.01, // Add some randomness
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        address: generateRealisticAddress(location),
        imageUrl: Math.random() > 0.7 ? `https://picsum.photos/400/300?random=${i}` : null,
        reportedById: citizen.id,
        assignedDept: getRandomElement(['Public Works', 'Sanitation', 'Roads & Transport', 'Water Board', 'Electricity Board']),
        createdAt,
        updatedAt: getRandomDate(createdAt, new Date()),
      },
    });
    complaints.push(complaint);
  }
  console.log(`✅ Created ${complaints.length} complaints`);

  // Create helpers (NGOs helping with complaints)
  console.log('🤝 Creating helpers...');
  const helpers = [];
  const numHelpers = 800; // Many helping relationships

  for (let i = 0; i < numHelpers; i++) {
    const complaint = getRandomElement(complaints);
    const ngo = getRandomElement(ngoUsers);
    const status = getRandomElement(['HELPING', 'CONTACTED', 'DECLINED']);
    const createdAt = getRandomDate(
      complaint.createdAt,
      new Date()
    );

    // Check if this NGO is already helping with this complaint
    const existingHelper = await prisma.complaintHelper.findFirst({
      where: {
        complaintId: complaint.id,
        userId: ngo.id,
      },
    });

    if (!existingHelper) {
      const helper = await prisma.complaintHelper.create({
        data: {
          complaintId: complaint.id,
          userId: ngo.id,
          status,
          message: status === 'HELPING' ? `We are committed to helping resolve this ${complaint.category.toLowerCase()} issue in ${complaint.address}` : null,
          createdAt,
          updatedAt: getRandomDate(createdAt, new Date()),
        },
      });
      helpers.push(helper);
    }
  }
  console.log(`✅ Created ${helpers.length} helpers`);

  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log(`👥 Users: ${createdUsers.length}`);
  console.log(`   - Citizens: ${citizenUsers.length}`);
  console.log(`   - NGOs: ${ngoUsers.length}`);
  console.log(`   - Admins: ${createdUsers.filter(u => u.role === UserRole.ADMIN).length}`);
  console.log(`📝 Complaints: ${complaints.length}`);
  console.log(`🤝 Helpers: ${helpers.length}`);
  console.log(`📈 Average helpers per complaint: ${(helpers.length / complaints.length).toFixed(2)}`);

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });