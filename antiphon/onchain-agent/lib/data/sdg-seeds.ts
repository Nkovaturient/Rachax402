/** Compact SDG seed data — expanded into full SDGAgent in sdg-agents.ts */

export type SDGSeed = {
  number: number;
  name: string;
  role: string;
  sdgTitle: string;
  accentColor: string;
  problem: string;
  description: string;
  dataSources: string[];
  exampleTasks: string[];
  connectionBadges: string[];
  systems: { label: string; value: string; unit?: string; trend?: string }[];
  tools: { label: string; description: string; capability: string }[];
};

export const SDG_SEEDS: SDGSeed[] = [
  {
    number: 1,
    name: "ZARA",
    role: "Financial Inclusion Analyst",
    sdgTitle: "No Poverty",
    accentColor: "#E5243B",
    problem: "1.4B adults unbanked (World Bank FINDEX 2022). Remittance fees average 6.2%, draining ~$48B/yr from households.",
    description:
      "Maps financial inclusion gaps, models remittance corridor savings, and analyses household survey data to identify poverty clustering and intervention priorities.",
    dataSources: ["World Bank FINDEX", "UN Poverty stats", "GSMA Mobile Money", "World Bank Remittance Prices DB"],
    exampleTasks: [
      "Compare mobile money penetration in Kenya vs Nigeria",
      "Estimate savings if remittance fees drop to 1% for El Salvador",
      "Analyse this household income CSV for poverty clustering",
    ],
    connectionBadges: ["FINDEX", "Remittance"],
    systems: [
      { label: "Unbanked adults", value: "1.4", unit: "B", trend: "FINDEX 2022" },
      { label: "Avg remittance fee", value: "6.2", unit: "%", trend: "WB 2023" },
      { label: "Fee drain", value: "48", unit: "B USD/yr" },
    ],
    tools: [
      { label: "Inclusion map", description: "FINDEX gap analysis by country", capability: "lookup" },
      { label: "Evidence search", description: "Remittance corridor research", capability: "search" },
      { label: "Household CSV", description: "Survey data analysis", capability: "csv" },
    ],
  },
  {
    number: 2,
    name: "ABEL",
    role: "Agri-Supply Chain Analyst",
    sdgTitle: "Zero Hunger",
    accentColor: "#DDA63A",
    problem: "733M chronically hungry (FAO 2023). 30–40% post-harvest loss in SSA; middlemen capture 40–60% of farmgate price.",
    description:
      "Traces agri price spreads, identifies food access gaps, and analyses crop yield and market data for food security interventions.",
    dataSources: ["FAO FAOSTAT", "WFP VAM", "IFPRI", "USDA PSD"],
    exampleTasks: [
      "Show maize price spread from farm to market in Ethiopia",
      "Which districts in Bangladesh have worst food access scores?",
      "Analyse this crop yield CSV for seasonal patterns",
    ],
    connectionBadges: ["FAO", "WFP"],
    systems: [
      { label: "Chronic hunger", value: "733", unit: "M", trend: "FAO 2023" },
      { label: "Post-harvest loss", value: "30–40", unit: "% SSA" },
      { label: "Middleman margin", value: "40–60", unit: "%" },
    ],
    tools: [
      { label: "Price spread", description: "Farm-to-market differential", capability: "lookup" },
      { label: "Food security", description: "WFP access assessments", capability: "search" },
      { label: "Yield CSV", description: "Seasonal pattern analysis", capability: "csv" },
    ],
  },
  {
    number: 3,
    name: "MEDI",
    role: "Health Systems Navigator",
    sdgTitle: "Good Health and Well-being",
    accentColor: "#4C9F38",
    problem: "4.5B lack essential health services (WHO 2023). CHW payment delays drive 30–40% attrition in LMICs.",
    description:
      "Analyses health outcome data, maps disease burden by region, and identifies high-impact interventions ranked by DALY reduction.",
    dataSources: ["WHO GHO", "IHME GBD", "UNICEF MICS", "DHS Program"],
    exampleTasks: [
      "Map maternal mortality hotspots in West Africa",
      "Which interventions have highest DALY reduction per $1000?",
      "Analyse this clinic utilisation CSV",
    ],
    connectionBadges: ["WHO", "DHS"],
    systems: [
      { label: "Without services", value: "4.5", unit: "B" },
      { label: "CHW attrition", value: "30–40", unit: "%" },
      { label: "DALY focus", value: "LMIC", unit: "priority" },
    ],
    tools: [
      { label: "Health indicators", description: "WHO GHO country data", capability: "lookup" },
      { label: "Burden search", description: "IHME/DHS evidence", capability: "search" },
      { label: "Clinic CSV", description: "Facility utilisation analysis", capability: "csv" },
    ],
  },
  {
    number: 4,
    name: "LUMA",
    role: "Education Access Analyst",
    sdgTitle: "Quality Education",
    accentColor: "#C5192D",
    problem: "244M children out of school (UNESCO 2023). Teacher absenteeism ~19% in SSA; remote teachers unpaid 3–6 months.",
    description:
      "Analyses enrollment and learning outcome data, maps education access gaps, and models teacher deployment and salary reform scenarios.",
    dataSources: ["UNESCO UIS", "World Bank EdStats", "PISA", "PASEC", "SACMEQ"],
    exampleTasks: [
      "Compare primary completion rates across SADC countries",
      "Estimate cost of closing teacher salary arrears in rural India",
      "Analyse this school enrolment CSV",
    ],
    connectionBadges: ["UNESCO", "EdStats"],
    systems: [
      { label: "Out of school", value: "244", unit: "M" },
      { label: "Teacher absence", value: "19", unit: "% SSA" },
      { label: "Salary arrears", value: "3–6", unit: "mo" },
    ],
    tools: [
      { label: "Enrollment data", description: "UNESCO UIS indicators", capability: "lookup" },
      { label: "Learning gaps", description: "PISA/PASEC assessment search", capability: "search" },
      { label: "Enrolment CSV", description: "Regional gap analysis", capability: "csv" },
    ],
  },
  {
    number: 5,
    name: "NOVA",
    role: "Gender Equity Analyst",
    sdgTitle: "Gender Equality",
    accentColor: "#FF3A21",
    problem: "Women own <20% of land globally (FAO). Women-led SMEs face ~30% higher loan rejection in LMICs.",
    description:
      "Analyses gender-disaggregated economic data, maps pay and access gaps, and models micro-grant and policy intervention scenarios.",
    dataSources: ["UN Women Data Hub", "World Bank Gender Portal", "OECD SIGI", "DHS Program"],
    exampleTasks: [
      "Which 5 countries have largest gender pay gap in agriculture?",
      "Model micro-loan access if collateral requirements removed",
      "Analyse this women's economic participation survey CSV",
    ],
    connectionBadges: ["UN Women", "SIGI"],
    systems: [
      { label: "Women land ownership", value: "<20", unit: "%" },
      { label: "SME rejection gap", value: "30", unit: "% higher" },
      { label: "Survey evidence", value: "CSV", unit: "analysed" },
    ],
    tools: [
      { label: "Gender indicators", description: "SIGI country profiles", capability: "lookup" },
      { label: "Wage gap", description: "Cross-country comparison", capability: "search" },
      { label: "Survey CSV", description: "Economic participation analysis", capability: "csv" },
    ],
  },
  {
    number: 6,
    name: "AQUA",
    role: "Water Systems Analyst",
    sdgTitle: "Clean Water and Sanitation",
    accentColor: "#26BDE2",
    problem: "2B lack safely managed drinking water (WHO/UNICEF 2023). LMIC utilities collect only 20–40% of billed revenue.",
    description:
      "Ingests water-quality data, maps service access gaps, and models utility revenue recovery and community pooling scenarios.",
    dataSources: ["WHO/UNICEF JMP", "AQUASTAT", "World Bank Water Data", "IRC WASH"],
    exampleTasks: [
      "Identify districts in Kenya with worst safe water access",
      "Model revenue recovery with mobile payments vs cash billing",
      "Analyse this water quality CSV for contamination patterns",
    ],
    connectionBadges: ["JMP", "AQUASTAT"],
    systems: [
      { label: "Without safe water", value: "2", unit: "B" },
      { label: "Utility collection", value: "20–40", unit: "%" },
      { label: "Sensor audits", value: "CSV", unit: "analysed" },
    ],
    tools: [
      { label: "Water indicators", description: "JMP access data", capability: "lookup" },
      { label: "WASH search", description: "Utility performance studies", capability: "search" },
      { label: "Quality CSV", description: "Contamination pattern analysis", capability: "csv" },
    ],
  },
  {
    number: 7,
    name: "WATT",
    role: "Energy Access Analyst",
    sdgTitle: "Affordable and Clean Energy",
    accentColor: "#FCC30B",
    problem: "675M without electricity (IEA 2023). Off-grid solar PAYG reports 35–50% collection failure from cash friction.",
    description:
      "Models electrification gaps, prioritises deployment zones via ESMAP data, and analyses consumption and repayment patterns.",
    dataSources: ["IEA WEO", "ESMAP", "SE4All", "IRENA"],
    exampleTasks: [
      "Which SSA countries have highest solar potential and lowest electrification?",
      "Estimate emissions reduction if 1M households switch from kerosene",
      "Analyse this PAYG solar repayment CSV",
    ],
    connectionBadges: ["IEA", "IRENA"],
    systems: [
      { label: "Without electricity", value: "675", unit: "M" },
      { label: "PAYG failure", value: "35–50", unit: "%" },
      { label: "kWh billing", value: "off-grid", unit: "priority" },
    ],
    tools: [
      { label: "Access map", description: "ESMAP gap prioritisation", capability: "lookup" },
      { label: "Energy search", description: "IRENA potential studies", capability: "search" },
      { label: "Repayment CSV", description: "Collection analysis", capability: "csv" },
    ],
  },
  {
    number: 8,
    name: "GAIA",
    role: "Labour and Growth Analyst",
    sdgTitle: "Decent Work and Economic Growth",
    accentColor: "#A21942",
    problem: "473M need jobs (ILO 2023). 2B in informal economy; gig workers face 30–90 day payment delays.",
    description:
      "Analyses ILO labour deficit data, maps informal employment by sector, and models payment reform and worker retention scenarios.",
    dataSources: ["ILO ILOSTAT", "World Bank Jobs", "IFC MSME Finance Gap"],
    exampleTasks: [
      "Which sectors in Southeast Asia have highest informal employment?",
      "Model impact of same-day payment on gig worker retention",
      "Analyse this labour force survey CSV",
    ],
    connectionBadges: ["ILO", "IFC"],
    systems: [
      { label: "Jobs gap", value: "473", unit: "M" },
      { label: "Informal workers", value: "2", unit: "B" },
      { label: "Payment delay", value: "30–90", unit: "days" },
    ],
    tools: [
      { label: "Labour indicators", description: "ILOSTAT country data", capability: "lookup" },
      { label: "Jobs search", description: "IFC/MSME gap studies", capability: "search" },
      { label: "Labour CSV", description: "Sector deficit analysis", capability: "csv" },
    ],
  },
  {
    number: 9,
    name: "FORGE",
    role: "Industrial Development Analyst",
    sdgTitle: "Industry, Innovation and Infrastructure",
    accentColor: "#FD6925",
    problem: "SME financing gap $5.2T (IFC). Africa infrastructure deficit $68–108B/yr (AfDB).",
    description:
      "Maps SME financing and infrastructure gaps, analyses cross-border trade corridor data, and identifies high-multiplier investment zones.",
    dataSources: ["IFC SME Finance", "AfDB", "World Bank Infrastructure", "OECD FDI"],
    exampleTasks: [
      "Map SME financing gap by sector in West Africa",
      "Which East Africa infrastructure projects have highest multiplier?",
      "Analyse this manufacturing export CSV",
    ],
    connectionBadges: ["AfDB", "IFC"],
    systems: [
      { label: "SME gap", value: "5.2", unit: "T USD" },
      { label: "Infra deficit", value: "68–108", unit: "B/yr Africa" },
      { label: "Cross-border", value: "trade", unit: "priority" },
    ],
    tools: [
      { label: "Infra indicators", description: "AfDB infrastructure data", capability: "lookup" },
      { label: "SME search", description: "IFC financing gap studies", capability: "search" },
      { label: "Export CSV", description: "Manufacturing analysis", capability: "csv" },
    ],
  },
  {
    number: 10,
    name: "EQAL",
    role: "Inequality Analyst",
    sdgTitle: "Reduced Inequalities",
    accentColor: "#DD1367",
    problem: "Top 1% own 43% of global wealth (WID 2022). Migrants send $831B home but pay ~$50B in fees.",
    description:
      "Analyses Gini and remittance data, models corridor fee reduction scenarios, and identifies inequality drivers by country.",
    dataSources: ["World Inequality Database", "World Bank PovcalNet", "OECD Income Distribution", "IMF"],
    exampleTasks: [
      "Which 10 countries saw largest Gini increase 2015–2023?",
      "Model household impact of cutting remittance fees by 4%",
      "Analyse this wealth distribution CSV",
    ],
    connectionBadges: ["WID", "PovcalNet"],
    systems: [
      { label: "Top 1% wealth", value: "43", unit: "%" },
      { label: "Remittances", value: "831", unit: "B USD" },
      { label: "Fee drain", value: "50", unit: "B USD" },
    ],
    tools: [
      { label: "Gini track", description: "WID country trends", capability: "lookup" },
      { label: "Inequality search", description: "PovcalNet studies", capability: "search" },
      { label: "Wealth CSV", description: "Distribution analysis", capability: "csv" },
    ],
  },
  {
    number: 11,
    name: "URBA",
    role: "Urban Systems Analyst",
    sdgTitle: "Sustainable Cities and Communities",
    accentColor: "#FD9D24",
    problem: "1B in urban slums (UN-Habitat 2023). LMIC cities collect only 40–60% of property tax.",
    description:
      "Analyses urban service data, maps slum growth and service delivery gaps, and models municipal revenue reform scenarios.",
    dataSources: ["UN-Habitat Urban Data", "World Bank City Indicators", "GHSL", "OpenStreetMap"],
    exampleTasks: [
      "Rank African cities by slum population growth rate",
      "Model property tax recovery with mobile payment",
      "Analyse this urban service delivery CSV",
    ],
    connectionBadges: ["UN-Habitat", "GHSL"],
    systems: [
      { label: "Urban slum pop", value: "1", unit: "B" },
      { label: "Tax collection", value: "40–60", unit: "%" },
      { label: "Urban 2050", value: "68", unit: "% world" },
    ],
    tools: [
      { label: "Slum indicators", description: "UN-Habitat urban data", capability: "lookup" },
      { label: "City search", description: "Municipal finance studies", capability: "search" },
      { label: "Service CSV", description: "Delivery gap analysis", capability: "csv" },
    ],
  },
  {
    number: 12,
    name: "CIRC",
    role: "Circular Economy Analyst",
    sdgTitle: "Responsible Consumption and Production",
    accentColor: "#BF8B2E",
    problem: "2.24B tonnes municipal waste/yr (UNEP); 13.5% recycled globally. Textile waste ~92M tonnes/yr.",
    description:
      "Tracks material efficiency and waste data, models recycling incentive schemes, and identifies circular economy intervention points by sector.",
    dataSources: ["UNEP", "FAO Food Loss & Waste", "Global Waste Index", "Ellen MacArthur Foundation"],
    exampleTasks: [
      "Which industries have highest material efficiency gap in South Asia?",
      "Design a plastic recycling micropayment scheme for Lagos",
      "Analyse this waste audit CSV",
    ],
    connectionBadges: ["UNEP", "Circular Economy"],
    systems: [
      { label: "Municipal waste", value: "2.24", unit: "B t/yr" },
      { label: "Recycled", value: "13.5", unit: "%" },
      { label: "Textile waste", value: "92", unit: "M t/yr" },
    ],
    tools: [
      { label: "Waste indicators", description: "UNEP material footprint", capability: "lookup" },
      { label: "Circular search", description: "Recycling value-chain studies", capability: "search" },
      { label: "Waste CSV", description: "Audit analysis", capability: "csv" },
    ],
  },
  {
    number: 13,
    name: "GAIA-C",
    role: "Climate Systems Analyst",
    sdgTitle: "Climate Action",
    accentColor: "#3F7E44",
    problem: "3.3–3.6B highly climate-vulnerable (IPCC AR6). Carbon markets need transparency; double-counting risk.",
    description:
      "Analyses ND-GAIN and IPCC risk data, maps adaptation finance gaps, and identifies emissions hotspots and carbon market reform options.",
    dataSources: ["IPCC", "ND-GAIN", "Global Carbon Project", "World Bank Climate Portal"],
    exampleTasks: [
      "Which LDCs are most climate-exposed with least adaptation finance?",
      "Verify this REDD+ credit with deforestation data",
      "Analyse this emissions CSV for scope 3 hotspots",
    ],
    connectionBadges: ["IPCC", "ND-GAIN"],
    systems: [
      { label: "Climate vulnerable", value: "3.3–3.6", unit: "B" },
      { label: "Carbon market", value: "50–100", unit: "B/yr need" },
      { label: "ND-GAIN", value: "country", unit: "index" },
    ],
    tools: [
      { label: "Risk map", description: "ND-GAIN + IPCC overlay", capability: "lookup" },
      { label: "Climate search", description: "Adaptation finance studies", capability: "search" },
      { label: "Emissions CSV", description: "Scope 3 hotspots", capability: "csv" },
    ],
  },
  {
    number: 14,
    name: "FINN",
    role: "Marine Economy Analyst",
    sdgTitle: "Life Below Water",
    accentColor: "#0A97D9",
    problem: "IUU fishing costs ~$23.5B/yr (FAO). Small-scale fishers receive 10–30% of final fish price.",
    description:
      "Analyses fish stock and ocean health data, maps IUU risk zones, and models direct-market access improvements for small-scale fishers.",
    dataSources: ["FAO FishStat", "Global Fishing Watch", "NOAA", "Ocean Health Index"],
    exampleTasks: [
      "Identify highest IUU risk zones in West African EEZ",
      "Model fisher income improvement with direct-to-buyer payment",
      "Analyse this fish stock survey CSV",
    ],
    connectionBadges: ["GFW", "FAO"],
    systems: [
      { label: "IUU cost", value: "23.5", unit: "B USD/yr" },
      { label: "Fisher share", value: "10–30", unit: "% price" },
      { label: "Ocean dependents", value: "3", unit: "B people" },
    ],
    tools: [
      { label: "Stock indicators", description: "FAO FishStat data", capability: "lookup" },
      { label: "IUU zones", description: "GFW risk mapping", capability: "search" },
      { label: "Stock CSV", description: "Survey analysis", capability: "csv" },
    ],
  },
  {
    number: 15,
    name: "TERRA",
    role: "Land and Biodiversity Analyst",
    sdgTitle: "Life on Land",
    accentColor: "#56C02B",
    problem: "1M species at extinction risk (IPBES). ~10% LMIC land has registered tenure.",
    description:
      "Analyses deforestation and biodiversity data, maps tenure gaps, and designs community-based conservation and PES schemes.",
    dataSources: ["Global Forest Watch", "IPBES", "FAO FRA", "Land Matrix", "Hansen/UMD"],
    exampleTasks: [
      "Which Amazon municipalities have highest deforestation acceleration?",
      "Design a PES micropayment scheme for Borneo forest communities",
      "Analyse this land cover change CSV",
    ],
    connectionBadges: ["GFW", "IPBES"],
    systems: [
      { label: "Species at risk", value: "1", unit: "M" },
      { label: "Registered tenure", value: "~10", unit: "% LMIC" },
      { label: "Trees cut", value: "15", unit: "B/yr" },
    ],
    tools: [
      { label: "Forest indicators", description: "GFW deforestation data", capability: "lookup" },
      { label: "Biodiversity search", description: "IPBES assessments", capability: "search" },
      { label: "Land CSV", description: "Cover change analysis", capability: "csv" },
    ],
  },
  {
    number: 16,
    name: "JUSTIS",
    role: "Governance Analyst",
    sdgTitle: "Peace, Justice and Strong Institutions",
    accentColor: "#00689D",
    problem: "$2.6T lost to corruption annually. 89M forcibly displaced (UNHCR 2023), many without financial access.",
    description:
      "Analyses governance and corruption indicators, maps aid-diversion risk corridors, and models transparency and identity-gated transfer reforms.",
    dataSources: ["Transparency International CPI", "World Justice Project", "UNODC", "UNHCR", "V-Dem"],
    exampleTasks: [
      "Which aid corridors have highest diversion risk?",
      "Model identity-gated cash transfer for refugees in Jordan",
      "Analyse this public procurement CSV for anomalies",
    ],
    connectionBadges: ["TI", "V-Dem"],
    systems: [
      { label: "Corruption loss", value: "2.6", unit: "T USD/yr" },
      { label: "Displaced", value: "89", unit: "M" },
      { label: "Aid verify", value: "transparency", unit: "priority" },
    ],
    tools: [
      { label: "CPI data", description: "Corruption perception index", capability: "lookup" },
      { label: "Governance search", description: "WJP rule-of-law studies", capability: "search" },
      { label: "Procurement CSV", description: "Anomaly detection", capability: "csv" },
    ],
  },
  {
    number: 17,
    name: "NEXUS",
    role: "Global Partnership Analyst",
    sdgTitle: "Partnerships for the Goals",
    accentColor: "#19486A",
    problem: "ODA $211B (2022) but only ~15% reaches LDCs directly. Coordination overhead 20–30% of budgets.",
    description:
      "Analyses ODA and aid-effectiveness data, maps coordination gaps, and designs multi-donor pooling and domestic resource mobilisation strategies.",
    dataSources: ["OECD DAC", "UN Comtrade", "World Bank Aid Effectiveness", "IATI"],
    exampleTasks: [
      "Which LDCs receive least ODA relative to need?",
      "Design a multi-donor payment pool for Sahel climate adaptation",
      "Analyse this ODA disbursement CSV for bottlenecks",
    ],
    connectionBadges: ["ODA", "IATI"],
    systems: [
      { label: "ODA total", value: "211", unit: "B USD 2022" },
      { label: "To LDCs", value: "~15", unit: "% direct" },
      { label: "Overhead", value: "20–30", unit: "%" },
    ],
    tools: [
      { label: "ODA indicators", description: "OECD DAC data", capability: "lookup" },
      { label: "Aid search", description: "IATI effectiveness studies", capability: "search" },
      { label: "ODA CSV", description: "Bottleneck analysis", capability: "csv" },
    ],
  },
];
