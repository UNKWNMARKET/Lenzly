-- Allow 'revoked' as a status on brand_applications (for owner-initiated access removal)
alter table brand_applications drop constraint if exists brand_applications_status_check;

alter table brand_applications
  add constraint brand_applications_status_check
  check (status in ('pending', 'approved', 'rejected', 'revoked'));
