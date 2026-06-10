export interface SdgWorkflow {
  primaryIndicators: string[];
  workflowSteps: [string, string, string];
  humanActors: string[];
}

const WORKFLOWS: Record<string, SdgWorkflow> = {
  "sdg-01": {
    primaryIndicators: ["SI_POV_DAY1", "SI_POV_GINI", "BX_TRF_PWKR_DT"],
    workflowSteps: [
      "Lookup FINDEX, remittance, and poverty indicators for target country",
      "Search for recent household survey reports or mobile money adoption studies",
      "Compose action brief identifying financial inclusion gaps and remittance corridor savings",
    ],
    humanActors: ["Central banks", "Mobile money operators", "MFI networks"],
  },
  "sdg-02": {
    primaryIndicators: ["SN_ITK_DEFC", "AG_PRD_FIESS", "AG_LND_FRST"],
    workflowSteps: [
      "Lookup FAOSTAT food price and nutrition indicators for target region",
      "Search for WFP food security assessments or IFPRI policy briefs",
      "Compose action brief with price spread analysis and direct-payment recommendations",
    ],
    humanActors: ["Agriculture ministries", "WFP country offices", "Farmer cooperatives"],
  },
  "sdg-03": {
    primaryIndicators: ["SH_STA_MORT", "SH_TBS_INCD", "SH_XPD_CHEX"],
    workflowSteps: [
      "Lookup WHO GHO health indicators for target country",
      "Search for DHS facility surveys or IHME burden-of-disease studies",
      "Compose action brief with intervention priorities ranked by DALY impact",
    ],
    humanActors: ["Health ministries", "WHO country offices", "CHW networks"],
  },
  "sdg-04": {
    primaryIndicators: ["SE_PRM_CMPT", "SE_ADT_LITR", "SE_TER_ENRR"],
    workflowSteps: [
      "Lookup UNESCO UIS enrollment and completion indicators",
      "Search for PISA/PASEC learning assessment results in target region",
      "Compose action brief identifying access gaps and teacher deployment needs",
    ],
    humanActors: ["Education ministries", "UNESCO field offices", "PTA networks"],
  },
  "sdg-05": {
    primaryIndicators: ["SG_GEN_PARL", "SL_TLF_PART", "SG_LGL_GENEQ"],
    workflowSteps: [
      "Lookup UN Women and SIGI gender equality indicators",
      "Search for DHS gender-disaggregated data or labor participation studies",
      "Compose action brief on gender gaps with micro-grant or policy recommendations",
    ],
    humanActors: ["Gender ministries", "UN Women", "Women's rights NGOs"],
  },
  "sdg-06": {
    primaryIndicators: ["SH_H2O_SAFE", "SH_SAN_SAFE", "ER_H2O_WUE"],
    workflowSteps: [
      "Lookup JMP water and sanitation access indicators for target district",
      "Search for AQUASTAT water resource reports or utility performance studies",
      "Compose action brief mapping service gaps and utility reform options",
    ],
    humanActors: ["Water utilities", "WASH cluster leads", "Municipal governments"],
  },
  "sdg-07": {
    primaryIndicators: ["EG_ELC_ACCS", "EG_FEC_RNEW", "EG_EGY_PRIM"],
    workflowSteps: [
      "Lookup IEA/ESMAP electrification and clean cooking indicators",
      "Search for IRENA renewable potential studies or PAYG market reports",
      "Compose action brief prioritizing off-grid deployment zones",
    ],
    humanActors: ["Energy ministries", "REA agencies", "Mini-grid developers"],
  },
  "sdg-08": {
    primaryIndicators: ["SL_EMP_VULN", "SL_TLF_TOTL", "SL_UEM_TOTL"],
    workflowSteps: [
      "Lookup ILOSTAT employment and informal sector indicators",
      "Search for IFC MSME finance gap reports or gig economy studies",
      "Compose action brief on decent-work deficits and payment-system reforms",
    ],
    humanActors: ["Labour ministries", "ILO country offices", "Trade unions"],
  },
  "sdg-09": {
    primaryIndicators: ["NV_IND_MANF", "IT_NET_BBND", "TX_VAL_TECH"],
    workflowSteps: [
      "Lookup IFC and AfDB infrastructure finance indicators",
      "Search for manufacturing sector or cross-border trade corridor studies",
      "Compose action brief identifying SME financing gaps and logistics bottlenecks",
    ],
    humanActors: ["Trade ministries", "AfDB country offices", "SME associations"],
  },
  "sdg-10": {
    primaryIndicators: ["SI_POV_GINI", "BX_TRF_PWKR", "SM_POP_REFG"],
    workflowSteps: [
      "Lookup WID inequality and World Bank remittance cost indicators",
      "Search for recent Gini trend analysis or migration corridor studies",
      "Compose action brief on inequality drivers and remittance-fee reduction options",
    ],
    humanActors: ["Finance ministries", "Diaspora organizations", "Consumer protection agencies"],
  },
  "sdg-11": {
    primaryIndicators: ["EN_URB_SLUM", "SP_URB_TOTL", "EN_URB_CTY"],
    workflowSteps: [
      "Lookup UN-Habitat slum population and urban service indicators",
      "Search for city-level property tax or transit access studies",
      "Compose action brief on slum upgrading and municipal revenue reform",
    ],
    humanActors: ["City governments", "UN-Habitat", "Community-based organizations"],
  },
  "sdg-12": {
    primaryIndicators: ["EN_MAT_DOMC", "EN_FOOD_WST", "EN_ATM_WASTE"],
    workflowSteps: [
      "Lookup UNEP material footprint and waste generation indicators",
      "Search for circular economy case studies or recycling value-chain reports",
      "Compose action brief with per-kg recycling incentive design",
    ],
    humanActors: ["Environment ministries", "Waste management authorities", "Producer organizations"],
  },
  "sdg-13": {
    primaryIndicators: ["EN_ATM_CO2E", "EN_CLIM_VUL", "EN_ATM_GHG"],
    workflowSteps: [
      "Lookup ND-GAIN vulnerability and readiness indicators for target country",
      "Search for IPCC regional impact projections or carbon market analyses",
      "Compose action brief mapping adaptation finance gaps and emissions hotspots",
    ],
    humanActors: ["Environment ministries", "NDCs focal points", "Climate funds"],
  },
  "sdg-14": {
    primaryIndicators: ["EN_MAR_FISH", "EN_MAR_MPA", "ER_FSH_IUU"],
    workflowSteps: [
      "Lookup FAO FishStat catch and stock status indicators",
      "Search for Global Fishing Watch IUU risk reports or small-scale fisher studies",
      "Compose action brief on sustainable catch limits and direct-to-market access",
    ],
    humanActors: ["Fisheries ministries", "RFMOs", "Fishing cooperatives"],
  },
  "sdg-15": {
    primaryIndicators: ["AG_LND_FRST", "EN_BIO_SPEC", "ER_LND_DEGR"],
    workflowSteps: [
      "Lookup Global Forest Watch deforestation and land-cover indicators",
      "Search for IPBES biodiversity assessments or PES program evaluations",
      "Compose action brief on tenure reform and community-based conservation",
    ],
    humanActors: ["Forestry authorities", "IPLC networks", "Conservation NGOs"],
  },
  "sdg-16": {
    primaryIndicators: ["VC_IHR_PSRC", "CC_PRC_CPI", "SG_DMK_GOV"],
    workflowSteps: [
      "Lookup CPI and WJP rule-of-law indicators for target country",
      "Search for V-Dem governance reports or UNODC corruption studies",
      "Compose action brief identifying aid-diversion risks and transparency reforms",
    ],
    humanActors: ["Anti-corruption commissions", "CSO watchdogs", "Donor coordination groups"],
  },
  "sdg-17": {
    primaryIndicators: ["DC_ODA_TOTL", "DC_TAX_TOTL", "DC_INF_DEBT"],
    workflowSteps: [
      "Lookup OECD DAC ODA disbursement and IATI transparency indicators",
      "Search for aid-effectiveness studies or domestic resource mobilization reports",
      "Compose action brief with multi-donor coordination and pooled-funding recommendations",
    ],
    humanActors: ["Aid coordination units", "OECD DAC", "Finance ministries"],
  },
};

export function getSdgWorkflow(slug: string): SdgWorkflow | undefined {
  return WORKFLOWS[slug];
}

export const SHARED_WORKFLOW_TEMPLATE = [
  "lookup_official_indicator",
  "search_verified_evidence",
  "parse_uploaded_file (if a file is attached)",
  "compose_action_brief",
] as const;
