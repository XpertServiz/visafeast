export type Kind = "visit" | "study" | "immigration";
export type Item = { title: string; detail?: string };

export interface Country {
  /** Set when served: does this page have its text in the visitor's language? Only such pages are offered to Google. */
  translated?: boolean;
  id: string;
  slug: string;
  kind: Kind;
  country_name: string;
  country_code: string;
  flag: string; // ISO 3166-1 alpha-2 lowercase (flag-icons)
  from_code: string;
  to_code: string;
  visa_name: string;
  card_note: string;
  h1: string;
  meta_title: string;
  meta_description: string;
  intro: string;
  embassy_fee_text: string | null;
  embassy_fee_pkr: number | null;
  vfs_fee_text: string | null;
  service_fee_pkr: number | null;
  processing_time_text: string | null;
  max_stay_text: string | null;
  apply_window_text: string | null;
  biometrics_text: string | null;
  facts_source_url: string | null;
  facts_last_checked: string | null; // yyyy-mm-dd
  who_for_md: string[];
  documents: Item[];
  funds_md: string | null;
  steps: Item[];
  refusal_reasons: Item[];
  extra_sections: { heading: string; md: string }[];
  related_slugs: string[];
  keywords: string[];
  pathways: { name: string }[];
  licensed_partner: string | null;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
  content_ur?: Record<string, unknown> | null;
  ur_status?: "none" | "draft" | "approved";
}

export interface Faq { id: string; country_slug: string | null; question: string; answer_md: string; sort_order: number }
export interface Review { id: string; name: string; city: string | null; visa_type: string | null; rating: number; body: string; created_at: string }
export interface NewsItem { id: string; title: string; url: string; source: string; is_official: boolean; published_at: string | null; summary: string | null; country_codes: string[]; what_it_means: string | null }
export interface Post { id: string; slug: string; type: "digest" | "guide" | "blog"; title: string; excerpt: string | null; body_md: string; sources: { title: string; url: string }[]; published_at: string | null }
export interface HeroVideo { id: string; video_id: string; title: string | null; caption: string | null; is_short: boolean; sort_order: number; created_at?: string }

export interface SiteSettings {
  whatsapp_number: string; whatsapp_number_pk: string | null; email: string; facebook_url: string; address_line: string;
  office_hours: string; ntn: string | null; calcom_link: string; service_fee_mode: "exact" | "from" | "quote";
  chatbot_enabled: boolean; llm_provider: "none" | "gemini" | "anthropic"; google_reviews_url: string | null;
  youtube_channel_url: string | null; hero_globe_style: "realistic" | "dotted";
  heading_font: string; body_font: string; urdu_font: string;
  theme: string; accent_color: string; splash_style: string; splash_duration_ms: number; splash_once_per_session: boolean;
}
