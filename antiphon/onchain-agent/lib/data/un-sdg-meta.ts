/** Cached UN SDG platform stats from https://sdgs.un.org/goals — refresh manually or via script. */

export type UnSdgMeta = {
  goalNumber: number;
  officialTitle: string;
  shortBlurb: string;
  targetCount: number;
  eventCount: number;
  publicationCount: number;
  actionCount: number;
  goalPageUrl: string;
  progressReportUrl: string;
};

const PROGRESS_REPORT_2025 =
  "https://unstats.un.org/sdgs/report/2025/The-Sustainable-Development-Goals-Report-2025.pdf";

export const UN_SDG_META: UnSdgMeta[] = [
  {
    goalNumber: 1,
    officialTitle: "End poverty in all its forms everywhere",
    shortBlurb:
      "Eradicate extreme poverty and ensure equal rights to economic resources, basic services, and resilience for the poor and vulnerable.",
    targetCount: 7,
    eventCount: 155,
    publicationCount: 51,
    actionCount: 1576,
    goalPageUrl: "https://sdgs.un.org/goals/goal1",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 2,
    officialTitle: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture",
    shortBlurb:
      "End hunger, achieve food security and improved nutrition, and promote sustainable agriculture for all.",
    targetCount: 8,
    eventCount: 136,
    publicationCount: 18,
    actionCount: 1486,
    goalPageUrl: "https://sdgs.un.org/goals/goal2",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 3,
    officialTitle: "Ensure healthy lives and promote well-being for all at all ages",
    shortBlurb:
      "Ensure healthy lives and promote well-being for all at every age.",
    targetCount: 13,
    eventCount: 78,
    publicationCount: 50,
    actionCount: 1369,
    goalPageUrl: "https://sdgs.un.org/goals/goal3",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 4,
    officialTitle: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all",
    shortBlurb:
      "Ensure inclusive and equitable quality education and promote lifelong learning.",
    targetCount: 10,
    eventCount: 84,
    publicationCount: 12,
    actionCount: 1972,
    goalPageUrl: "https://sdgs.un.org/goals/goal4",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 5,
    officialTitle: "Achieve gender equality and empower all women and girls",
    shortBlurb:
      "Achieve gender equality and empower all women and girls.",
    targetCount: 9,
    eventCount: 116,
    publicationCount: 49,
    actionCount: 1860,
    goalPageUrl: "https://sdgs.un.org/goals/goal5",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 6,
    officialTitle: "Ensure availability and sustainable management of water and sanitation for all",
    shortBlurb:
      "Ensure availability and sustainable management of water and sanitation for all.",
    targetCount: 8,
    eventCount: 319,
    publicationCount: 38,
    actionCount: 1927,
    goalPageUrl: "https://sdgs.un.org/goals/goal6",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 7,
    officialTitle: "Ensure access to affordable, reliable, sustainable and modern energy for all",
    shortBlurb:
      "Ensure access to affordable, reliable, sustainable and modern energy.",
    targetCount: 5,
    eventCount: 99,
    publicationCount: 47,
    actionCount: 1102,
    goalPageUrl: "https://sdgs.un.org/goals/goal7",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 8,
    officialTitle: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all",
    shortBlurb:
      "Promote inclusive economic growth, employment, and decent work for all.",
    targetCount: 12,
    eventCount: 141,
    publicationCount: 51,
    actionCount: 2143,
    goalPageUrl: "https://sdgs.un.org/goals/goal8",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 9,
    officialTitle: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation",
    shortBlurb:
      "Build resilient infrastructure, promote sustainable industrialization and foster innovation.",
    targetCount: 8,
    eventCount: 140,
    publicationCount: 19,
    actionCount: 1171,
    goalPageUrl: "https://sdgs.un.org/goals/goal9",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 10,
    officialTitle: "Reduce inequality within and among countries",
    shortBlurb:
      "Reduce inequality within and among countries.",
    targetCount: 10,
    eventCount: 110,
    publicationCount: 15,
    actionCount: 1085,
    goalPageUrl: "https://sdgs.un.org/goals/goal10",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 11,
    officialTitle: "Make cities and human settlements inclusive, safe, resilient and sustainable",
    shortBlurb:
      "Make cities and human settlements inclusive, safe, resilient and sustainable.",
    targetCount: 10,
    eventCount: 153,
    publicationCount: 25,
    actionCount: 1339,
    goalPageUrl: "https://sdgs.un.org/goals/goal11",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 12,
    officialTitle: "Ensure sustainable consumption and production patterns",
    shortBlurb:
      "Ensure sustainable consumption and production patterns.",
    targetCount: 11,
    eventCount: 68,
    publicationCount: 19,
    actionCount: 1856,
    goalPageUrl: "https://sdgs.un.org/goals/goal12",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 13,
    officialTitle: "Take urgent action to combat climate change and its impacts",
    shortBlurb:
      "Take urgent action to combat climate change and its impacts.",
    targetCount: 5,
    eventCount: 93,
    publicationCount: 40,
    actionCount: 2445,
    goalPageUrl: "https://sdgs.un.org/goals/goal13",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 14,
    officialTitle: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development",
    shortBlurb:
      "Conserve and sustainably use the oceans, seas and marine resources.",
    targetCount: 10,
    eventCount: 150,
    publicationCount: 44,
    actionCount: 3375,
    goalPageUrl: "https://sdgs.un.org/goals/goal14",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 15,
    officialTitle:
      "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss",
    shortBlurb:
      "Protect terrestrial ecosystems, manage forests, combat desertification, and halt biodiversity loss.",
    targetCount: 12,
    eventCount: 62,
    publicationCount: 35,
    actionCount: 1434,
    goalPageUrl: "https://sdgs.un.org/goals/goal15",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 16,
    officialTitle: "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels",
    shortBlurb:
      "Promote peaceful societies, justice for all, and accountable institutions.",
    targetCount: 12,
    eventCount: 86,
    publicationCount: 15,
    actionCount: 1129,
    goalPageUrl: "https://sdgs.un.org/goals/goal16",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
  {
    goalNumber: 17,
    officialTitle: "Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development",
    shortBlurb:
      "Strengthen implementation means and revitalize the global partnership for sustainable development.",
    targetCount: 19,
    eventCount: 382,
    publicationCount: 85,
    actionCount: 2427,
    goalPageUrl: "https://sdgs.un.org/goals/goal17",
    progressReportUrl: PROGRESS_REPORT_2025,
  },
];

export const UN_SDG_BY_NUMBER = Object.fromEntries(
  UN_SDG_META.map((m) => [m.goalNumber, m]),
) as Record<number, UnSdgMeta>;

export function getUnSdgMeta(goalNumber: number): UnSdgMeta | undefined {
  return UN_SDG_BY_NUMBER[goalNumber];
}
