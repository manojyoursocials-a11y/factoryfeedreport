export type Item = { id: string; text: string };
export type Group = { id: string; label: string; items: Item[] };
export type Section = {
  id: string;
  title: string;
  sub: string;
  items?: Item[];
  groups?: Group[];
  dm?: boolean;
};

export const DM_PAGES = ["Factoryfeed Official", "Factoryfeed India", "Factoryfeed Sourcing"];
export const DM_SLOTS = ["10 AM", "2 PM", "6 PM"];

// Names selectable on the "who's completing this?" gate. Edit this list
// to add/remove people — no other code changes needed.
export const PREPARED_BY_OPTIONS = ["Yuvani", "Manoj", "Social Media Intern"];

// Key used inside dailyState to store which name was picked for the day.
export const PREPARED_BY_KEY = "_preparedBy";

export const DEFAULT_DAILY_TASKS: Section[] = [
  {
    id: "d1",
    title: "App Video — Editor to Live",
    sub: "Cross-check, publish, tag",
    items: [
      { id: "d1i1", text: "Cross-check the final video against the raw files" },
      { id: "d1i2", text: "Upload / post to YouTube" },
      { id: "d1i3", text: "Add entry to the tracking sheet" },
      { id: "d1i4", text: "Upload to the CMS" },
      { id: "d1i5", text: "Add correct keywords (Instagram / Fair, if needed)" },
      { id: "d1i6", text: "Set the thumbnail properly" }
    ]
  },
  {
    id: "d2",
    title: "Script Writing (Per Client)",
    sub: "Gather inputs before writing",
    items: [
      { id: "d2i1", text: "Get all details from Dhayal or Shreeram" },
      { id: "d2i2", text: "Check the updated app videos for the suppliers" },
      { id: "d2i3", text: "Look through already-posted Instagram videos" }
    ]
  },
  {
    id: "d3",
    title: "Instagram Posting",
    sub: "Factoryfeed page + Factoryfeed Sourcing page",
    groups: [
      {
        id: "d3g1",
        label: "Factoryfeed (Official / India)",
        items: [
          { id: "d3g1i1", text: "Confirm the corresponding app video has been posted" },
          { id: "d3g1i2", text: "Instagram posting — set up LinkDM" },
          { id: "d3g1i3", text: "Check the final reel once phone number & details are added" },
          { id: "d3g1i4", text: "Add reel via Edits — trending music + collab with India page & supplier page" },
          { id: "d3g1i5", text: "Watch the reel fully on the India page and accept the collaboration" },
          { id: "d3g1i6", text: "Comment on the reel to check automation is working" }
        ]
      },
      {
        id: "d3g2",
        label: "Factoryfeed Sourcing",
        items: [
          { id: "d3g2i1", text: "Confirm the corresponding app video has been posted" },
          { id: "d3g2i2", text: "Instagram posting — set up Interakt" },
          { id: "d3g2i3", text: "Check the final reel once phone number & details are added" },
          { id: "d3g2i4", text: "Add reel via Edits — trending music + collab with India page & supplier page" },
          { id: "d3g2i5", text: "Watch the reel fully on the India page and accept the collaboration" },
          { id: "d3g2i6", text: "Comment on the reel to check automation is working" }
        ]
      }
    ]
  },
  {
    id: "d4",
    title: "Instagram Story Posts",
    sub: "App link + music",
    items: [
      { id: "d4i1", text: "Add correct app link to the story" },
      { id: "d4i2", text: "Pair the story with music" }
    ]
  },
  {
    id: "d5",
    title: "WhatsApp Communities",
    sub: "Check & manage",
    items: [{ id: "d5i1", text: "Review and manage WhatsApp Communities" }]
  },
  {
    id: "d6",
    title: "Instagram Communities",
    sub: "Check & manage",
    items: [{ id: "d6i1", text: "Review and manage Instagram Communities" }]
  },
  {
    id: "d7",
    title: "YouTube Shorts",
    sub: "Scheduled a day after Instagram",
    items: [{ id: "d7i1", text: "Schedule the YT Short for the day after it went live on Instagram" }]
  },
  {
    id: "d8",
    title: "Instagram DMs",
    sub: "Check every 3-4 hours — Official / India / Sourcing",
    dm: true
  }
];

export const DEFAULT_WEEKLY_TASKS: Section[] = [
  {
    id: "w1",
    title: "Facebook Wholesale Group",
    sub: "Upload & schedule the week's videos",
    items: [
      { id: "w1i1", text: "Upload the week's videos to the Facebook wholesale group" },
      { id: "w1i2", text: "Schedule uploads to run through until next week" }
    ]
  },
  {
    id: "w2",
    title: "Video Extraction Sheet Posting",
    sub: "~32 suppliers to work through",
    items: [
      { id: "w2i1", text: "Select videos from the video extraction sheet" },
      { id: "w2i2", text: "Post selected videos (aim to cover all ~32 suppliers over the week)" }
    ]
  },
  {
    id: "w3",
    title: "Instagram & WhatsApp Community Engagement",
    sub: "Weekly engagement push",
    items: [
      { id: "w3i1", text: 'Post continuous shoot updates as stories (e.g. "Shooting today in Sudama Nagar, Chickpet")' },
      { id: "w3i2", text: "Add polls to gather information from followers" },
      { id: "w3i3", text: "Talk more about the app itself — not just the content" },
      { id: "w3i4", text: 'Prompt viewers to the app for full content (e.g. "Watch the full CMAI Fair videos on the Factoryfeed App")' }
    ]
  }
];

// Every checkable item across a section, flattened to its state key.
export function flattenKeys(section: Section): string[] {
  if (section.dm) {
    const keys: string[] = [];
    DM_PAGES.forEach((_, pi) => DM_SLOTS.forEach((__, si) => keys.push(`dm_${pi}_${si}`)));
    return keys;
  }
  if (section.groups) {
    return section.groups.flatMap((g) => g.items.map((it) => `${g.id}_${it.id}`));
  }
  return (section.items || []).map((it) => it.id);
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function weekKey(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export function genId(): string {
  return "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function sheetNumber(d = new Date()): string {
  const start = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
  return `${d.getFullYear()}-${String(dayOfYear).padStart(3, "0")}`;
}
