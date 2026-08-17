import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function genComplaintId(i: number): string {
  const d = new Date();
  return `CR${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}${String(100000 + i)}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`⚡ Database already initialized with ${userCount} users. Skipping seed.`);
    console.log(`   (To force a fresh reset & re-seed, run: FORCE_SEED=true npm run db:seed)`);
    return;
  }

  console.log("🌱 Seeding comprehensive Rohini civic dataset (all major sectors & landmarks)...");

  await prisma.notification.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaintConfirmation.deleteMany();
  await prisma.complaintHelper.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  // ── 1. Municipal Administration Officials ──
  const admin1 = await prisma.user.create({ data: { name: "Rajesh Verma", email: "admin@jansamvedan.org", passwordHash: hash, phone: "9811000001", role: "ADMIN", department: "Municipal Corporation - Rohini Zone", address: "Zonal Municipal Office, Sector 11, Rohini, Delhi - 110085" } });
  const admin2 = await prisma.user.create({ data: { name: "Sunita Sharma", email: "sunita.admin@jansamvedan.org", passwordHash: hash, phone: "9811000002", role: "ADMIN", department: "Public Works Department", address: "PWD Division Office, Sector 3, Rohini, Delhi - 110085" } });
  const admin3 = await prisma.user.create({ data: { name: "Anil Kumar Gupta", email: "anil.djb@jansamvedan.org", passwordHash: hash, phone: "9811000003", role: "ADMIN", department: "Delhi Jal Board", address: "DJB Sub-Division Office, Sector 15, Rohini, Delhi - 110085" } });
  const admin4 = await prisma.user.create({ data: { name: "Inspector Manoj Tyagi", email: "manoj.traffic@jansamvedan.org", passwordHash: hash, phone: "9811000004", role: "ADMIN", department: "Delhi Traffic Police", address: "Traffic Circle Office, Outer Ring Road, Pitampura, Delhi - 110034" } });
  const admin5 = await prisma.user.create({ data: { name: "Geeta Pillai", email: "geeta.bses@jansamvedan.org", passwordHash: hash, phone: "9811000005", role: "ADMIN", department: "BSES Rajdhani Power", address: "BSES Sub-Station, Sector 22, Rohini, Delhi - 110086" } });

  const admins = [admin1, admin2, admin3, admin4, admin5];

  // ── 2. NGO Organizations ──
  const ngo1 = await prisma.user.create({ data: { name: "Amit Choudhary", email: "amit@cleanrohini.org", passwordHash: hash, phone: "9899100001", role: "NGO", organization: "Clean Rohini Foundation", serviceArea: "Rohini Sector 7, Sector 11, Sector 3", ngoStatus: "VERIFIED", address: "Community Centre, Sector 7, Rohini, Delhi - 110085" } });
  const ngo2 = await prisma.user.create({ data: { name: "Priya Mehta", email: "priya@greendelhi.org", passwordHash: hash, phone: "9899100002", role: "NGO", organization: "Green Delhi Initiative", serviceArea: "Shalimar Bagh, Prashant Vihar, Rohini Sector 14", ngoStatus: "VERIFIED", address: "Plot 12, Institutional Area, Prashant Vihar, Delhi - 110085" } });
  const ngo3 = await prisma.user.create({ data: { name: "Deepak Rana", email: "deepak@youthaid.in", passwordHash: hash, phone: "9899100003", role: "NGO", organization: "Youth Aid Welfare Society", serviceArea: "Budh Vihar, Pooth Kalan, Rithala", ngoStatus: "PENDING", address: "Plot 45, Budh Vihar Phase-1, Rohini, Delhi - 110086" } });
  const ngo4 = await prisma.user.create({ data: { name: "Suresh Rawat", email: "suresh@roadsavers.org", passwordHash: hash, phone: "9899100004", role: "NGO", organization: "Rohini Road Safety Guild", serviceArea: "Rohini Sector 8, Sector 9, Sector 18, Sector 24", ngoStatus: "VERIFIED", address: "Shop 14, DDA Market, Sector 8, Rohini, Delhi - 110085" } });
  const ngo5 = await prisma.user.create({ data: { name: "Pooja Singhania", email: "pooja@animalcaredelhi.org", passwordHash: hash, phone: "9899100005", role: "NGO", organization: "North Delhi Animal Welfare Society", serviceArea: "Rohini Sector 15, Sector 16, Sector 22, Sector 25", ngoStatus: "VERIFIED", address: "Block C-5, Sector 16, Rohini, Delhi - 110085" } });
  const ngo6 = await prisma.user.create({ data: { name: "Tarun Bhatia", email: "tarun@pitampurahelps.org", passwordHash: hash, phone: "9899100006", role: "NGO", organization: "Pitampura Civic Action Group", serviceArea: "Pitampura, Kohat Enclave, Netaji Subhash Place", ngoStatus: "VERIFIED", address: "B-47, Kohat Enclave, Pitampura, Delhi - 110034" } });
  const ngo7 = await prisma.user.create({ data: { name: "Kavya Nair", email: "kavya@shalimarbag.org", passwordHash: hash, phone: "9899100007", role: "NGO", organization: "Shalimar Bagh Residents Welfare Association", serviceArea: "Shalimar Bagh, Azadpur, Ashok Vihar", ngoStatus: "VERIFIED", address: "Block AJ, Shalimar Bagh, Delhi - 110088" } });

  const ngos = [ngo1, ngo2, ngo3, ngo4, ngo5, ngo6, ngo7];

  // ── 3. Citizens across all Rohini sectors & nearby areas ──
  const c1  = await prisma.user.create({ data: { name: "Vikram Singh",       email: "vikram@gmail.com",           passwordHash: hash, phone: "9871200001", role: "CITIZEN", address: "B-4/12, Sector 7, Rohini, Delhi - 110085" } });
  const c2  = await prisma.user.create({ data: { name: "Neha Gupta",         email: "neha.gupta@yahoo.com",       passwordHash: hash, phone: "9871200002", role: "CITIZEN", address: "C-2/56, Sector 16, Rohini, Delhi - 110085" } });
  const c3  = await prisma.user.create({ data: { name: "Rahul Jain",         email: "rahul.jain@outlook.com",     passwordHash: hash, phone: "9871200003", role: "CITIZEN", address: "A-1/34, Sector 22, Rohini, Delhi - 110086" } });
  const c4  = await prisma.user.create({ data: { name: "Pooja Devi",         email: "pooja.devi@gmail.com",       passwordHash: hash, phone: "9871200004", role: "CITIZEN", address: "D-3/67, Sector 3, Rohini, Delhi - 110085" } });
  const c5  = await prisma.user.create({ data: { name: "Sanjay Kumar",       email: "sanjay.k@gmail.com",         passwordHash: hash, phone: "9871200005", role: "CITIZEN", address: "E-5/89, Sector 11, Rohini, Delhi - 110085" } });
  const c6  = await prisma.user.create({ data: { name: "Meera Rao",          email: "meera.rao@gmail.com",        passwordHash: hash, phone: "9871200006", role: "CITIZEN", address: "F-1/23, Prashant Vihar, Delhi - 110085" } });
  const c7  = await prisma.user.create({ data: { name: "Arjun Thakur",       email: "arjun.t@gmail.com",          passwordHash: hash, phone: "9871200007", role: "CITIZEN", address: "G-7/45, Sector 24, Rohini, Delhi - 110086" } });
  const c8  = await prisma.user.create({ data: { name: "Kavita Sharma",      email: "kavita.s@hotmail.com",       passwordHash: hash, phone: "9871200008", role: "CITIZEN", address: "H-Block, Budh Vihar Phase-1, Rohini, Delhi - 110086" } });
  const c9  = await prisma.user.create({ data: { name: "Mohit Aggarwal",     email: "mohit.aggarwal@gmail.com",   passwordHash: hash, phone: "9871200009", role: "CITIZEN", address: "Pocket B, Sector 8, Rohini, Delhi - 110085" } });
  const c10 = await prisma.user.create({ data: { name: "Ritu Malhotra",      email: "ritu.malhotra@gmail.com",    passwordHash: hash, phone: "9871200010", role: "CITIZEN", address: "D-Block, Sector 14, Rohini, Delhi - 110085" } });
  const c11 = await prisma.user.create({ data: { name: "Harish Chawla",      email: "harish.chawla@yahoo.co.in",  passwordHash: hash, phone: "9871200011", role: "CITIZEN", address: "Pocket 12, Sector 20, Rohini, Delhi - 110086" } });
  const c12 = await prisma.user.create({ data: { name: "Divya Bansal",       email: "divya.bansal@gmail.com",     passwordHash: hash, phone: "9871200012", role: "CITIZEN", address: "B-3/88, Sector 15, Rohini, Delhi - 110085" } });
  const c13 = await prisma.user.create({ data: { name: "Alok Tiwari",        email: "alok.tiwari@outlook.com",    passwordHash: hash, phone: "9871200013", role: "CITIZEN", address: "Main Bazaar Road, Pooth Kalan Village, Delhi - 110086" } });
  const c14 = await prisma.user.create({ data: { name: "Simran Kaur",        email: "simran.kaur@gmail.com",      passwordHash: hash, phone: "9871200014", role: "CITIZEN", address: "Guru Harkishan Nagar, Pitampura, Delhi - 110034" } });
  const c15 = await prisma.user.create({ data: { name: "Vivek Saxena",       email: "vivek.saxena@rediffmail.com",passwordHash: hash, phone: "9871200015", role: "CITIZEN", address: "Sector 9, Deepali Enclave, Rohini, Delhi - 110085" } });
  const c16 = await prisma.user.create({ data: { name: "Ananya Das",         email: "ananya.das@gmail.com",       passwordHash: hash, phone: "9871200016", role: "CITIZEN", address: "Pocket 4, Sector 25, Rohini, Delhi - 110086" } });
  const c17 = await prisma.user.create({ data: { name: "Rakesh Pandey",      email: "rakesh.pandey@gmail.com",    passwordHash: hash, phone: "9871200017", role: "CITIZEN", address: "Flat 302, Shri Ram Apartment, Sector 6, Rohini, Delhi" } });
  const c18 = await prisma.user.create({ data: { name: "Sunita Yadav",       email: "sunita.yadav@gmail.com",     passwordHash: hash, phone: "9871200018", role: "CITIZEN", address: "Pocket 1, Sector 13, Rohini, Delhi - 110085" } });
  const c19 = await prisma.user.create({ data: { name: "Aman Verma",         email: "aman.verma@gmail.com",       passwordHash: hash, phone: "9871200019", role: "CITIZEN", address: "Rithala Village Main Road, Rohini, Delhi - 110086" } });
  const c20 = await prisma.user.create({ data: { name: "Preeti Negi",        email: "preeti.negi@gmail.com",      passwordHash: hash, phone: "9871200020", role: "CITIZEN", address: "B-12, Shalimar Bagh Extension, Delhi - 110088" } });
  const c21 = await prisma.user.create({ data: { name: "Dilip Chauhan",      email: "dilip.chauhan@gmail.com",    passwordHash: hash, phone: "9871200021", role: "CITIZEN", address: "Kohat Enclave, Pitampura, Delhi - 110034" } });
  const c22 = await prisma.user.create({ data: { name: "Rekha Batra",        email: "rekha.batra@gmail.com",      passwordHash: hash, phone: "9871200022", role: "CITIZEN", address: "Pocket 3, Sector 23, Rohini, Delhi - 110086" } });
  const c23 = await prisma.user.create({ data: { name: "Nitin Grover",       email: "nitin.grover@gmail.com",     passwordHash: hash, phone: "9871200023", role: "CITIZEN", address: "Shop Area, Netaji Subhash Place, Pitampura, Delhi" } });
  const c24 = await prisma.user.create({ data: { name: "Sangeeta Kapoor",    email: "sangeeta.kapoor@gmail.com",  passwordHash: hash, phone: "9871200024", role: "CITIZEN", address: "Flat 5B, Sector 1, Rohini, Delhi - 110085" } });
  const c25 = await prisma.user.create({ data: { name: "Yogesh Bhardwaj",    email: "yogesh.b@gmail.com",         passwordHash: hash, phone: "9871200025", role: "CITIZEN", address: "DDA Flats, Sector 5, Rohini, Delhi - 110085" } });
  const c26 = await prisma.user.create({ data: { name: "Mamta Srivastava",   email: "mamta.sri@gmail.com",        passwordHash: hash, phone: "9871200026", role: "CITIZEN", address: "A-Block, Sector 10, Rohini, Delhi - 110085" } });
  const c27 = await prisma.user.create({ data: { name: "Rajan Arora",        email: "rajan.arora@gmail.com",      passwordHash: hash, phone: "9871200027", role: "CITIZEN", address: "Pocket 7, Sector 17, Rohini, Delhi - 110086" } });
  const c28 = await prisma.user.create({ data: { name: "Bharti Mishra",      email: "bharti.mishra@gmail.com",    passwordHash: hash, phone: "9871200028", role: "CITIZEN", address: "Sector 21, Rohini, Delhi - 110086" } });

  const citizens = [c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,c21,c22,c23,c24,c25,c26,c27,c28];

  // ── 4. Comprehensive Civic Complaints ──
  // Covers: Sector 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25,
  //         Prashant Vihar, Pitampura, Kohat Enclave, NSP, Shalimar Bagh, Budh Vihar, Pooth Kalan, Rithala, Rohini East & West Metro
  const complaintsData: {
    title: string; desc: string; cat: string; dept: string; pri: string;
    lat: number; lng: number; addr: string; user: typeof c1;
    status: string; confirms: number; days: number; helpers: typeof ngos; anon?: boolean;
  }[] = [

    // ══ SECTOR 1 (near Rithala Metro) ══
    {
      title: "Open sewer drain overflowing onto Sector 1 main road",
      desc: "A cracked sewer pipeline near Pocket 2 in Sector 1 is leaking raw sewage directly onto the main road. The foul smell and health hazard has been persisting for 5 days. Traffic slows to a crawl due to the slippery road surface. Residents fear dengue outbreak.",
      cat: "Sewage", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.7305, lng: 77.1098, addr: "Pocket 2 Main Road, Sector 1, Rohini, Delhi - 110085",
      user: c24, status: "IN_PROGRESS", confirms: 24, days: 5, helpers: [ngo1],
    },
    {
      title: "Street lights non-functional near Rithala Metro Gate 2",
      desc: "The entire 400-metre approach road from Rithala Metro Gate 2 towards Sector 1 residential pockets has been pitch dark for 12 nights. Commuters are using phone torches to navigate. Two mugging incidents were reported last week in this stretch.",
      cat: "Street Light", dept: "BSES Rajdhani Power", pri: "high",
      lat: 28.7318, lng: 77.1077, addr: "Rithala Metro Gate 2 Approach Road, Sector 1, Rohini",
      user: c24, status: "ASSIGNED", confirms: 19, days: 12, helpers: [ngo6],
    },

    // ══ SECTOR 2 ══
    {
      title: "Garbage mound blocking Sector 2 school gate",
      desc: "A 3-meter high pile of uncleared domestic garbage has accumulated directly in front of the Government Primary School entrance in Sector 2. The stench is unbearable and sanitary conditions are affecting school children. MCD cleaning vehicle has not appeared in 9 days.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7285, lng: 77.1115, addr: "Government Primary School Gate, Sector 2, Rohini, Delhi",
      user: c25, status: "PENDING", confirms: 16, days: 9, helpers: [ngo1],
    },

    // ══ SECTOR 3 (Rohini East Metro Area) ══
    {
      title: "Sewage overflow outside Rohini East Metro Station Gate 2",
      desc: "Raw sewage is overflowing onto the pedestrian pathway and road from a damaged manhole outside Rohini East metro station Gate 2. Thousands of daily commuters are forced to step through contaminated sludge. Water mixes with rainwater creating a larger flood zone.",
      cat: "Sewage", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.6975, lng: 77.1112, addr: "Gate 2, Rohini East Metro Station, Sector 3, Delhi",
      user: c4, status: "IN_PROGRESS", confirms: 29, days: 5, helpers: [ngo1],
    },
    {
      title: "Four consecutive broken street lights on Sector 3–5 main road",
      desc: "Four consecutive street light poles on the main arterial road between Sector 3 and Sector 5 have been dead for two weeks. The stretch turns pitch black after sunset, raising serious safety concerns for female commuters returning from Rohini East Metro.",
      cat: "Street Light", dept: "BSES Rajdhani Power", pri: "high",
      lat: 28.6982, lng: 77.1101, addr: "Main Arterial Road between Sector 3 & Sector 5, Rohini",
      user: c4, status: "ASSIGNED", confirms: 17, days: 15, helpers: [],
    },
    {
      title: "Pothole crater at Sector 3–7 junction near petrol pump",
      desc: "A massive pothole (approx. 4 ft x 3 ft, depth 8 inches) has formed at the critical Sector 3–7 junction near the Indian Oil petrol pump. Two two-wheelers have skidded here. Rush hour traffic must swerve into the opposite lane to avoid it.",
      cat: "Pothole", dept: "Public Works Department", pri: "high",
      lat: 28.6990, lng: 77.1125, addr: "Sector 3–7 Junction near Indian Oil Pump, Rohini, Delhi",
      user: c17, status: "PENDING", confirms: 21, days: 7, helpers: [ngo4],
    },

    // ══ SECTOR 5 (DDA Flats & Community Park) ══
    {
      title: "Dead trees obstructing power lines in Sector 5 green belt",
      desc: "Three dry and uprooted trees in the Sector 5 green belt are leaning heavily onto 11 kV overhead BSES cables. During the last two storms the branches sparked against the cable, causing brief power cuts. Risk of electrocution and fire is imminent.",
      cat: "Electricity", dept: "BSES Rajdhani Power", pri: "urgent",
      lat: 28.7025, lng: 77.1088, addr: "Green Belt near DDA Flats, Sector 5, Rohini, Delhi",
      user: c25, status: "ASSIGNED", confirms: 13, days: 4, helpers: [ngo2],
    },
    {
      title: "Community park benches and swings vandalized in Sector 5",
      desc: "All 6 park benches in the Sector 5 DDA community park have been broken and vandalized. The children's swings have exposed sharp steel edges after the seat chains snapped. Parents are afraid to bring children here.",
      cat: "Park Maintenance", dept: "Horticulture & Urban Forestry", pri: "medium",
      lat: 28.7020, lng: 77.1095, addr: "DDA Community Park, Sector 5, Rohini, Delhi",
      user: c25, status: "PENDING", confirms: 8, days: 14, helpers: [ngo2],
    },

    // ══ SECTOR 6 ══
    {
      title: "Burst water main flooding Sector 6 inner lane",
      desc: "A DJB water main has burst near Shri Ram Apartments in Sector 6. Water is gushing continuously onto the road and entering ground floor flats. Entire inner lane is underwater. Supply to nearby sectors is also reduced as a result.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.7052, lng: 77.1135, addr: "Near Shri Ram Apartment, Sector 6, Rohini, Delhi",
      user: c17, status: "IN_PROGRESS", confirms: 32, days: 2, helpers: [ngo1],
    },

    // ══ SECTOR 7 (Residential & Commercial Hub) ══
    {
      title: "Deep pothole near Sector 7 weekly market and Gurudwara entrance",
      desc: "A 3-foot wide, 8-inch deep pothole at the entry of the weekly market near the Gurudwara in Sector 7 causes multiple two-wheelers to skid daily. During rain the water-filled depression becomes invisible to oncoming traffic.",
      cat: "Pothole", dept: "Public Works Department", pri: "high",
      lat: 28.7041, lng: 77.1165, addr: "Main Road near Gurudwara, Sector 7, Rohini, Delhi - 110085",
      user: c1, status: "IN_PROGRESS", confirms: 18, days: 12, helpers: [ngo1, ngo4],
    },
    {
      title: "Overflowing municipal garbage bin at Sector 7 C-Block park",
      desc: "The municipal garbage collection point outside C-Block park has not been cleared for 7 days. Stray cattle and dogs are tearing open bags and scattering waste across the footpath. Severe foul odor is affecting morning walkers and nearby residents.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7035, lng: 77.1148, addr: "C-Block Park Entry, Sector 7, Rohini, Delhi",
      user: c1, status: "ASSIGNED", confirms: 10, days: 7, helpers: [ngo1],
    },
    {
      title: "Open drain slab broken on Sector 7 inner ring road",
      desc: "A storm water drain slab has collapsed near House 145 on the Sector 7 inner ring road, leaving a 2-foot open gap. It is a severe hazard for pedestrians and cyclists — especially dangerous at night when there is no lighting.",
      cat: "Drainage", dept: "Municipal Corporation - Rohini Zone", pri: "urgent",
      lat: 28.7048, lng: 77.1172, addr: "Inner Ring Road near House 145, Sector 7, Rohini, Delhi",
      user: c9, status: "PENDING", confirms: 11, days: 3, helpers: [],
    },
    {
      title: "Illegal commercial encroachment blocking footpath in Sector 7 market",
      desc: "Street vendors and a car repair shop have set up illegal kiosks and car-jack stands on the public footpath along the Sector 7 commercial strip. Pedestrians with disabilities and prams are forced onto the road.",
      cat: "Encroachment", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7038, lng: 77.1158, addr: "Commercial Strip, Sector 7, Rohini, Delhi",
      user: c1, status: "PENDING", confirms: 6, days: 20, helpers: [],
    },

    // ══ SECTOR 8 & 9 (DDA Markets & Residential) ══
    {
      title: "Fallen eucalyptus branch blocking Sector 8 DDA Market service lane",
      desc: "A massive eucalyptus branch snapped during yesterday's storm and is fully blocking the service road behind Sector 8 DDA Market. Delivery vans and emergency vehicles cannot enter. Shop owners are suffering business losses.",
      cat: "Tree Fall", dept: "Horticulture & Urban Forestry", pri: "high",
      lat: 28.7062, lng: 77.1215, addr: "Service Lane behind DDA Market, Sector 8, Rohini",
      user: c9, status: "RESOLVED", confirms: 9, days: 8, helpers: [ngo2],
    },
    {
      title: "DTC bus stop shelter collapsed at Sector 9 D-Block",
      desc: "The tin roof and steel frame of the DTC bus shelter near D-Block in Sector 9 collapsed after strong winds. Exposed jagged metal sheets are dangerous to waiting passengers. The bus stop serves the 721, 944, and 729 routes.",
      cat: "Road Repair", dept: "Public Works Department", pri: "medium",
      lat: 28.7070, lng: 77.1140, addr: "DTC Bus Stop, D-Block, Sector 9, Rohini, Delhi",
      user: c15, status: "RESOLVED", confirms: 11, days: 40, helpers: [ngo4],
    },
    {
      title: "Broken water pipeline causing waterlogging in Sector 8 Pocket B",
      desc: "A sub-surface DJB pipeline appears to have cracked in Sector 8 Pocket B — the ground is soft and water is visibly seeping through the road surface for the last 4 days. The road has developed a dangerous sinkhole risk.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "high",
      lat: 28.7065, lng: 77.1205, addr: "Pocket B, Sector 8, Rohini, Delhi - 110085",
      user: c9, status: "IN_PROGRESS", confirms: 14, days: 4, helpers: [ngo1],
    },

    // ══ SECTOR 10 ══
    {
      title: "Crumbling boundary wall of Sector 10 public park near school",
      desc: "The perimeter wall of the Sector 10 park adjacent to the government primary school has partially collapsed. Loose bricks are scattered on the footpath. Children frequently play near this stretch after school hours.",
      cat: "Park Maintenance", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7080, lng: 77.1155, addr: "A-Block Park, Sector 10, Rohini, Delhi",
      user: c26, status: "ASSIGNED", confirms: 7, days: 11, helpers: [ngo2],
    },

    // ══ SECTOR 11 (Japanese Park, Aggarwal Fun City) ══
    {
      title: "Degraded road surface on route to Japanese Park Gate 3 from Sector 11",
      desc: "The road leading to Japanese Park via Sector 11 Gate 3 has large patches of missing asphalt, deep ruts and loose gravel. School buses, ambulances and tourist vehicles frequently use this corridor — heavy vibrations causing vehicle damage.",
      cat: "Road Repair", dept: "Public Works Department", pri: "medium",
      lat: 28.7098, lng: 77.1189, addr: "Road to Japanese Park Gate 3, Sector 11, Rohini, Delhi",
      user: c5, status: "ASSIGNED", confirms: 9, days: 18, helpers: [ngo4],
    },
    {
      title: "Non-functional traffic signal at Sector 11 main chowk near Fun City Mall",
      desc: "The traffic lights at the Sector 11 main chowk near Aggarwal Fun City Mall have been showing continuous flashing yellow for 10+ days. The junction handles 4 major traffic streams. Multiple near-miss accidents occur every morning and evening during peak hours.",
      cat: "Traffic Signal", dept: "Delhi Traffic Police", pri: "urgent",
      lat: 28.7105, lng: 77.1201, addr: "Sector 11 Main Chowk, near Aggarwal Fun City, Rohini",
      user: c5, status: "IN_PROGRESS", confirms: 26, days: 10, helpers: [],
    },
    {
      title: "Broken drinking water booth leaking near Sector 11 community centre",
      desc: "The MCD water filtration kiosk outside Sector 11 community centre has a burst inlet pipe. Several hundred litres of potable water are wasted daily. The pooling water on the footpath creates a mosquito breeding hazard.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "medium",
      lat: 28.7088, lng: 77.1175, addr: "Community Centre Water Kiosk, Sector 11, Rohini",
      user: c5, status: "PENDING", confirms: 8, days: 4, helpers: [ngo1],
    },

    // ══ SECTOR 13 ══
    {
      title: "Waterlogging for 3 days after rain at Sector 13 Pocket 1 entry",
      desc: "The entry road to Pocket 1 in Sector 13 gets 2–3 feet of standing water during even moderate rainfall, and remains waterlogged for 3 days afterward. The storm drain is completely blocked with silt and plastic waste.",
      cat: "Drainage", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7120, lng: 77.1240, addr: "Pocket 1 Entry Road, Sector 13, Rohini, Delhi",
      user: c18, status: "PENDING", confirms: 22, days: 6, helpers: [ngo1, ngo4],
    },

    // ══ SECTOR 14 & 15 (Schools & Institutional Area) ══
    {
      title: "Speed breakers worn flat outside Bal Bharati School in Sector 14",
      desc: "Speed humps and rumble strips on the road outside Bal Bharati Public School in Sector 14 are completely flat and the yellow road markings have vanished. Cars routinely accelerate through the school zone during drop-off and pick-up, endangering students.",
      cat: "Traffic Sign", dept: "Public Works Department", pri: "high",
      lat: 28.7135, lng: 77.1288, addr: "Road outside Bal Bharati Public School, Sector 14, Rohini",
      user: c10, status: "PENDING", confirms: 19, days: 6, helpers: [ngo4],
    },
    {
      title: "Yellow contaminated tap water in Sector 15 Pocket 3",
      desc: "Residents of Sector 15 Pocket 3 (approx. 800 families) are receiving yellow-coloured, foul-smelling water during morning supply hours. Health officials suspect a sewage mixing contamination in the supply line after the DJB maintenance work last week.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.7162, lng: 77.1254, addr: "Pocket 3, Sector 15, Rohini, Delhi - 110085",
      user: c12, status: "IN_PROGRESS", confirms: 34, days: 3, helpers: [ngo1],
    },
    {
      title: "Dead Gulmohar tree leaning on 11kV power cable in Sector 15 green belt",
      desc: "A dry Gulmohar tree inside Sector 15 green belt is tilting at 30° onto the BSES 11kV overhead line. During the last two storms, branches sparked against the cable. Risk of cable snap and electrocution remains severe.",
      cat: "Electricity", dept: "BSES Rajdhani Power", pri: "high",
      lat: 28.7170, lng: 77.1240, addr: "Green Belt, Sector 15, near Pocket 2, Rohini, Delhi",
      user: c12, status: "ASSIGNED", confirms: 12, days: 9, helpers: [ngo2],
    },

    // ══ SECTOR 16 (Dense Residential) ══
    {
      title: "Zero water pressure in Sector 16 C-Block upper floors for 10 days",
      desc: "Water pressure has dropped to zero for 2nd and 3rd floor families across Sector 16 C-Block for 10 consecutive days. Around 600 families are affected. Residents are buying private water at ₹500–₹1,000 per tanker every 2 days.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "high",
      lat: 28.7150, lng: 77.1220, addr: "C-Block, Sector 16, Rohini, Delhi - 110085",
      user: c2, status: "PENDING", confirms: 23, days: 10, helpers: [],
    },
    {
      title: "Aggressive stray dog pack near Sector 16 Mother Dairy booth",
      desc: "A pack of 12–15 un-vaccinated stray dogs has colonized the vacant plot opposite the Sector 16 Mother Dairy. They have chased cyclists and bitten 3 children this month. An immediate sterilization and vaccination drive is urgently needed.",
      cat: "Stray Animal", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7145, lng: 77.1235, addr: "Opposite Mother Dairy Booth, Sector 16, Rohini, Delhi",
      user: c2, status: "ASSIGNED", confirms: 20, days: 7, helpers: [ngo5],
    },
    {
      title: "Open manhole without cover in Sector 16 B-Block",
      desc: "A 4-foot deep stormwater drain manhole in front of House B-89, Sector 16, is missing its heavy cast iron lid. Residents have placed wooden planks as an improvised warning but this is inadequate — especially dangerous for children and during darkness.",
      cat: "Open Manhole", dept: "Municipal Corporation - Rohini Zone", pri: "urgent",
      lat: 28.7158, lng: 77.1210, addr: "Near B-89, Sector 16, Rohini, Delhi",
      user: c2, status: "RESOLVED", confirms: 15, days: 25, helpers: [ngo4],
    },

    // ══ SECTOR 17 ══
    {
      title: "Illegal dumping of construction debris at Sector 17 park perimeter",
      desc: "Contractors have been dumping brick rubble, plaster and concrete debris along the perimeter wall of the Sector 17 park. The footpath is completely blocked. Residents are unable to access the park gate and dust from debris causes breathing issues.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7175, lng: 77.1300, addr: "Park Perimeter Wall, Pocket 7, Sector 17, Rohini, Delhi",
      user: c27, status: "PENDING", confirms: 8, days: 13, helpers: [],
    },

    // ══ SECTOR 18 (Metro & Modern Area) ══
    {
      title: "Street lights dead on 800m Sector 18 Metro approach road",
      desc: "The entire 800-metre stretch connecting Badli Industrial Area to Sector 18 Metro station has been without street lighting. Late-night shift workers and female metro commuters report fear of crime while walking this poorly lit corridor.",
      cat: "Street Light", dept: "BSES Rajdhani Power", pri: "high",
      lat: 28.7245, lng: 77.1355, addr: "Sector 18 Metro Station Approach Road, Rohini, Delhi",
      user: c11, status: "PENDING", confirms: 15, days: 8, helpers: [],
    },
    {
      title: "Flooded underpass near Rohini Sector 18 Metro during rain",
      desc: "The service underpass connecting Sector 18 metro parking to the residential side floods to knee depth within 20 minutes of rainfall. The drain is completely clogged. Commuters must wade through stagnant, contaminated water.",
      cat: "Drainage", dept: "Municipal Corporation - Rohini Zone", pri: "urgent",
      lat: 28.7250, lng: 77.1362, addr: "Metro Parking Underpass, Rohini Sector 18 Metro, Delhi",
      user: c11, status: "IN_PROGRESS", confirms: 28, days: 5, helpers: [ngo1],
    },

    // ══ SECTOR 20 ══
    {
      title: "Construction debris dumped on Sector 20 public walkway",
      desc: "Over 6 truckloads of concrete rubble, bricks and tiles have been illegally dumped along the public pedestrian walkway in Sector 20 Pocket 12. Pedestrians and cyclists have no option but to use the high-speed main road.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7212, lng: 77.1205, addr: "Pocket 12 Walkway, Sector 20, Rohini, Delhi",
      user: c11, status: "ASSIGNED", confirms: 7, days: 12, helpers: [ngo1],
    },

    // ══ SECTOR 21 ══
    {
      title: "Broken park gate and damaged jogging track at Sector 21 park",
      desc: "The main gate of Sector 21 public park is off its hinges and cannot be locked, allowing stray cattle to graze inside. The rubber jogging track is cracked and uneven in multiple 10-metre sections — causing tripping risk for senior walkers.",
      cat: "Park Maintenance", dept: "Horticulture & Urban Forestry", pri: "low",
      lat: 28.7198, lng: 77.1270, addr: "Sector 21 Public Park, Rohini, Delhi - 110086",
      user: c28, status: "PENDING", confirms: 5, days: 21, helpers: [],
    },

    // ══ SECTOR 22 (New Expansion Zone) ══
    {
      title: "Choked main drainage canal in Sector 22 causing severe waterlogging",
      desc: "The primary storm water channel passing through Sector 22 is choked with construction silt, polythene bags and solid waste. Even 20mm of rainfall results in 2-foot waterlogging at the sector entrance and internal roads for 6–8 hours.",
      cat: "Drainage", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7200, lng: 77.1300, addr: "Main Arterial Drain Channel, Sector 22, Rohini, Delhi",
      user: c3, status: "PENDING", confirms: 11, days: 14, helpers: [ngo1],
    },
    {
      title: "Illegal open dumping and burning of waste behind Sector 22 school",
      desc: "A 2-acre vacant plot behind the Government Senior Secondary School in Sector 22 has been converted into an illegal dumpyard. Mixed industrial and medical waste is being burned here daily, releasing toxic smoke that enters classrooms during morning hours.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "urgent",
      lat: 28.7210, lng: 77.1285, addr: "Behind Govt Senior Secondary School, Sector 22, Rohini",
      user: c3, status: "IN_PROGRESS", confirms: 38, days: 18, helpers: [ngo1, ngo2],
    },
    {
      title: "Damaged road direction signage at Sector 22–23 roundabout",
      desc: "The overhead direction sign at the Sector 22–23 roundabout was knocked down in a road accident 4 months ago and never replaced. Unfamiliar drivers frequently take wrong turns into dead-end residential streets, causing unnecessary congestion.",
      cat: "Traffic Sign", dept: "Delhi Traffic Police", pri: "low",
      lat: 28.7225, lng: 77.1315, addr: "Sector 22 & 23 Roundabout, Rohini, Delhi",
      user: c3, status: "PENDING", confirms: 4, days: 45, helpers: [],
    },

    // ══ SECTOR 23 ══
    {
      title: "Non-functioning public toilet near Sector 23 bus terminal",
      desc: "The MCD public toilet complex near the Sector 23 bus terminal has been locked and out-of-service for 3 weeks. Over 600 daily commuters, including women and elderly, have no sanitary facility. Open defecation and urination is occurring nearby.",
      cat: "Sanitation", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7228, lng: 77.1320, addr: "Near Bus Terminal, Sector 23, Rohini, Delhi - 110086",
      user: c22, status: "ASSIGNED", confirms: 26, days: 21, helpers: [ngo1],
    },

    // ══ SECTOR 24 (Outer Rohini) ══
    {
      title: "Dislodged footpath tiles creating severe trip hazard on Sector 24 market road",
      desc: "Multiple sections of interlocking footpath tiles on Sector 24 market avenue are jutting upward or missing completely. An elderly lady fractured her wrist last week after falling. Rains make these surfaces even more slippery and treacherous.",
      cat: "Footpath", dept: "Public Works Department", pri: "medium",
      lat: 28.7180, lng: 77.1340, addr: "Market Avenue Footpath, Sector 24, Rohini, Delhi",
      user: c7, status: "ASSIGNED", confirms: 9, days: 22, helpers: [ngo4],
    },
    {
      title: "Water supply intermittent for 14 days in Sector 24 Pocket 6",
      desc: "Residents of Pocket 6, Sector 24 are receiving tap water for only 30–40 minutes a day instead of the standard 4-hour supply window. Around 400 families are being forced to purchase private water tankers at ₹800 each.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "high",
      lat: 28.7188, lng: 77.1335, addr: "Pocket 6, Sector 24, Rohini, Delhi - 110086",
      user: c7, status: "IN_PROGRESS", confirms: 18, days: 14, helpers: [],
    },

    // ══ SECTOR 25 (Outer Rohini near Rithala) ══
    {
      title: "Stray cattle on Sector 25 main link road creating accident hazard",
      desc: "Over 20 stray cows and bulls sit on the central divider of Sector 25 link road connecting to Rithala. Speeding traffic swerves dangerously to avoid animals at night. Three minor accidents in the past 15 days are linked to this issue.",
      cat: "Stray Animal", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7220, lng: 77.1050, addr: "Link Road, Sector 25, Rohini, Delhi",
      user: c16, status: "PENDING", confirms: 16, days: 6, helpers: [ngo5],
    },
    {
      title: "Burned-out street light transformer in Sector 25 Pocket 4",
      desc: "The local distribution transformer at Pocket 4 park corner was damaged in a storm surge and hasn't been replaced. Three complete residential lanes around Pocket 4 and 5 have been without any street lighting for 12 nights.",
      cat: "Electricity", dept: "BSES Rajdhani Power", pri: "high",
      lat: 28.7230, lng: 77.1042, addr: "Pocket 4, Sector 25, Rohini, Delhi - 110086",
      user: c16, status: "ASSIGNED", confirms: 13, days: 12, helpers: [],
    },

    // ══ PRASHANT VIHAR (Institutional & Affluent) ══
    {
      title: "Sparking distribution transformer near Prashant Vihar F-Block",
      desc: "The pole-mounted BSES distribution transformer near F-Block in Prashant Vihar is emitting loud sparking sounds and smoke during late evening hours. Residents have video evidence from 3 nights this week. Severe fire and electrocution risk.",
      cat: "Electricity", dept: "BSES Rajdhani Power", pri: "urgent",
      lat: 28.7050, lng: 77.1270, addr: "F-Block, Prashant Vihar, Rohini, Delhi - 110085",
      user: c6, status: "IN_PROGRESS", confirms: 21, days: 2, helpers: [],
    },
    {
      title: "Faded zebra crossing and missing pedestrian signal outside Prashant Vihar school",
      desc: "The zebra crossing on the 4-lane road outside Prashant Vihar Public School is completely invisible — paint worn off completely. Over 1,200 students cross this road every day without a pedestrian green signal. Near-miss incidents are daily.",
      cat: "Traffic Sign", dept: "Delhi Traffic Police", pri: "medium",
      lat: 28.7060, lng: 77.1255, addr: "Road outside Prashant Vihar Public School, Rohini",
      user: c6, status: "PENDING", confirms: 14, days: 10, helpers: [],
    },
    {
      title: "Waterlogging at Prashant Vihar intersection near Axis Bank ATM",
      desc: "The T-junction near the Axis Bank ATM in Prashant Vihar floods every time it rains due to a clogged stormwater drain outlet. Street vendors' shops and the ATM lobby get inundated. The issue has persisted every monsoon for 2 years.",
      cat: "Drainage", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7055, lng: 77.1262, addr: "T-Junction near Axis Bank ATM, Prashant Vihar, Rohini",
      user: c6, status: "ASSIGNED", confirms: 11, days: 16, helpers: [ngo2],
    },

    // ══ PITAMPURA (Commercial & Dense Residential) ══
    {
      title: "Massive pothole on Ring Road near Netaji Subhash Place flyover entry",
      desc: "A 5-foot long, 12-inch deep pothole has formed at the Ring Road entry to the Netaji Subhash Place flyover in Pitampura. Heavy commercial vehicles and buses use this road 24/7. The pothole has caused two truck tyre bursts this week alone.",
      cat: "Pothole", dept: "Public Works Department", pri: "urgent",
      lat: 28.6920, lng: 77.1490, addr: "Ring Road, NSP Flyover Entry, Pitampura, Delhi - 110034",
      user: c23, status: "IN_PROGRESS", confirms: 41, days: 6, helpers: [ngo4, ngo6],
    },
    {
      title: "Overflowing drain near Pitampura Metro Gate 1 footpath",
      desc: "The stormwater drain along the footpath near Pitampura Metro Gate 1 has been blocked with plastic and overflows whenever it rains, covering the pedestrian path with murky water. Thousands of daily metro commuters face this daily.",
      cat: "Drainage", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.6980, lng: 77.1460, addr: "Gate 1, Pitampura Metro Station, Pitampura, Delhi",
      user: c14, status: "ASSIGNED", confirms: 24, days: 9, helpers: [ngo6],
    },
    {
      title: "Garbage not collected from Guru Harkishan Nagar for 10 days",
      desc: "MCD garbage collection has completely stopped in Guru Harkishan Nagar, Pitampura for 10 days due to a vehicle breakdown. Uncollected waste in 8 community bins is rotting in the heat. Residents report fly and mosquito infestation.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.6995, lng: 77.1445, addr: "Guru Harkishan Nagar, Pitampura, Delhi - 110034",
      user: c14, status: "PENDING", confirms: 18, days: 10, helpers: [ngo6],
    },

    // ══ KOHAT ENCLAVE & NETAJI SUBHASH PLACE ══
    {
      title: "Cracked and sinking road surface on main Kohat Enclave road",
      desc: "The main internal road in Kohat Enclave, Pitampura, has developed long lateral cracks and is sinking in multiple 5-metre sections. The likely cause is a subsurface water pipe failure. The road will completely collapse if untreated through monsoon.",
      cat: "Road Repair", dept: "Public Works Department", pri: "high",
      lat: 28.6935, lng: 77.1510, addr: "Main Kohat Enclave Road, Pitampura, Delhi - 110034",
      user: c21, status: "PENDING", confirms: 12, days: 17, helpers: [ngo4],
    },

    // ══ SHALIMAR BAGH ══
    {
      title: "No street lights on B-Block main road in Shalimar Bagh for 2 weeks",
      desc: "The entire B-Block main road in Shalimar Bagh has had no street lighting for two weeks following an electrical fault. Residents say women are afraid to go out after dark. Snatching incidents have increased in this stretch.",
      cat: "Street Light", dept: "BSES Rajdhani Power", pri: "high",
      lat: 28.7148, lng: 77.1540, addr: "B-Block Main Road, Shalimar Bagh, Delhi - 110088",
      user: c20, status: "IN_PROGRESS", confirms: 22, days: 14, helpers: [ngo7],
    },
    {
      title: "Overflowing sewage from broken manhole near Shalimar Bagh market",
      desc: "A collapsed manhole cover near the Shalimar Bagh weekly market is causing raw sewage to overflow onto the road. The market area handles hundreds of shoppers daily. The stench and contamination risk is severe.",
      cat: "Sewage", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.7155, lng: 77.1555, addr: "Near Weekly Market, Shalimar Bagh, Delhi - 110088",
      user: c20, status: "ASSIGNED", confirms: 29, days: 4, helpers: [ngo7],
    },
    {
      title: "Garbage bins overflowing outside Shalimar Bagh Extension park",
      desc: "The 3 community garbage bins outside the park in Shalimar Bagh Extension have not been emptied in 8 days. Waste is piling up on the footpath, attracting rats and stray dogs. Morning walkers have to navigate around the garbage heap.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7160, lng: 77.1535, addr: "Park Entry, Shalimar Bagh Extension, Delhi - 110088",
      user: c20, status: "RESOLVED", confirms: 10, days: 30, helpers: [ngo7],
    },

    // ══ BUDH VIHAR ══
    {
      title: "Open sewer next to children's school in Budh Vihar Phase-1",
      desc: "An uncovered sewer channel runs directly along the footpath outside the primary school in Budh Vihar Phase-1. Children have fallen into the 2-foot deep channel twice this year. The channel should have a concrete cover as per plan but was never fitted.",
      cat: "Sewage", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.7165, lng: 77.0850, addr: "Outside Primary School, Budh Vihar Phase-1, Rohini, Delhi",
      user: c8, status: "PENDING", confirms: 33, days: 8, helpers: [ngo3],
    },
    {
      title: "Pothole-ridden service lane in Budh Vihar Phase-2",
      desc: "The 300-metre service lane behind the Budh Vihar Phase-2 shopping area has at least 12 major potholes ranging from 6 to 10 inches deep. During rain the lane becomes completely inaccessible and shopkeepers lose business.",
      cat: "Pothole", dept: "Public Works Department", pri: "medium",
      lat: 28.7175, lng: 77.0862, addr: "Service Lane, Budh Vihar Phase-2, Rohini, Delhi",
      user: c8, status: "PENDING", confirms: 9, days: 15, helpers: [ngo3],
    },

    // ══ POOTH KALAN (Village & Peri-Urban) ══
    {
      title: "No MCD waste pickup in Pooth Kalan for 2 weeks",
      desc: "MCD garbage collection has not visited Pooth Kalan Village Main Bazaar for 2 weeks. Waste from 400+ households is piling on the main approach road. Several residents have taken to burning garbage near the village pond, creating a fire and pollution hazard.",
      cat: "Garbage Collection", dept: "Municipal Corporation - Rohini Zone", pri: "high",
      lat: 28.7222, lng: 77.0780, addr: "Main Bazaar Road, Pooth Kalan Village, Delhi - 110086",
      user: c13, status: "PENDING", confirms: 17, days: 14, helpers: [ngo3],
    },
    {
      title: "Broken water pump serving Pooth Kalan village",
      desc: "The DJB water booster pump serving Pooth Kalan village broke down 8 days ago. The pump feeds water to approx. 1,200 households in the village. Residents are filling water from a single hand pump near the temple, which is insufficient for daily needs.",
      cat: "Water Supply", dept: "Delhi Jal Board", pri: "urgent",
      lat: 28.7228, lng: 77.0795, addr: "DJB Pump Station, Pooth Kalan Village, Rohini, Delhi",
      user: c13, status: "IN_PROGRESS", confirms: 37, days: 8, helpers: [ngo1],
    },

    // ══ RITHALA ══
    {
      title: "Rithala village road washed away during last monsoon — not repaired",
      desc: "Heavy rains last monsoon washed away a 40-metre section of the internal approach road in Rithala Village. The road has not been repaired after 8 months. Residents and schoolchildren navigate loose soil and rubble daily.",
      cat: "Road Repair", dept: "Public Works Department", pri: "high",
      lat: 28.7198, lng: 77.1055, addr: "Rithala Village Internal Road, near Main Temple, Delhi",
      user: c19, status: "ASSIGNED", confirms: 14, days: 60, helpers: [ngo4],
    },
    {
      title: "Street lights stolen from Rithala village approach path",
      desc: "The solar street light fixtures on the 500-metre approach path leading into Rithala village from the main road have been vandalized and the panels stolen. The entire path is now unlit, making it unsafe after 7 PM especially for women.",
      cat: "Street Light", dept: "BSES Rajdhani Power", pri: "medium",
      lat: 28.7205, lng: 77.1062, addr: "Rithala Village Approach Road, Rohini, Delhi - 110086",
      user: c19, status: "PENDING", confirms: 8, days: 20, helpers: [],
    },

    // ══ ROHINI WEST METRO AREA (Sectors 24–25 side) ══
    {
      title: "Hawker encroachment blocking Rohini West Metro exit footpath",
      desc: "Unauthorized food hawkers have set up permanent stalls completely blocking the footpath at Rohini West Metro Station exit 3. Commuters must walk on the main carriageway to exit the metro, creating a daily pedestrian road safety hazard.",
      cat: "Encroachment", dept: "Municipal Corporation - Rohini Zone", pri: "medium",
      lat: 28.7260, lng: 77.1115, addr: "Exit 3, Rohini West Metro Station, Rohini, Delhi",
      user: c7, status: "PENDING", confirms: 12, days: 30, helpers: [],
    },

    // ══ RESOLVED HISTORICAL ISSUE ══
    {
      title: "Broken park bench and rusted swings in Sector 3 Children's Park",
      desc: "Children's swings had broken chains with sharp rusted metal edges and two concrete benches were cracked in half. Children from surrounding apartments play here daily and were at risk of injury. Fixed after repeated reports.",
      cat: "Park Maintenance", dept: "Horticulture & Urban Forestry", pri: "low",
      lat: 28.6990, lng: 77.1095, addr: "Community Park, Sector 3, Rohini, Delhi",
      user: c4, status: "RESOLVED", confirms: 5, days: 35, helpers: [ngo2],
    },

    // ══ ANONYMOUS REPORT ══
    {
      title: "Suspicious chemical drums illegally dumped near Sector 7 park",
      desc: "Several unmarked industrial chemical drums have been dumped in the park area at night. The drums appear to be leaking. This is a serious environmental and public health hazard that requires immediate inspection and disposal.",
      cat: "Other", dept: "Municipal Corporation - Rohini Zone", pri: "urgent",
      lat: 28.7043, lng: 77.1170, addr: "Near Park Entrance, Sector 7, Rohini, Delhi",
      user: c9, status: "IN_PROGRESS", confirms: 19, days: 2, helpers: [ngo1, ngo2], anon: true,
    },
  ];

  console.log(`\nInserting ${complaintsData.length} comprehensive civic complaints with realistic metadata...`);

  for (let i = 0; i < complaintsData.length; i++) {
    const c = complaintsData[i];
    const created = daysAgo(c.days);
    const complaint = await prisma.complaint.create({
      data: {
        complaintId: genComplaintId(i + 1),
        title: c.title,
        description: c.desc,
        category: c.cat,
        priority: c.pri || "medium",
        status: c.status,
        assignedDept: c.dept,
        latitude: c.lat,
        longitude: c.lng,
        address: c.addr,
        confirmationsCount: c.confirms,
        isAnonymous: c.anon || false,
        reportedById: c.user.id,
        createdAt: created,
        updatedAt: c.status === "RESOLVED" ? daysAgo(Math.max(0, c.days - 5)) : new Date(),
      },
    });

    // Audit Trail
    if (c.status !== "PENDING") {
      const assignedAdmin =
        c.dept === "Public Works Department" ? admin2 :
        c.dept === "Delhi Jal Board" ? admin3 :
        c.dept === "Delhi Traffic Police" ? admin4 :
        c.dept === "BSES Rajdhani Power" ? admin5 : admin1;

      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: "PENDING",
          newStatus: c.status === "REJECTED" ? "REJECTED" : "ASSIGNED",
          changedById: assignedAdmin.id,
          changedByRole: "ADMIN",
          notes: c.status === "REJECTED"
            ? "Rejected: Insufficient location details or non-actionable report."
            : `Verified by intake system and assigned to ${c.dept}.`,
          createdAt: daysAgo(Math.max(1, c.days - 1)),
        },
      });

      if (c.status === "IN_PROGRESS" || c.status === "RESOLVED") {
        await prisma.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            oldStatus: "ASSIGNED",
            newStatus: "IN_PROGRESS",
            changedById: assignedAdmin.id,
            changedByRole: "ADMIN",
            notes: "Field inspection completed. Maintenance team dispatched on-site.",
            createdAt: daysAgo(Math.max(1, c.days - 3)),
          },
        });
      }

      if (c.status === "RESOLVED") {
        await prisma.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            oldStatus: "IN_PROGRESS",
            newStatus: "RESOLVED",
            changedById: assignedAdmin.id,
            changedByRole: "ADMIN",
            notes: "Repair completed and verified via on-site photographic inspection.",
            createdAt: daysAgo(Math.max(0, c.days - 5)),
          },
        });
      }
    }

    // NGO Helpers
    if (c.helpers && c.helpers.length > 0) {
      for (const ngo of c.helpers) {
        await prisma.complaintHelper.create({
          data: {
            complaintId: complaint.id,
            userId: ngo.id,
            status: "HELPING",
            message: `${(ngo as any).organization} has mobilized local volunteers to assist with this civic issue.`,
          },
        }).catch(() => {});
      }
    }

    // Citizen Confirmations / Upvotes
    const numConfirms = Math.min(c.confirms, citizens.length);
    for (let j = 0; j < numConfirms; j++) {
      if (citizens[j].id !== c.user.id) {
        await prisma.complaintConfirmation.create({
          data: { complaintId: complaint.id, userId: citizens[j].id },
        }).catch(() => {});
      }
    }
  }

  // ── 5. Notifications ──
  const notifs = [
    { userId: admin1.id, title: "🚨 Urgent: Pooth Kalan Water Pump Failure", message: "37 citizens have confirmed the DJB pump failure in Pooth Kalan Village affecting 1,200+ households. Immediate escalation required.", isRead: false },
    { userId: admin1.id, title: "⚠️ Potential Duplicate Cluster: Sector 7 Potholes", message: "3 overlapping reports about potholes near Sector 7 Gurudwara detected within a 50m radius. Review and merge recommendations are ready.", isRead: false },
    { userId: admin1.id, title: "📋 New NGO Pending Approval", message: "Youth Aid Welfare Society (Budh Vihar / Rithala) has registered and is awaiting municipal verification.", isRead: false },
    { userId: admin1.id, title: "📍 High Upvote Alert: NSP Pitampura Pothole", message: "The Ring Road pothole near Netaji Subhash Place has received 41 citizen confirmations. Immediate PWD dispatch recommended.", isRead: false },
    { userId: admin2.id, title: "🛠️ Work Order: Sector 7 Market Road Pothole", message: "PWD maintenance team dispatched to Sector 7 Gurudwara road. Status changed to IN_PROGRESS.", isRead: true },
    { userId: admin3.id, title: "💧 Urgent: Contaminated Water Report, Sector 15", message: "34 residents have confirmed yellowish water in Sector 15 Pocket 3. DJB field inspection pending.", isRead: false },
    { userId: admin4.id, title: "🚦 Sector 11 Traffic Signal Down — 10 Days", message: "Sector 11 main chowk traffic signal is still non-functional. Delhi Traffic Police manual deployment requested.", isRead: false },
    { userId: admin5.id, title: "⚡ Sparking Transformer in Prashant Vihar", message: "BSES transformer at Prashant Vihar F-Block is sparking. Emergency maintenance team needed immediately.", isRead: false },
    { userId: ngo1.id, title: "✅ Pledge Approved by Admin", message: "Your volunteer pledge for the Sector 7 garbage overflow issue has been approved by Zonal Municipal Admin. You may coordinate with your field teams.", isRead: false },
    { userId: ngo1.id, title: "🆕 New High-Priority Issue in your Service Area", message: "A new urgent sewage overflow near Rohini East Metro has been reported with 29 confirmations. Volunteer assistance may be needed.", isRead: false },
    { userId: ngo3.id, title: "⏳ NGO Application Under Review", message: "Your organization registration for Youth Aid Welfare Society is under review by municipal officials. You will be notified within 3 working days.", isRead: false },
    { userId: ngo5.id, title: "🐕 Stray Animal Alert: Sector 16 Mother Dairy", message: "A stray dog pack near Sector 16 Mother Dairy booth has been confirmed by 20 residents. Your organization has been linked for assistance.", isRead: false },
    { userId: c1.id, title: "📢 Update: Sector 7 Pothole — IN_PROGRESS", message: "Your report (Sector 7 Gurudwara road pothole) has been acknowledged by the Public Works Department and repair work has begun.", isRead: false },
    { userId: c13.id, title: "🔧 Update: Pooth Kalan Water Pump — In Progress", message: "Delhi Jal Board has dispatched a repair team to the Pooth Kalan booster pump failure. Water restoration expected within 24 hours.", isRead: false },
    { userId: c3.id, title: "🔥 Your Report is Viral: Sector 22 Illegal Dumping", message: "Your report about illegal waste burning near Sector 22 school has received 38 citizen confirmations — the highest on the platform today.", isRead: false },
  ];

  for (const n of notifs) {
    await prisma.notification.create({ data: n });
  }

  console.log("\n=================================================================");
  console.log(`✅ Seed complete! ${complaintsData.length} civic issues across all Rohini sectors.`);
  console.log("=================================================================");
  console.log("📍 Coverage: Sectors 1–25, Prashant Vihar, Pitampura, Kohat Enclave,");
  console.log("   Netaji Subhash Place, Shalimar Bagh, Budh Vihar, Pooth Kalan, Rithala,");
  console.log("   Rohini East Metro, Rohini West Metro, Rohini Sector 18 Metro.");
  console.log("-----------------------------------------------------------------");
  console.log("🔑 Demo Login Credentials (all passwords: password123):");
  console.log("   • Citizen 1:   vikram@gmail.com");
  console.log("   • Citizen 2:   neha.gupta@yahoo.com");
  console.log("   • Admin:       admin@jansamvedan.org        (Municipal Corporation)");
  console.log("   • Admin (PWD): sunita.admin@jansamvedan.org  (Public Works Dept)");
  console.log("   • Admin (DJB): anil.djb@jansamvedan.org      (Delhi Jal Board)");
  console.log("   • Admin (TP):  manoj.traffic@jansamvedan.org (Traffic Police)");
  console.log("   • Admin (BSES):geeta.bses@jansamvedan.org    (BSES Rajdhani Power)");
  console.log("   • NGO:         amit@cleanrohini.org          (Clean Rohini Foundation — Verified)");
  console.log("   • NGO 2:       priya@greendelhi.org          (Green Delhi Initiative — Verified)");
  console.log("   • NGO 3:       deepak@youthaid.in            (Youth Aid Welfare — Pending)");
  console.log("   • NGO 4:       suresh@roadsavers.org         (Road Safety Guild — Verified)");
  console.log("   • NGO 5:       pooja@animalcaredelhi.org     (Animal Welfare — Verified)");
  console.log("   • NGO 6:       tarun@pitampurahelps.org      (Pitampura Civic Action — Verified)");
  console.log("   • NGO 7:       kavya@shalimarbag.org         (Shalimar Bagh RWA — Verified)");
  console.log("=================================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());