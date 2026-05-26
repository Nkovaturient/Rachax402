/** Map common SDG data-source labels to preferred site: domains for query boosting. */
const SOURCE_DOMAINS: Record<string, string> = {
  "world bank": "worldbank.org",
  fao: "fao.org",
  fishstat: "fao.org",
  who: "who.int",
  un: "un.org",
  "un women": "data.unwomen.org",
  "un-habitat": "unhabitat.org",
  "un stats": "unstats.un.org",
  oecd: "oecd.org",
  ipcc: "ipcc.ch",
  "global fishing watch": "globalfishingwatch.org",
  gfw: "globalfishingwatch.org",
  noaa: "noaa.gov",
  "global forest watch": "globalforestwatch.org",
  ipbes: "ipbes.net",
  esmap: "esmap.org",
  iea: "iea.org",
  irena: "irena.org",
  wfp: "wfp.org",
  ifpri: "ifpri.org",
  usda: "usda.gov",
  gsma: "gsma.com",
  findex: "worldbank.org",
  dhs: "dhsprogram.com",
  wid: "wid.world",
  "nd-gain": "gain.nd.edu",
  "ocean health": "oceanhealthindex.org",
  "land matrix": "landmatrix.org",
  hansen: "earthengine.google.com",
  umd: "umd.edu",
  sigi: "oecd.org",
};

export function domainsFromDataSources(dataSources: string[]): string[] {
  const seen = new Set<string>();
  for (const src of dataSources) {
    const lower = src.toLowerCase();
    for (const [key, domain] of Object.entries(SOURCE_DOMAINS)) {
      if (lower.includes(key) && !seen.has(domain)) {
        seen.add(domain);
      }
    }
  }
  return [...seen].slice(0, 2);
}

export function boostQuery(query: string, dataSources: string[]): string {
  if (/\bsite:/i.test(query)) return query;
  const domains = domainsFromDataSources(dataSources);
  if (domains.length === 0) return query;
  return `${query} (${domains.map((d) => `site:${d}`).join(" OR ")})`;
}
