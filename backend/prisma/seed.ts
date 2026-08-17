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
  console.log("🌱 Seeding comprehensive Rohini civic dataset...");

  // Clean existing tables in correct relational order
  await prisma.notification.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaintConfirmation.deleteMany();
  await prisma.complaintHelper.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  // ── 1. Admins / Municipal Officials ──
  const admin1 = await prisma.user.create({
    data: {
      name: "Rajesh Verma",
      email: "admin@jansamvedan.org",
      passwordHash: hash,
      phone: "9811000001",
      role: "ADMIN",
      department: "Municipal Corporation - Rohini Zone",
      address: "Zonal Municipal Office, Sector 11, Rohini, Delhi",
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: "Sunita Sharma",
      email: "sunita.admin@jansamvedan.org",
      passwordHash: hash,
      phone: "9811000002",
      role: "ADMIN",
      department: "Public Works Department",
      address: "PWD Division Office, Sector 3, Rohini, Delhi",
    },
  });

  const admin3 = await prisma.user.create({
    data: {
      name: "Anil Gupta",
      email: "anil.djb@jansamvedan.org",
      passwordHash: hash,
      phone: "9811000003",
      role: "ADMIN",
      department: "Delhi Jal Board",
      address: "DJB Office, Sector 15, Rohini, Delhi",
    },
  });

  const admin4 = await prisma.user.create({
    data: {
      name: "Inspector Manoj Tyagi",
      email: "manoj.traffic@jansamvedan.org",
      passwordHash: hash,
      phone: "9811000004",
      role: "ADMIN",
      department: "Delhi Traffic Police",
      address: "Traffic Police Circle, Outer North, Pitampura",
    },
  });

  const admins = [admin1, admin2, admin3, admin4];

  // ── 2. NGOs / Volunteer Organizations ──
  const ngo1 = await prisma.user.create({
    data: {
      name: "Amit Choudhary",
      email: "amit@cleanrohini.org",
      passwordHash: hash,
      phone: "9899100001",
      role: "NGO",
      organization: "Clean Rohini Foundation",
      serviceArea: "Rohini, Pitampura, Sector 7, Sector 11",
      ngoStatus: "VERIFIED",
      address: "Community Centre, Sector 7, Rohini, Delhi",
    },
  });

  const ngo2 = await prisma.user.create({
    data: {
      name: "Priya Mehta",
      email: "priya@greendelhi.org",
      passwordHash: hash,
      phone: "9899100002",
      role: "NGO",
      organization: "Green Delhi Initiative",
      serviceArea: "Rohini, Shalimar Bagh, Prashant Vihar",
      ngoStatus: "VERIFIED",
      address: "12 Institutional Area, Prashant Vihar, Delhi",
    },
  });

  const ngo3 = await prisma.user.create({
    data: {
      name: "Deepak Rana",
      email: "deepak@youthaid.in",
      passwordHash: hash,
      phone: "9899100003",
      role: "NGO",
      organization: "Youth Aid Welfare Society",
      serviceArea: "Rohini, Budh Vihar, Pooth Kalan",
      ngoStatus: "PENDING",
      address: "Plot 45, Budh Vihar Phase-1, Delhi",
    },
  });

  const ngo4 = await prisma.user.create({
    data: {
      name: "Suresh Rawat",
      email: "suresh@roadsavers.org",
      passwordHash: hash,
      phone: "9899100004",
      role: "NGO",
      organization: "Rohini Road Safety & Repair Guild",
      serviceArea: "Rohini Sector 3, Sector 8, Sector 14, Sector 18",
      ngoStatus: "VERIFIED",
      address: "Shop 14, DDA Market, Sector 8, Rohini",
    },
  });

  const ngo5 = await prisma.user.create({
    data: {
      name: "Pooja Singhania",
      email: "pooja@animalcaredelhi.org",
      passwordHash: hash,
      phone: "9899100005",
      role: "NGO",
      organization: "North Delhi Stray Animal Welfare",
      serviceArea: "Rohini Sector 15, Sector 16, Sector 22, Sector 24",
      ngoStatus: "VERIFIED",
      address: "Block C, Sector 16, Rohini",
    },
  });

  const ngos = [ngo1, ngo2, ngo3, ngo4, ngo5];

  // ── 3. Citizens across Rohini Sectors ──
  const c1 = await prisma.user.create({ data: { name: "Vikram Singh", email: "vikram@gmail.com", passwordHash: hash, phone: "9871200001", role: "CITIZEN", address: "B-4/12, Sector 7, Rohini" } });
  const c2 = await prisma.user.create({ data: { name: "Neha Gupta", email: "neha.gupta@yahoo.com", passwordHash: hash, phone: "9871200002", role: "CITIZEN", address: "C-2/56, Sector 16, Rohini" } });
  const c3 = await prisma.user.create({ data: { name: "Rahul Jain", email: "rahul.jain@outlook.com", passwordHash: hash, phone: "9871200003", role: "CITIZEN", address: "A-1/34, Sector 22, Rohini" } });
  const c4 = await prisma.user.create({ data: { name: "Pooja Devi", email: "pooja.devi@gmail.com", passwordHash: hash, phone: "9871200004", role: "CITIZEN", address: "D-3/67, Sector 3, Rohini" } });
  const c5 = await prisma.user.create({ data: { name: "Sanjay Kumar", email: "sanjay.k@gmail.com", passwordHash: hash, phone: "9871200005", role: "CITIZEN", address: "E-5/89, Sector 11, Rohini" } });
  const c6 = await prisma.user.create({ data: { name: "Meera Rao", email: "meera.rao@gmail.com", passwordHash: hash, phone: "9871200006", role: "CITIZEN", address: "F-1/23, Prashant Vihar" } });
  const c7 = await prisma.user.create({ data: { name: "Arjun Thakur", email: "arjun.t@gmail.com", passwordHash: hash, phone: "9871200007", role: "CITIZEN", address: "G-7/45, Sector 24, Rohini" } });
  const c8 = await prisma.user.create({ data: { name: "Kavita Sharma", email: "kavita.s@hotmail.com", passwordHash: hash, phone: "9871200008", role: "CITIZEN", address: "H-Block, Budh Vihar Phase-1" } });
  const c9 = await prisma.user.create({ data: { name: "Mohit Aggarwal", email: "mohit.aggarwal@gmail.com", passwordHash: hash, phone: "9871200009", role: "CITIZEN", address: "Pocket B, Sector 8, Rohini" } });
  const c10 = await prisma.user.create({ data: { name: "Ritu Malhotra", email: "ritu.malhotra@gmail.com", passwordHash: hash, phone: "9871200010", role: "CITIZEN", address: "D-Block, Sector 14, Rohini" } });
  const c11 = await prisma.user.create({ data: { name: "Harish Chawla", email: "harish.chawla@yahoo.co.in", passwordHash: hash, phone: "9871200011", role: "CITIZEN", address: "Pocket 12, Sector 20, Rohini" } });
  const c12 = await prisma.user.create({ data: { name: "Divya Bansal", email: "divya.bansal@gmail.com", passwordHash: hash, phone: "9871200012", role: "CITIZEN", address: "B-3/88, Sector 15, Rohini" } });
  const c13 = await prisma.user.create({ data: { name: "Alok Tiwari", email: "alok.tiwari@outlook.com", passwordHash: hash, phone: "9871200013", role: "CITIZEN", address: "Main Bazaar, Pooth Kalan Village" } });
  const c14 = await prisma.user.create({ data: { name: "Simran Kaur", email: "simran.kaur@gmail.com", passwordHash: hash, phone: "9871200014", role: "CITIZEN", address: "Guru Harkishan Nagar, Pitampura" } });
  const c15 = await prisma.user.create({ data: { name: "Vivek Saxena", email: "vivek.saxena@rediffmail.com", passwordHash: hash, phone: "9871200015", role: "CITIZEN", address: "Sector 9, Deepali Enclave, Rohini" } });
  const c16 = await prisma.user.create({ data: { name: "Ananya Das", email: "ananya.das@gmail.com", passwordHash: hash, phone: "9871200016", role: "CITIZEN", address: "Pocket 4, Sector 25, Rohini" } });

  const citizens = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16];

  // ── 4. Complaints: 42 Realistic Rohini & North Delhi Issues ──
  const complaintsData = [
    // --- Sector 7 (Residential & Commercial Hub) ---
    {
      title: "Massive pothole near Sector 7 market entrance",
      desc: "There is a 3-foot wide, 8-inch deep pothole right at the entry of Sector 7 weekly market near the gurudwara. Multiple two-wheelers have skidded here during evening peak hours. Water accumulates during rain making it completely invisible to oncoming traffic.",
      cat: "Pothole",
      dept: "Public Works Department",
      pri: "high",
      lat: 28.7041,
      lng: 77.1165,
      addr: "Main Road near Gurudwara, Sector 7, Rohini, Delhi",
      user: c1,
      status: "IN_PROGRESS",
      confirms: 12,
      days: 12,
      helpers: [ngo1, ngo4],
    },
    {
      title: "Overflowing municipal garbage bin at C-Block park",
      desc: "The municipal garbage dump outside C-Block park in Sector 7 has not been cleared for 6 days. Stray cattle and dogs are tearing open bags and scattering waste across the road and footpath. Severe foul odor is affecting nearby residents and morning walkers.",
      cat: "Garbage Collection",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "medium",
      lat: 28.7035,
      lng: 77.1148,
      addr: "C-Block Park Entry, Sector 7, Rohini, Delhi",
      user: c1,
      status: "ASSIGNED",
      confirms: 8,
      days: 4,
      helpers: [ngo1],
    },
    {
      title: "Broken pavement & missing drain cover on Sector 7 inner ring",
      desc: "An open drain slab has broken near House 145 on the Sector 7 inner road. It is a severe hazard for children and elderly pedestrians at night.",
      cat: "Drainage",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "urgent",
      lat: 28.7048,
      lng: 77.1172,
      addr: "Inner Ring Road, Sector 7, Rohini, Delhi",
      user: c9,
      status: "PENDING",
      confirms: 6,
      days: 2,
      helpers: [],
    },

    // --- Sector 3 (Metro & Commercial Stretch) ---
    {
      title: "Broken street light stretch on Sector 3 main road",
      desc: "Four consecutive street light poles on the main arterial road between Sector 3 and Sector 5 have been dark for two weeks. The stretch turns pitch black after sunset, raising safety concerns for female commuters returning from Rohini East Metro.",
      cat: "Street Light",
      dept: "BSES Rajdhani Power",
      pri: "high",
      lat: 28.6982,
      lng: 77.1101,
      addr: "Main Road between Sector 3 & 5, near Rohini East Metro",
      user: c4,
      status: "ASSIGNED",
      confirms: 14,
      days: 15,
      helpers: [ngo4],
    },
    {
      title: "Sewage overflow outside Rohini East Metro Station Gate 2",
      desc: "Raw sewage is overflowing onto the pedestrian pathway and road from a damaged manhole outside Rohini East metro station gate 2. Thousands of daily commuters are forced to step through contaminated sludge.",
      cat: "Sewage",
      dept: "Delhi Jal Board",
      pri: "urgent",
      lat: 28.6975,
      lng: 77.1112,
      addr: "Gate 2, Rohini East Metro Station, Sector 3, Delhi",
      user: c4,
      status: "IN_PROGRESS",
      confirms: 22,
      days: 5,
      helpers: [ngo1],
    },
    {
      title: "Broken park bench and rusted swings in Sector 3 Children's Park",
      desc: "Children's swings have broken chains with sharp rusted metal edges, and two concrete benches are broken in half. Children from the surrounding apartments play here daily.",
      cat: "Park Maintenance",
      dept: "Horticulture & Urban Forestry",
      pri: "low",
      lat: 28.6990,
      lng: 77.1095,
      addr: "Community Park, Sector 3, Rohini, Delhi",
      user: c4,
      status: "RESOLVED",
      confirms: 5,
      days: 35,
      helpers: [ngo2],
    },

    // --- Sector 8 & 9 (Residential & DDA Markets) ---
    {
      title: "Fallen tree branch blocking DDA Market access lane",
      desc: "A massive eucalyptus branch snapped during yesterday's storm and is blocking the service road behind Sector 8 DDA Market. Emergency vehicles and delivery vans cannot pass.",
      cat: "Tree Fall",
      dept: "Horticulture & Urban Forestry",
      pri: "high",
      lat: 28.7062,
      lng: 77.1215,
      addr: "Service Lane behind DDA Market, Sector 8, Rohini",
      user: c9,
      status: "IN_PROGRESS",
      confirms: 9,
      days: 1,
      helpers: [ngo2],
    },
    {
      title: "Bus stop shelter collapsed at Sector 9 D-Block",
      desc: "The tin roof and steel framework of the DTC bus stop shelter near Sector 9 D-Block collapsed after strong winds. Exposed jagged metal sheets are dangerous for waiting commuters.",
      cat: "Road Repair",
      dept: "Public Works Department",
      pri: "medium",
      lat: 28.7070,
      lng: 77.1140,
      addr: "DTC Bus Stop, Sector 9 D-Block, Rohini, Delhi",
      user: c15,
      status: "RESOLVED",
      confirms: 11,
      days: 42,
      helpers: [ngo4],
    },

    // --- Sector 11 (Aggarwal Fun City Mall & Japanese Park Area) ---
    {
      title: "Severely degraded road surface near Japanese Park Gate 3",
      desc: "The road leading to Japanese Park from Sector 11 has large patches of stripped asphalt with loose gravel and deep ruts. School buses and ambulances frequently use this corridor and experience heavy vibrations and delays.",
      cat: "Road Repair",
      dept: "Public Works Department",
      pri: "medium",
      lat: 28.7098,
      lng: 77.1189,
      addr: "Road to Japanese Park Gate 3, Sector 11, Rohini, Delhi",
      user: c5,
      status: "ASSIGNED",
      confirms: 7,
      days: 18,
      helpers: [ngo4],
    },
    {
      title: "Non-functional traffic signal at Sector 11 main chowk",
      desc: "The automated traffic lights at the major Sector 11 intersection near Aggarwal Fun City Mall have been continuously flashing yellow for over a week. Heavy congestion and multiple near-miss accidents occur during peak morning and evening office rush.",
      cat: "Traffic Signal",
      dept: "Delhi Traffic Police",
      pri: "urgent",
      lat: 28.7105,
      lng: 77.1201,
      addr: "Sector 11 Main Chowk, near Aggarwal Fun City, Rohini",
      user: c5,
      status: "IN_PROGRESS",
      confirms: 19,
      days: 8,
      helpers: [],
    },
    {
      title: "Public drinking water booth broken and leaking",
      desc: "The MCD water filtration booth near Sector 11 community centre has a ruptured supply line. Hundreds of liters of potable water are being wasted daily while water pools on the adjacent footpath.",
      cat: "Water Supply",
      dept: "Delhi Jal Board",
      pri: "medium",
      lat: 28.7088,
      lng: 77.1175,
      addr: "Community Centre Water Station, Sector 11, Rohini",
      user: c5,
      status: "PENDING",
      confirms: 8,
      days: 3,
      helpers: [ngo1],
    },

    // --- Sector 14 & 15 (Schools & Institutional Area) ---
    {
      title: "School zone speed breaker worn flat near Bal Bharati Public School",
      desc: "The rumble strips and speed breakers outside Bal Bharati Public School in Sector 14 are completely flattened and markings have worn off. Speeding vehicles pose an imminent danger to children during school dismissal hours.",
      cat: "Traffic Sign",
      dept: "Public Works Department",
      pri: "high",
      lat: 28.7135,
      lng: 77.1288,
      addr: "Road outside Bal Bharati Public School, Sector 14, Rohini",
      user: c10,
      status: "PENDING",
      confirms: 15,
      days: 6,
      helpers: [ngo4],
    },
    {
      title: "Contaminated tap water supply in Sector 15 Pocket 3",
      desc: "Residents in Sector 15 Pocket 3 are receiving yellow, foul-smelling tap water during the morning supply window. We suspect an underground pipeline rupture where sewage is mixing with potable water supply lines.",
      cat: "Water Supply",
      dept: "Delhi Jal Board",
      pri: "urgent",
      lat: 28.7162,
      lng: 77.1254,
      addr: "Pocket 3, Sector 15, Rohini, Delhi",
      user: c12,
      status: "IN_PROGRESS",
      confirms: 28,
      days: 3,
      helpers: [ngo1],
    },
    {
      title: "Dead tree leaning precariously over 11kV electrical cables",
      desc: "A dried-up Gulmohar tree inside Sector 15 Green Belt is tilting heavily towards the overhead BSES high tension power line. It could snap the cables during heavy winds and trigger a blackout or fire.",
      cat: "Electricity",
      dept: "BSES Rajdhani Power",
      pri: "high",
      lat: 28.7170,
      lng: 77.1240,
      addr: "Green Belt adjacent to Pocket 2, Sector 15, Rohini",
      user: c12,
      status: "ASSIGNED",
      confirms: 10,
      days: 9,
      helpers: [ngo2],
    },

    // --- Sector 16 (Densely Populated Residential Area) ---
    {
      title: "Acute water pressure drop in C-Block upper floors",
      desc: "Water pressure has drastically reduced in Sector 16 C-Block for the past 10 days. 2nd and 3rd floor families are receiving zero flow and are forced to spend thousands on private water tankers.",
      cat: "Water Supply",
      dept: "Delhi Jal Board",
      pri: "high",
      lat: 28.7150,
      lng: 77.1220,
      addr: "C-Block Residential Area, Sector 16, Rohini, Delhi",
      user: c2,
      status: "PENDING",
      confirms: 16,
      days: 10,
      helpers: [],
    },
    {
      title: "Aggressive stray dog pack near Sector 16 Mother Dairy booth",
      desc: "A pack of 10-12 unvaccinated stray dogs has occupied the vacant plot opposite Sector 16 Mother Dairy. They have chased several cyclists and bitten two children this month. Immediate sterilization and vaccination drive required.",
      cat: "Stray Animal",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "high",
      lat: 28.7145,
      lng: 77.1235,
      addr: "Opposite Mother Dairy, Sector 16, Rohini, Delhi",
      user: c2,
      status: "ASSIGNED",
      confirms: 18,
      days: 7,
      helpers: [ngo5],
    },
    {
      title: "Damaged stormwater manhole with no lid in Sector 16 B-Block",
      desc: "A 4-foot deep stormwater drain manhole in front of House B-89 is missing its heavy cast iron cover. Local residents placed a wooden branch inside it as an improvised warning sign.",
      cat: "Open Manhole",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "urgent",
      lat: 28.7158,
      lng: 77.1210,
      addr: "Near B-89, Sector 16, Rohini, Delhi",
      user: c2,
      status: "RESOLVED",
      confirms: 14,
      days: 20,
      helpers: [ngo4],
    },

    // --- Sector 18 & 20 (Metro & Modern Enclaves) ---
    {
      title: "Non-functional street lights along Rohini Sector 18 Metro corridor",
      desc: "The 800-meter street light stretch connecting Badli Industrial Area to Sector 18 Metro station has been non-operational. Late-night workers and metro commuters feel unsafe walking this stretch.",
      cat: "Street Light",
      dept: "BSES Rajdhani Power",
      pri: "high",
      lat: 28.7245,
      lng: 77.1355,
      addr: "Sector 18 Metro Approach Road, Rohini, Delhi",
      user: c11,
      status: "PENDING",
      confirms: 11,
      days: 8,
      helpers: [],
    },
    {
      title: "Commercial construction debris dumped on Sector 20 main walkway",
      desc: "Over 5 truckloads of concrete rubble, plaster, and bricks have been dumped along the public pedestrian walkway in Sector 20. Pedestrians must walk on the high-speed main road.",
      cat: "Garbage Collection",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "medium",
      lat: 28.7212,
      lng: 77.1205,
      addr: "Pocket 12 Walkway, Sector 20, Rohini, Delhi",
      user: c11,
      status: "ASSIGNED",
      confirms: 7,
      days: 12,
      helpers: [ngo1],
    },

    // --- Sector 22 (New Expansion Zone) ---
    {
      title: "Open storm drain clogged with construction silt & plastic",
      desc: "The main drainage channel running through Sector 22 is completely choked with construction debris and solid plastic waste. Even moderate rainfall causes 2 feet of waterlogging across the sector entrance.",
      cat: "Drainage",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "high",
      lat: 28.7200,
      lng: 77.1300,
      addr: "Main Arterial Road, Sector 22, Rohini, Delhi",
      user: c3,
      status: "PENDING",
      confirms: 9,
      days: 14,
      helpers: [ngo1],
    },
    {
      title: "Illegal open garbage dumping ground behind Sector 22 Senior School",
      desc: "An empty 2-acre plot behind the Government Senior Secondary School in Sector 22 has been illegally converted into a dumping ground. Hazardous medical waste and toxic plastics are routinely set on fire causing severe air pollution.",
      cat: "Garbage Collection",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "urgent",
      lat: 28.7210,
      lng: 77.1285,
      addr: "Behind Govt Senior Secondary School, Sector 22, Rohini",
      user: c3,
      status: "IN_PROGRESS",
      confirms: 31,
      days: 18,
      helpers: [ngo1, ngo2],
    },
    {
      title: "Missing road direction and sector signage at Sector 22/23 roundabout",
      desc: "The central overhead signage at the roundabout between Sector 22 and Sector 23 was knocked down during an accident 3 months ago and never replaced. Drivers unfamiliar with the sector frequently take wrong turns into dead-end lanes.",
      cat: "Traffic Sign",
      dept: "Delhi Traffic Police",
      pri: "low",
      lat: 28.7225,
      lng: 77.1315,
      addr: "Sector 22 & 23 Junction Roundabout, Rohini",
      user: c3,
      status: "PENDING",
      confirms: 4,
      days: 45,
      helpers: [],
    },

    // --- Sector 24 & 25 (Outer Rohini) ---
    {
      title: "Broken footpath interlocking tiles causing severe trip hazards",
      desc: "Multiple sections of interlocking footpath tiles along Sector 24 market avenue are dislodged and jutting upward. An elderly citizen suffered a wrist fracture last week after tripping on the uneven surface.",
      cat: "Footpath",
      dept: "Public Works Department",
      pri: "medium",
      lat: 28.7180,
      lng: 77.1340,
      addr: "Market Road Footpath, Sector 24, Rohini, Delhi",
      user: c7,
      status: "ASSIGNED",
      confirms: 6,
      days: 22,
      helpers: [ngo4],
    },
    {
      title: "Cattle roaming freely on Sector 25 main transport corridor",
      desc: "Over 15 stray cows and bulls sit on the central verge of Sector 25 main link road. Rapidly moving traffic from Rithala frequently swerves dangerously to avoid collisions at night.",
      cat: "Stray Animal",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "high",
      lat: 28.7220,
      lng: 77.1050,
      addr: "Link Road, Sector 25, Rohini, Delhi",
      user: c16,
      status: "PENDING",
      confirms: 12,
      days: 6,
      helpers: [ngo5],
    },
    {
      title: "Burned-out street light transformer near Pocket 4 park",
      desc: "The local lighting transformer near Pocket 4 caught fire during a storm and remains decommissioned. Three residential lanes have been without street lights for 10 days.",
      cat: "Electricity",
      dept: "BSES Rajdhani Power",
      pri: "high",
      lat: 28.7230,
      lng: 77.1042,
      addr: "Pocket 4 Park Perimeter, Sector 25, Rohini",
      user: c16,
      status: "ASSIGNED",
      confirms: 10,
      days: 10,
      helpers: [],
    },

    // --- Prashant Vihar (Affluent Residential & Institutional Hub) ---
    {
      title: "Sparking pole-mounted electrical transformer near F-1 Block",
      desc: "The pole-mounted distribution transformer near F-1 Block in Prashant Vihar sparks loudly and emits smoke during late night hours. Residents fear a severe electrical fire hazard.",
      cat: "Electricity",
      dept: "BSES Rajdhani Power",
      pri: "urgent",
      lat: 28.7050,
      lng: 77.1270,
      addr: "F-1 Block, Prashant Vihar, Rohini, Delhi",
      user: c6,
      status: "IN_PROGRESS",
      confirms: 17,
      days: 2,
      helpers: [],
    },
    {
      title: "Faded zebra crossing & missing pedestrian signal outside Public School",
      desc: "Zebra crossing paint on the 4-lane road in front of Prashant Vihar Public School has completely worn away. Over 1,200 students cross this busy street daily without dedicated pedestrian green signals.",
      cat: "Traffic Sign",
      dept: "Delhi Traffic Police",
      pri: "medium",
      lat: 28.7060,
      lng: 77.1255,
      addr: "Road outside Prashant Vihar Public School, Rohini",
      user: c6,
      status: "RESOLVED",
      confirms: 11,
      days: 28,
      helpers: [ngo4],
    },
    {
      title: "Leaking sewage pipe flooding Prashant Vihar green verge",
      desc: "An underground DJB sewage pipe has ruptured near the community park boundary wall, releasing wastewater into the roadside green strip and producing a mosquito breeding ground.",
      cat: "Sewage",
      dept: "Delhi Jal Board",
      pri: "high",
      lat: 28.7042,
      lng: 77.1280,
      addr: "Green Verge near Park, Prashant Vihar, Rohini",
      user: c6,
      status: "ASSIGNED",
      confirms: 8,
      days: 7,
      helpers: [ngo1],
    },

    // --- Budh Vihar & Vijay Vihar (Dense Urban Localities) ---
    {
      title: "Severe waterlogging at Budh Vihar Phase-1 Railway Underpass",
      desc: "The railway underpass connecting Budh Vihar Phase-1 to main Rohini gets submerged under 4 feet of stagnant water even during mild drizzle. The automated dewatering pump has burned out.",
      cat: "Drainage",
      dept: "Public Works Department",
      pri: "urgent",
      lat: 28.7120,
      lng: 77.0980,
      addr: "Railway Underpass, Budh Vihar Phase-1, Rohini, Delhi",
      user: c8,
      status: "IN_PROGRESS",
      confirms: 26,
      days: 16,
      helpers: [ngo1],
    },
    {
      title: "Sulabh public toilet complex locked and neglected in H-Block",
      desc: "The community public toilet complex in H-Block Budh Vihar has remained locked with padlocks for over 5 weeks. Daily wage laborers, market vendors, and auto drivers have no sanitation facility available.",
      cat: "Public Toilet",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "high",
      lat: 28.7130,
      lng: 77.0965,
      addr: "H-Block Main Chowk, Budh Vihar Phase-1, Rohini",
      user: c8,
      status: "PENDING",
      confirms: 13,
      days: 25,
      helpers: [ngo3],
    },
    {
      title: "Hanging tangled low-voltage cables in narrow residential gali",
      desc: "Clusters of internet and power cables are hanging below 6 feet height across Gali No. 4, posing severe head strike hazards and risk of electric shock for delivery riders.",
      cat: "Electricity",
      dept: "BSES Rajdhani Power",
      pri: "medium",
      lat: 28.7115,
      lng: 77.0990,
      addr: "Gali No. 4, Budh Vihar Phase-1, Rohini",
      user: c8,
      status: "ASSIGNED",
      confirms: 5,
      days: 11,
      helpers: [],
    },

    // --- Pooth Kalan & Rithala (Peripheral & Rapidly Growing) ---
    {
      title: "Underground PNG pipeline gas odor near Pooth Kalan crossing",
      desc: "Strong cooking gas odor detected near the underground IGL pipeline joint at the main Pooth Kalan traffic junction. The smell intensifies during morning peak pressure hours.",
      cat: "Gas Leak",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "urgent",
      lat: 28.7250,
      lng: 77.0920,
      addr: "Main Junction Crossing, Pooth Kalan, Rohini, Delhi",
      user: c13,
      status: "RESOLVED",
      confirms: 24,
      days: 3,
      anon: true,
      helpers: [],
    },
    {
      title: "Illegal commercial waste burning near Pooth Kalan canal road",
      desc: "Industrial fabric cuttings and plastic scrap are being incinerated late at night along the canal road, emitting noxious black smoke across nearby residential pockets.",
      cat: "Garbage Collection",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "high",
      lat: 28.7265,
      lng: 77.0910,
      addr: "Canal Service Road, Pooth Kalan, Rohini",
      user: c13,
      status: "PENDING",
      confirms: 10,
      days: 5,
      helpers: [ngo2],
    },
    {
      title: "Rithala Metro Station auto stand road heavily cratered",
      desc: "The passenger pickup and auto-rickshaw lane outside Rithala Metro terminus has turned into an unpaved muddy pit with continuous standing water after utility pipe digging.",
      cat: "Road Repair",
      dept: "Public Works Department",
      pri: "high",
      lat: 28.7205,
      lng: 77.1065,
      addr: "Auto Pickup Bay, Rithala Metro Station, Rohini",
      user: c16,
      status: "ASSIGNED",
      confirms: 21,
      days: 19,
      helpers: [ngo4],
    },

    // --- Pitampura & Deepali Enclave (Adjoining Rohini) ---
    {
      title: "Broken sprinkler system causing park lawn drying in Pitampura",
      desc: "The underground automatic sprinkler pipeline in Guru Harkishan Nagar DDA District Park has burst, causing one side to flood while the main lawn has dried up completely.",
      cat: "Park Maintenance",
      dept: "Horticulture & Urban Forestry",
      pri: "low",
      lat: 28.6920,
      lng: 77.1200,
      addr: "District Park, Guru Harkishan Nagar, Pitampura",
      user: c14,
      status: "RESOLVED",
      confirms: 6,
      days: 30,
      helpers: [ngo2],
    },
    {
      title: "Garbage compaction truck hydraulic oil leak on main road",
      desc: "A broken municipal waste vehicle spilled hydraulic oil and refuse along a 100-meter stretch of the Outer Ring Road service lane near Deepali Chowk, causing several two-wheelers to slip.",
      cat: "Garbage Collection",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "urgent",
      lat: 28.6940,
      lng: 77.1180,
      addr: "Outer Ring Road Service Lane, near Deepali Chowk, Rohini",
      user: c15,
      status: "RESOLVED",
      confirms: 15,
      days: 12,
      helpers: [ngo1],
    },

    // --- Duplicate Cluster: Two additional reports for Sector 7 Pothole ---
    {
      title: "Deep crater damaging cars at Sector 7 Gurudwara road",
      desc: "A massive pothole at the entry road of Sector 7 near the gurudwara cracked my car's front rim yesterday. The hole is about 2 feet deep and expanding daily.",
      cat: "Pothole",
      dept: "Public Works Department",
      pri: "high",
      lat: 28.7042,
      lng: 77.1167,
      addr: "Entry Road near Gurudwara, Sector 7, Rohini, Delhi",
      user: c3,
      status: "IN_PROGRESS",
      confirms: 8,
      days: 6,
      helpers: [],
    },
    {
      title: "Unmarked hazardous road sinkhole near Sector 7 market",
      desc: "The road has sunken near Sector 7 weekly market entrance. Auto-rickshaws almost flip over when trying to navigate around it.",
      cat: "Pothole",
      dept: "Public Works Department",
      pri: "high",
      lat: 28.7040,
      lng: 77.1163,
      addr: "Sector 7 Market Road, Rohini, Delhi",
      user: c9,
      status: "IN_PROGRESS",
      confirms: 5,
      days: 5,
      helpers: [],
    },

    // --- Duplicate Cluster: Sewage at Rohini East Metro ---
    {
      title: "Foul wastewater leak outside Rohini East Metro station",
      desc: "Black foul-smelling drain water is bubbling up from the pavement outside gate 2 of Rohini East metro station. Extremely unhygienic.",
      cat: "Sewage",
      dept: "Delhi Jal Board",
      pri: "urgent",
      lat: 28.6976,
      lng: 77.1114,
      addr: "Metro Gate 2 Exit, Sector 3, Rohini, Delhi",
      user: c1,
      status: "IN_PROGRESS",
      confirms: 11,
      days: 4,
      helpers: [],
    },

    // --- Resolved Historical Records for Analytics ---
    {
      title: "High voltage electrical pole sparking in Sector 14 Pocket 1",
      desc: "The junction box on pole #14-B was emitting sparks during humidity. BSES emergency crew replaced the faulty insulator and secured the fuse box.",
      cat: "Electricity",
      dept: "BSES Rajdhani Power",
      pri: "high",
      lat: 28.7140,
      lng: 77.1275,
      addr: "Pocket 1, Sector 14, Rohini, Delhi",
      user: c10,
      status: "RESOLVED",
      confirms: 18,
      days: 48,
      helpers: [],
    },
    {
      title: "Broken municipal water main flooded Sector 8 road",
      desc: "A 6-inch DJB feeder pipe cracked outside Sector 8 commercial complex. DJB team excavated the section, clamped the pipe, and restored water supply within 24 hours.",
      cat: "Water Supply",
      dept: "Delhi Jal Board",
      pri: "urgent",
      lat: 28.7058,
      lng: 77.1225,
      addr: "Commercial Complex, Sector 8, Rohini, Delhi",
      user: c9,
      status: "RESOLVED",
      confirms: 20,
      days: 55,
      helpers: [ngo1],
    },

    // --- Rejected / Spam reports ---
    {
      title: "Civic Issue",
      desc: "bad road in delhi fix it",
      cat: "Other",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "low",
      lat: null as any,
      lng: null as any,
      addr: null as any,
      user: c5,
      status: "REJECTED",
      confirms: 0,
      days: 15,
      helpers: [],
    },
    {
      title: "Test report pls ignore",
      desc: "testing the mobile app report submission 123",
      cat: "Other",
      dept: "Municipal Corporation - Rohini Zone",
      pri: "low",
      lat: 28.7100,
      lng: 77.1100,
      addr: "Rohini",
      user: c7,
      status: "REJECTED",
      confirms: 0,
      days: 20,
      helpers: [],
    },
  ];

  console.log(`Inserting ${complaintsData.length} civic complaints with realistic metadata...`);

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
        isAnonymous: (c as any).anon || false,
        reportedById: c.user.id,
        createdAt: created,
        updatedAt: c.status === "RESOLVED" ? daysAgo(Math.max(0, c.days - 5)) : new Date(),
      },
    });

    // Create realistic Status History Audit Trail
    if (c.status !== "PENDING") {
      const assignedAdmin =
        c.dept === "Public Works Department" ? admin2 :
        c.dept === "Delhi Jal Board" ? admin3 :
        c.dept === "Delhi Traffic Police" ? admin4 : admin1;

      // First transition: PENDING -> ASSIGNED
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: "PENDING",
          newStatus: c.status === "REJECTED" ? "REJECTED" : "ASSIGNED",
          changedById: assignedAdmin.id,
          changedByRole: "ADMIN",
          notes:
            c.status === "REJECTED"
              ? "Rejected by admin: Insufficient location details or non-actionable civic report."
              : `Ticket verified by automated intake and assigned to ${c.dept}.`,
          createdAt: daysAgo(Math.max(1, c.days - 1)),
        },
      });

      // Second transition if IN_PROGRESS or RESOLVED
      if (c.status === "IN_PROGRESS" || c.status === "RESOLVED") {
        await prisma.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            oldStatus: "ASSIGNED",
            newStatus: "IN_PROGRESS",
            changedById: assignedAdmin.id,
            changedByRole: "ADMIN",
            notes: "Field inspection completed. Maintenance contractor dispatched on site.",
            createdAt: daysAgo(Math.max(1, c.days - 3)),
          },
        });
      }

      // Third transition if RESOLVED
      if (c.status === "RESOLVED") {
        await prisma.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            oldStatus: "IN_PROGRESS",
            newStatus: "RESOLVED",
            changedById: assignedAdmin.id,
            changedByRole: "ADMIN",
            notes: "Repairs completed and verified via on-site photographic inspection.",
            createdAt: daysAgo(Math.max(0, c.days - 5)),
          },
        });
      }
    }

    // Attach NGO helpers
    if (c.helpers && c.helpers.length > 0) {
      for (const ngo of c.helpers) {
        await prisma.complaintHelper.create({
          data: {
            complaintId: complaint.id,
            userId: ngo.id,
            status: "HELPING",
            message: `${ngo.organization} has mobilized local volunteers to assist in resolving this civic issue.`,
          },
        }).catch(() => {});
      }
    }

    // Attach Citizen confirmations / upvotes
    const numConfirms = Math.min(c.confirms, citizens.length);
    for (let j = 0; j < numConfirms; j++) {
      if (citizens[j].id !== c.user.id) {
        await prisma.complaintConfirmation.create({
          data: {
            complaintId: complaint.id,
            userId: citizens[j].id,
          },
        }).catch(() => {});
      }
    }
  }

  // ── 5. Seed Notifications ──
  // Notifications for Municipal Admin
  await prisma.notification.create({
    data: {
      userId: admin1.id,
      title: "Urgent: Sewage Overflow near Rohini East Metro",
      message: "A high-priority sewage overflow issue at Rohini East Metro Station has crossed 20 crowd confirmations. Immediate action required.",
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: admin1.id,
      title: "Potential Duplicate Cluster Detected",
      message: "3 overlapping reports about potholes near Sector 7 Gurudwara detected within a 50m radius. Review and cluster recommendations ready.",
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: admin1.id,
      title: "New NGO Registration Pending",
      message: "Youth Aid Welfare Society (Budh Vihar) has registered and is awaiting admin verification.",
      isRead: false,
    },
  });

  // Notifications for PWD Admin
  await prisma.notification.create({
    data: {
      userId: admin2.id,
      title: "Work Order Update: Sector 7 Market Road",
      message: "Pothole repair team dispatched to Sector 7 Gurudwara main road. Status shifted to IN_PROGRESS.",
      isRead: true,
    },
  });

  // Notifications for NGOs
  await prisma.notification.create({
    data: {
      userId: ngo1.id,
      title: "Pledge Acknowledged by Admin",
      message: "Your volunteer pledge for the Sector 7 garbage overflow has been approved by the Municipal Zonal Admin.",
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: ngo3.id,
      title: "NGO Application Under Review",
      message: "Your organization registration for Youth Aid Welfare Society is currently being reviewed by municipal officials.",
      isRead: false,
    },
  });

  // Notifications for Citizens
  await prisma.notification.create({
    data: {
      userId: c1.id,
      title: "Update on Report: Massive pothole near Sector 7",
      message: "Your report has been acknowledged by Public Works Department and is currently IN_PROGRESS.",
      isRead: false,
    },
  });

  console.log("=================================================================");
  console.log("✅ Seed complete! Rohini dataset loaded with 40+ civic issues.");
  console.log("=================================================================");
  console.log("🔑 Demo Login Credentials (all passwords: password123):");
  console.log("   • Citizen:  vikram@gmail.com");
  console.log("   • Admin:    admin@jansamvedan.org (Municipal Corporation)");
  console.log("   • Admin 2:  sunita.admin@jansamvedan.org (Public Works Dept)");
  console.log("   • Admin 3:  anil.djb@jansamvedan.org (Delhi Jal Board)");
  console.log("   • Admin 4:  manoj.traffic@jansamvedan.org (Delhi Traffic Police)");
  console.log("   • NGO:      amit@cleanrohini.org (Clean Rohini Foundation - Verified)");
  console.log("   • NGO 2:    priya@greendelhi.org (Green Delhi Initiative - Verified)");
  console.log("   • NGO 3:    deepak@youthaid.in (Youth Aid Welfare - Pending)");
  console.log("=================================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());