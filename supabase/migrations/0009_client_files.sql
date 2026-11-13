-- Client files: sign-up approval, work-permit cases, and one list of file statuses for every service.
-- Safe to run more than once.

-- 1) A client who signs up on the website is "pending" until the admin approves. Clients added by a consultant's link are approved at once.
alter table people add column if not exists portal_status text check (portal_status in ('pending','approved','rejected'));
alter table people add column if not exists portal_requested_at timestamptz;
alter table people add column if not exists portal_decided_at timestamptz;
update people set portal_status = 'approved' where auth_user_id is not null and portal_status is null;
create index if not exists people_portal_pending on people (portal_status) where portal_status = 'pending';

-- 2) Work permit cases
alter table cases drop constraint if exists cases_service_type_check;
alter table cases add constraint cases_service_type_check check (service_type in ('visit','study','immigration','work'));

-- 3) One status list for every service type. The admin picks from a drop-down; the client sees the label under "Track my file".
-- Existing cases are moved to the nearest new status first (a refused or approved case keeps its result).
update cases set stage = case
  when stage in ('new','assessment','agreement') then 'file_received'
  when stage = 'docs_requested' then 'docs_missing'
  when stage in ('docs_received','documents') then 'docs_scrutinizing'
  when stage = 'review' then 'case_preparation'
  when stage in ('submitted','filed') then 'case_submitted'
  when stage in ('biometrics','in_process') then 'awaiting_embassy'
  when stage in ('decision','closed') then case decision when 'approved' then 'approved' when 'refused' then 'refused' when 'withdrawn' then 'withdrawn' else 'awaiting_embassy' end
  else stage end
where stage in ('new','assessment','agreement','docs_requested','docs_received','documents','review','submitted','filed','biometrics','in_process','decision','closed');

-- keep the stage name of any status the admin added earlier in the new list; replace only the old defaults
delete from case_stage_templates where stage in ('new','assessment','agreement','docs_requested','docs_received','documents','review','submitted','filed','biometrics','in_process','decision','closed');

insert into case_stage_templates (service_type, stage, label_en, label_ur, sort)
select s.t, x.stage, x.en, x.ur, x.sort
from (values ('visit'),('study'),('immigration'),('work')) as s(t)
cross join (values
  ('file_received', 'File received', 'فائل موصول ہو گئی', 1),
  ('docs_scrutinizing', 'Documents being scrutinised', 'دستاویزات کی جانچ پڑتال جاری', 2),
  ('docs_missing', 'Documents missing', 'دستاویزات کم ہیں', 3),
  ('reminder_sent', 'Missing documents reminder sent', 'کم دستاویزات کی یاد دہانی بھیج دی گئی', 4),
  ('missing_received', 'Missing documents received', 'کم دستاویزات موصول ہو گئیں', 5),
  ('case_preparation', 'Case preparation', 'کیس کی تیاری', 6),
  ('case_submission', 'Case submission', 'کیس جمع کرانے کا عمل', 7),
  ('case_submitted', 'Case submitted', 'کیس جمع ہو گیا', 8),
  ('awaiting_embassy', 'Awaiting embassy answer', 'ایمبیسی کے جواب کا انتظار', 9),
  ('approved', 'Case approved', 'کیس منظور ہو گیا', 10),
  ('refused', 'Case refused', 'کیس مسترد ہو گیا', 11),
  ('withdrawn', 'Case withdrawn', 'کیس واپس لے لیا گیا', 12)
) as x(stage, en, ur, sort)
on conflict (service_type, stage) do update set label_en = excluded.label_en, label_ur = excluded.label_ur, sort = excluded.sort;
