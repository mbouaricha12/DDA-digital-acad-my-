-- DDA AutoTrader entitlement v1: constrain server-written membership snapshots to known rights.
-- Review and apply in staging only; never run this migration automatically from the BFF.
alter table public.dda_billing_memberships
  add constraint dda_billing_memberships_entitlement_snapshot_allowed
  check (
    jsonb_typeof(entitlement_snapshot) = 'array'
    and entitlement_snapshot <@ '["premium_track", "resources_premium", "certificate_preview", "advanced_modules", "autotrader.analysis"]'::jsonb
  ) not valid;

alter table public.dda_billing_memberships
  validate constraint dda_billing_memberships_entitlement_snapshot_allowed;
