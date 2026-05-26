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
      "Maps financial inclusion gaps, models x402 remittance corridors, and stores household survey CSVs on Storacha with on-chain reputation for verified outcomes.",
    dataSources: ["World Bank FINDEX", "UN Poverty stats", "GSMA Mobile Money", "World Bank Remittance Prices DB"],
    exampleTasks: [
      "Compare mobile money penetration in Kenya vs Nigeria",
      "Estimate savings if remittance fees drop to 1% for El Salvador",
      "Analyse this household income CSV for poverty clustering",
    ],
    connectionBadges: ["x402", "FINDEX"],
    systems: [
      { label: "Unbanked adults", value: "1.4", unit: "B", trend: "FINDEX 2022" },
      { label: "Avg remittance fee", value: "6.2", unit: "%", trend: "WB 2023" },
      { label: "Fee drain", value: "48", unit: "B USD/yr" },
    ],
    tools: [
      { label: "Inclusion map", description: "FINDEX gap analysis by country", capability: "web_search + CSV" },
      { label: "x402 corridor", description: "Micropayment remittance simulation", capability: "x402" },
      { label: "Evidence store", description: "Survey CSV on IPFS", capability: "Storacha" },
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
      "Traces agri price spreads, routes direct farmer x402 payments, and discovers cold-chain services via ERC-8004 with IPFS audit trails.",
    dataSources: ["FAO FAOSTAT", "WFP VAM", "IFPRI", "USDA PSD"],
    exampleTasks: [
      "Show maize price spread from farm to market in Ethiopia",
      "Which districts in Bangladesh have worst food access scores?",
      "Analyse this crop yield CSV for seasonal patterns",
    ],
    connectionBadges: ["Storacha", "FAO"],
    systems: [
      { label: "Chronic hunger", value: "733", unit: "M", trend: "FAO 2023" },
      { label: "Post-harvest loss", value: "30–40", unit: "% SSA" },
      { label: "Middleman margin", value: "40–60", unit: "%" },
    ],
    tools: [
      { label: "Price spread", description: "Farm-to-market differential", capability: "web_search" },
      { label: "Direct pay", description: "Farmer x402 disbursement", capability: "x402" },
      { label: "Yield CSV", description: "Seasonal pattern analysis", capability: "stageCsv" },
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
      "Routes x402 payments to community health workers, analyses health outcome CSVs, and discovers verified medical suppliers via ERC-8004.",
    dataSources: ["WHO GHO", "IHME GBD", "UNICEF MICS", "DHS Program"],
    exampleTasks: [
      "Map maternal mortality hotspots in West Africa",
      "Which interventions have highest DALY reduction per $1000?",
      "Analyse this clinic utilisation CSV",
    ],
    connectionBadges: ["IPFS", "WHO"],
    systems: [
      { label: "Without services", value: "4.5", unit: "B" },
      { label: "CHW attrition", value: "30–40", unit: "%" },
      { label: "DALY focus", value: "LMIC", unit: "priority" },
    ],
    tools: [
      { label: "CHW pay", description: "x402 salary routing", capability: "x402" },
      { label: "Outcome CSV", description: "Facility utilisation analysis", capability: "stageCsv" },
      { label: "Supplier discover", description: "ERC-8004 medical services", capability: "discoverService" },
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
      "Issues credential proofs on ERC-8004, routes teacher salary micropayments via x402, and analyses PISA/SACMEQ learning gaps.",
    dataSources: ["UNESCO UIS", "World Bank EdStats", "PISA", "PASEC", "SACMEQ"],
    exampleTasks: [
      "Compare primary completion rates across SADC countries",
      "Estimate cost of closing teacher salary arrears in rural India",
      "Analyse this school enrolment CSV",
    ],
    connectionBadges: ["ERC-8004", "UNESCO"],
    systems: [
      { label: "Out of school", value: "244", unit: "M" },
      { label: "Teacher absence", value: "19", unit: "% SSA" },
      { label: "Salary arrears", value: "3–6", unit: "mo" },
    ],
    tools: [
      { label: "Credentials", description: "On-chain academic proofs", capability: "ERC-8004" },
      { label: "Teacher pay", description: "Remote x402 salaries", capability: "x402" },
      { label: "Enrolment CSV", description: "Regional gap analysis", capability: "stageCsv" },
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
      "Analyses gender economic data, enables anonymous x402 micro-grants, and stores gender survey evidence on Storacha.",
    dataSources: ["UN Women Data Hub", "World Bank Gender Portal", "OECD SIGI", "DHS Program"],
    exampleTasks: [
      "Which 5 countries have largest gender pay gap in agriculture?",
      "Model micro-loan access if collateral requirements removed",
      "Analyse this women's economic participation survey CSV",
    ],
    connectionBadges: ["x402", "UN Women"],
    systems: [
      { label: "Women land ownership", value: "<20", unit: "%" },
      { label: "SME rejection gap", value: "30", unit: "% higher" },
      { label: "Survey evidence", value: "IPFS", unit: "stored" },
    ],
    tools: [
      { label: "Wage gap", description: "Cross-country comparison", capability: "web_search" },
      { label: "Micro-grant", description: "Anonymous x402 disbursement", capability: "x402" },
      { label: "Survey store", description: "Privacy-preserving IPFS", capability: "Storacha" },
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
      "Ingests water-quality sensor CSVs, models community utility pooling via x402, and discovers WASH providers on ERC-8004.",
    dataSources: ["WHO/UNICEF JMP", "AQUASTAT", "World Bank Water Data", "IRC WASH"],
    exampleTasks: [
      "Identify districts in Kenya with worst safe water access",
      "Model revenue recovery with mobile payments vs cash billing",
      "Analyse this water quality CSV for contamination patterns",
    ],
    connectionBadges: ["IoT+IPFS", "JMP"],
    systems: [
      { label: "Without safe water", value: "2", unit: "B" },
      { label: "Utility collection", value: "20–40", unit: "%" },
      { label: "Sensor audits", value: "IPFS", unit: "trail" },
    ],
    tools: [
      { label: "Quality CSV", description: "Contamination pattern analysis", capability: "stageCsv" },
      { label: "Utility pool", description: "x402 billing model", capability: "x402" },
      { label: "WASH discover", description: "ERC-8004 providers", capability: "discoverService" },
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
      "Models PAYG-to-x402 per-kWh billing, prioritises electrification gaps via ESMAP data, and stores consumption proofs on IPFS.",
    dataSources: ["IEA WEO", "ESMAP", "SE4All", "IRENA"],
    exampleTasks: [
      "Which SSA countries have highest solar potential and lowest electrification?",
      "Estimate emissions reduction if 1M households switch from kerosene",
      "Analyse this PAYG solar repayment CSV",
    ],
    connectionBadges: ["PAYG", "IEA"],
    systems: [
      { label: "Without electricity", value: "675", unit: "M" },
      { label: "PAYG failure", value: "35–50", unit: "%" },
      { label: "kWh billing", value: "x402", unit: "ready" },
    ],
    tools: [
      { label: "Access map", description: "ESMAP gap prioritisation", capability: "web_search" },
      { label: "PAYG x402", description: "Per-kWh micropayments", capability: "x402" },
      { label: "Repayment CSV", description: "Collection analysis", capability: "stageCsv" },
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
      "Verifies worker reputation on ERC-8004, enables instant gig x402 payouts, and analyses ILO labour deficit data.",
    dataSources: ["ILO ILOSTAT", "World Bank Jobs", "IFC MSME Finance Gap"],
    exampleTasks: [
      "Which sectors in Southeast Asia have highest informal employment?",
      "Model impact of same-day payment on gig worker retention",
      "Analyse this labour force survey CSV",
    ],
    connectionBadges: ["ERC-8004", "ILO"],
    systems: [
      { label: "Jobs gap", value: "473", unit: "M" },
      { label: "Informal workers", value: "2", unit: "B" },
      { label: "Payment delay", value: "30–90", unit: "days" },
    ],
    tools: [
      { label: "Reputation", description: "On-chain work history", capability: "ERC-8004" },
      { label: "Instant pay", description: "Gig x402 settlement", capability: "x402" },
      { label: "Labour CSV", description: "Sector deficit analysis", capability: "stageCsv" },
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
      "Discovers SME and logistics services via ERC-8004, routes cross-border x402 payments, and stores supply-chain digitisation on IPFS.",
    dataSources: ["IFC SME Finance", "AfDB", "World Bank Infrastructure", "OECD FDI"],
    exampleTasks: [
      "Map SME financing gap by sector in West Africa",
      "Which East Africa infrastructure projects have highest multiplier?",
      "Analyse this manufacturing export CSV",
    ],
    connectionBadges: ["SME", "AfDB"],
    systems: [
      { label: "SME gap", value: "5.2", unit: "T USD" },
      { label: "Infra deficit", value: "68–108", unit: "B/yr Africa" },
      { label: "Cross-border", value: "x402", unit: "FX cut" },
    ],
    tools: [
      { label: "SME discover", description: "ERC-8004 service match", capability: "discoverService" },
      { label: "SME pay", description: "Cross-border x402", capability: "x402" },
      { label: "Export CSV", description: "Manufacturing analysis", capability: "stageCsv" },
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
      "Analyses Gini and remittance data, models x402 corridor savings vs traditional operators, and stores inequality surveys on IPFS.",
    dataSources: ["World Inequality Database", "World Bank PovcalNet", "OECD Income Distribution", "IMF"],
    exampleTasks: [
      "Which 10 countries saw largest Gini increase 2015–2023?",
      "Model household impact of cutting remittance fees by 4%",
      "Analyse this wealth distribution CSV",
    ],
    connectionBadges: ["WID", "remittance"],
    systems: [
      { label: "Top 1% wealth", value: "43", unit: "%" },
      { label: "Remittances", value: "831", unit: "B USD" },
      { label: "Fee drain", value: "50", unit: "B USD" },
    ],
    tools: [
      { label: "Gini track", description: "WID country trends", capability: "web_search" },
      { label: "Fee model", description: "x402 vs legacy remittance", capability: "x402" },
      { label: "Wealth CSV", description: "Distribution analysis", capability: "stageCsv" },
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
      "Analyses urban service data, models community fund collection via x402, and discovers waste/transit providers on ERC-8004.",
    dataSources: ["UN-Habitat Urban Data", "World Bank City Indicators", "GHSL", "OpenStreetMap"],
    exampleTasks: [
      "Rank African cities by slum population growth rate",
      "Model property tax recovery with mobile payment",
      "Analyse this urban service delivery CSV",
    ],
    connectionBadges: ["UN-Habitat", "x402"],
    systems: [
      { label: "Urban slum pop", value: "1", unit: "B" },
      { label: "Tax collection", value: "40–60", unit: "%" },
      { label: "Urban 2050", value: "68", unit: "% world" },
    ],
    tools: [
      { label: "Slum rank", description: "UN-Habitat growth rates", capability: "web_search" },
      { label: "Mobile tax", description: "x402 collection model", capability: "x402" },
      { label: "Service CSV", description: "Delivery gap analysis", capability: "stageCsv" },
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
      "Tracks supply chain provenance on IPFS, models recycling incentive x402 per kg, and discovers circular service providers.",
    dataSources: ["UNEP", "FAO Food Loss & Waste", "Global Waste Index", "Ellen MacArthur Foundation"],
    exampleTasks: [
      "Which industries have highest material efficiency gap in South Asia?",
      "Design a plastic recycling micropayment scheme for Lagos",
      "Analyse this waste audit CSV",
    ],
    connectionBadges: ["Storacha", "UNEP"],
    systems: [
      { label: "Municipal waste", value: "2.24", unit: "B t/yr" },
      { label: "Recycled", value: "13.5", unit: "%" },
      { label: "Textile waste", value: "92", unit: "M t/yr" },
    ],
    tools: [
      { label: "Provenance", description: "IPFS chain of custody", capability: "Storacha" },
      { label: "Recycle pay", description: "x402 per-kg incentive", capability: "x402" },
      { label: "Waste CSV", description: "Audit analysis", capability: "stageCsv" },
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
      "Analyses ND-GAIN and IPCC risk data, verifies offsets with IPFS evidence on ERC-8004, routes climate finance via x402.",
    dataSources: ["IPCC", "ND-GAIN", "Global Carbon Project", "World Bank Climate Portal"],
    exampleTasks: [
      "Which LDCs are most climate-exposed with least adaptation finance?",
      "Verify this REDD+ credit with deforestation data",
      "Analyse this emissions CSV for scope 3 hotspots",
    ],
    connectionBadges: ["IPCC", "carbon"],
    systems: [
      { label: "Climate vulnerable", value: "3.3–3.6", unit: "B" },
      { label: "Carbon market", value: "50–100", unit: "B/yr need" },
      { label: "ND-GAIN", value: "country", unit: "index" },
    ],
    tools: [
      { label: "Risk map", description: "ND-GAIN + IPCC overlay", capability: "web_search" },
      { label: "Offset verify", description: "IPFS + ERC-8004 proof", capability: "postReputation" },
      { label: "Emissions CSV", description: "Scope 3 hotspots", capability: "stageCsv" },
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
      "Stores vessel/catch evidence on IPFS, routes direct fisher x402 payments, and analyses fish stock and ocean health data.",
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
      { label: "IUU zones", description: "GFW risk mapping", capability: "web_search" },
      { label: "Direct pay", description: "Fisher x402 settlement", capability: "x402" },
      { label: "Stock CSV", description: "Survey analysis", capability: "stageCsv" },
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
      "Registers tenure on ERC-8004, stores deforestation satellite evidence on IPFS, routes PES payments via x402.",
    dataSources: ["Global Forest Watch", "IPBES", "FAO FRA", "Land Matrix", "Hansen/UMD"],
    exampleTasks: [
      "Which Amazon municipalities have highest deforestation acceleration?",
      "Design a PES micropayment scheme for Borneo forest communities",
      "Analyse this land cover change CSV",
    ],
    connectionBadges: ["GFW", "PES"],
    systems: [
      { label: "Species at risk", value: "1", unit: "M" },
      { label: "Registered tenure", value: "~10", unit: "% LMIC" },
      { label: "Trees cut", value: "15", unit: "B/yr" },
    ],
    tools: [
      { label: "Tenure", description: "ERC-8004 land registry", capability: "ERC-8004" },
      { label: "Deforestation", description: "IPFS satellite evidence", capability: "Storacha" },
      { label: "PES pay", description: "Community x402", capability: "x402" },
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
      "Issues pseudonymous ERC-8004 identity for aid, routes x402 disbursements, stores procurement audits on IPFS.",
    dataSources: ["Transparency International CPI", "World Justice Project", "UNODC", "UNHCR", "V-Dem"],
    exampleTasks: [
      "Which aid corridors have highest diversion risk?",
      "Model identity-gated cash transfer for refugees in Jordan",
      "Analyse this public procurement CSV for anomalies",
    ],
    connectionBadges: ["ERC-8004 ID", "TI"],
    systems: [
      { label: "Corruption loss", value: "2.6", unit: "T USD/yr" },
      { label: "Displaced", value: "89", unit: "M" },
      { label: "Aid verify", value: "x402", unit: "gated" },
    ],
    tools: [
      { label: "Digital ID", description: "ERC-8004 pseudonymous", capability: "ERC-8004" },
      { label: "Aid route", description: "x402 disbursement", capability: "x402" },
      { label: "Procurement CSV", description: "Anomaly detection", capability: "stageCsv" },
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
      "Matches partners via ERC-8004, routes multi-party x402 aid pools, stores partnership outcomes on IPFS.",
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
      { label: "Partner match", description: "ERC-8004 discovery", capability: "discoverService" },
      { label: "Split pay", description: "Multi-donor x402 pool", capability: "x402" },
      { label: "ODA CSV", description: "Bottleneck analysis", capability: "stageCsv" },
    ],
  },
];
