-- Visa facts read from official government pages on 2026-11-05 (audit trail: every value has its source URL).
-- Pages not listed here stay empty and show "Being verified — WhatsApp us" because the official page could not be read.
-- Amounts in foreign currency only: no PKR conversions are invented.

update countries set
  embassy_fee_text = $$CAD 100 per person (family of 5 or more applying together: CAD 500 maximum)$$,
  vfs_fee_text = $$Biometrics: CAD 85 per person (family: CAD 170 maximum)$$,
  processing_time_text = $$Varies by country. Check the official IRCC processing-times tool$$,
  max_stay_text = $$Most visitors can stay up to 6 months. The border officer sets your leave date$$,
  biometrics_text = $$Required in most cases, after you apply$$,
  facts_source_url = $$https://ircc.canada.ca/english/information/fees/fees.asp$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'canada-visit-visa-from-pakistan';

update countries set
  embassy_fee_text = $$From NZD 441 (online application)$$,
  processing_time_text = $$80% within 2 weeks$$,
  max_stay_text = $$Up to 6 or 9 months. Maximum 9 months in any 18 months$$,
  facts_source_url = $$https://www.immigration.govt.nz/visas/visitor-visa/$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'new-zealand-visit-visa-from-pakistan';

update countries set
  embassy_fee_text = $$€90 for adults · €45 for children aged 6–12$$,
  vfs_fee_text = $$The visa centre may add its own service fee$$,
  processing_time_text = $$Normally 15 days. Can be extended up to 45 days$$,
  max_stay_text = $$Up to 90 days in any 180-day period$$,
  apply_window_text = $$No earlier than 6 months and at least 15 days before travel$$,
  biometrics_text = $$Fingerprints are taken when you apply$$,
  facts_source_url = $$https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy/applying-schengen-visa_en$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'schengen-visa-from-pakistan';

update countries set
  embassy_fee_text = $$£558 from outside the UK, plus the healthcare surcharge$$,
  processing_time_text = $$Usually 3 weeks from outside the UK$$,
  max_stay_text = $$Degree level: usually up to 5 years. Below degree level: usually up to 2 years (age 18+)$$,
  apply_window_text = $$Earliest: 6 months before your course starts$$,
  facts_source_url = $$https://www.gov.uk/student-visa$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'study-in-uk-from-pakistan';

update countries set
  embassy_fee_text = $$CAD 150 study permit fee$$,
  vfs_fee_text = $$Biometrics: CAD 85 per person (family: CAD 170 maximum)$$,
  processing_time_text = $$Varies by country. Check the official IRCC processing-times tool$$,
  funds_md = coalesce(funds_md, $$For applications on or after 1 September 2026 (outside Quebec): CAD 23,448 per year for one person, not counting tuition and travel. Quebec sets its own amount. Source: IRCC.$$),
  facts_source_url = $$https://ircc.canada.ca/english/information/fees/fees.asp$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'study-in-canada-from-pakistan';

update countries set
  embassy_fee_text = $$€75 national visa (category D), paid in PKR at the current rate, in cash at the counter$$,
  vfs_fee_text = $$Blocked-account signature attestation at the Embassy: €25$$,
  processing_time_text = $$No fixed time. Varies by reason for stay and quality of the application$$,
  funds_md = coalesce(funds_md, $$Blocked account: €992 per month or €11,904 per year, for applications from 1 January 2025. The Embassy may ask for up to two years in some cases. Source: German Embassy Islamabad.$$),
  facts_source_url = $$https://pakistan.diplo.de/pk-en/service/2208622-2208622$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'study-in-germany-from-pakistan';

update countries set
  embassy_fee_text = $$AUD 2,500 base charge for the main applicant, from 1 July 2026$$,
  facts_source_url = $$https://www.legislation.gov.au/F2026L00874/asmade/2026-06-30/es/original/epub/OEBPS/document_1/document_1.html$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'study-in-australia-from-pakistan';

update countries set
  embassy_fee_text = $$S$30 non-refundable processing fee, paid online by card$$,
  processing_time_text = $$Within three working days, not counting the day you submit. Some applications may take longer$$,
  apply_window_text = $$Apply within 30 days before you arrive in Singapore$$,
  facts_source_url = $$https://www.ica.gov.sg/information-and-e-services/entry-and-departure/entering-singapore/visa-guidelines/visa-guideline-detail/pakistan$$,
  facts_last_checked = '2026-11-05', updated_at = now()
where slug = 'singapore-visa-from-pakistan';
