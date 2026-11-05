-- Recurring expenses create themselves: the repeating "template" keeps recurring = monthly/yearly,
-- and each automatic copy points back to it (recurring_of) with recurring = 'none'.
alter table expenses add column if not exists recurring_of uuid references expenses;
create index if not exists expenses_recurring_of on expenses (recurring_of);

-- Photo slots chosen in Admin -> Website -> Photos: one active photo per slot.
create unique index if not exists media_slot_unique on media (slot) where slot is not null;
