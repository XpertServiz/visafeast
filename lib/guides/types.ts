// Country guide content. Every statement here was read on an official government page (its address is in `sources`) on the date in `checked`.
// Rule (CLAUDE.md): never invent facts. Anything not on an official page stays out, and the page shows ONE "being verified" note instead.

export interface Source { label: string; url: string }

/** A visa type, route or programme: a name, one or two plain sentences, and the official page. */
export interface Option { name: string; summary: string; status?: string; url?: string }

export interface GuideFacts {
  embassy_fee_text?: string; vfs_fee_text?: string; processing_time_text?: string;
  max_stay_text?: string; apply_window_text?: string; biometrics_text?: string;
}

export interface GuideContent {
  /** Which set of destination photos to show (key of DEST in lib/destination-photos.ts). */
  photos: string;
  overview: string;
  /** Filled only where the database has no value of its own. */
  facts?: GuideFacts;
  options?: Option[];
  who_for?: string[];
  documents?: { title: string; detail?: string }[];
  funds?: string;
  extra?: { heading: string; md: string }[];
  sources: Source[];
  /** yyyy-mm-dd: the day the official pages were read. */
  checked: string;
}

export interface ImmigrationGuide extends GuideContent {
  slug: string; name: string; code: string; flag: string; to: string;
  h1: string; metaTitle: string; metaDescription: string; intro: string;
  options: Option[];
}
