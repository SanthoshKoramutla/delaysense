-- DelaySense portfolio sample.
-- Every supplier and tracking number is labeled SAMPLE.
-- Risk is the three rules, scored as of today:
--   expected date already past        -> High
--   carrier name contains "freight"   -> High
--   last update older than 2 days     -> Medium
--   otherwise                         -> Low
-- High and Medium count as a predicted delay. High alone counts as at risk.

begin;

create schema if not exists sample;
create schema if not exists mart;

comment on schema sample is
  'Labeled sample rows for the DelaySense portfolio. Not a live operation.';

drop view if exists mart.delaysense_summary;
drop view if exists mart.delaysense_trend;
drop view if exists mart.delaysense_suppliers;
drop view if exists mart.shipments_dashboard;
drop view if exists mart.alerts_public;
drop view if exists mart.report_delay_trend_monthly;
drop view if exists mart.report_supplier_performance;
drop view if exists mart.report_risky_routes;
drop view if exists mart.report_delay_prediction;
drop view if exists sample.scored;

drop table if exists sample.shipments;
drop table if exists sample.suppliers;

create table sample.suppliers (
  supplier_id uuid primary key default gen_random_uuid(),
  supplier_name text not null unique,
  is_sample boolean not null default true
);

create table sample.shipments (
  shipment_id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references sample.suppliers (supplier_id),
  tracking_number text not null unique,
  carrier_code text not null,
  origin text not null,
  destination text not null,
  status text not null check (
    status in ('label_created', 'in_transit', 'out_for_delivery', 'delivered')
  ),
  expected_date date not null,
  shipped_date date not null,
  status_updated timestamptz not null,
  delivered_at timestamptz,
  is_sample boolean not null default true
);

insert into sample.suppliers (supplier_name) values
  ('SAMPLE Northwind Components'),
  ('SAMPLE Harborline Parts'),
  ('SAMPLE Kite & Loom Supply');

insert into sample.shipments (
  supplier_id, tracking_number, carrier_code, origin, destination,
  status, expected_date, shipped_date, status_updated, delivered_at
)
select
  s.supplier_id,
  v.tracking_number,
  v.carrier_code,
  v.origin,
  v.destination,
  v.status,
  v.expected_date,
  v.shipped_date,
  v.status_updated,
  v.delivered_at
from (
  values
    -- Recent window. These dates fall inside the dashboard default of the last month.
    ('SAMPLE Northwind Components', 'SAMPLE-1001', 'DHL', 'Shenzhen', 'Mumbai', 'in_transit', current_date - 3, current_date - 12, now(), null::timestamptz),
    ('SAMPLE Northwind Components', 'SAMPLE-1002', 'DHL', 'Shenzhen', 'Mumbai', 'in_transit', current_date - 1, current_date - 8, now(), null),
    ('SAMPLE Northwind Components', 'SAMPLE-1003', 'SAMPLE Freight', 'Hamburg', 'Chennai', 'in_transit', current_date + 9, current_date - 6, now(), null),
    ('SAMPLE Northwind Components', 'SAMPLE-1004', 'BlueDart', 'Singapore', 'Bengaluru', 'in_transit', current_date + 14, current_date - 5, now() - interval '5 days', null),
    ('SAMPLE Northwind Components', 'SAMPLE-1005', 'DHL', 'Shenzhen', 'Mumbai', 'out_for_delivery', current_date + 4, current_date - 3, now(), null),
    ('SAMPLE Northwind Components', 'SAMPLE-1006', 'DHL', 'Shenzhen', 'Mumbai', 'delivered', current_date + 2, current_date - 7, now(), now() - interval '1 day'),
    ('SAMPLE Northwind Components', 'SAMPLE-1007', 'DHL', 'Busan', 'Nhava Sheva', 'label_created', current_date + 20, current_date - 1, now(), null),

    ('SAMPLE Harborline Parts', 'SAMPLE-2001', 'DHL', 'Hamburg', 'Chennai', 'in_transit', current_date - 6, current_date - 15, now(), null),
    ('SAMPLE Harborline Parts', 'SAMPLE-2002', 'SAMPLE Freight', 'Singapore', 'Bengaluru', 'out_for_delivery', current_date + 6, current_date - 4, now(), null),
    ('SAMPLE Harborline Parts', 'SAMPLE-2003', 'BlueDart', 'Shenzhen', 'Mumbai', 'in_transit', current_date + 11, current_date - 9, now() - interval '4 days', null),
    ('SAMPLE Harborline Parts', 'SAMPLE-2004', 'DHL', 'Hamburg', 'Chennai', 'delivered', current_date + 5, current_date - 10, now() - interval '1 day', now() - interval '2 days'),
    ('SAMPLE Harborline Parts', 'SAMPLE-2005', 'DHL', 'Busan', 'Nhava Sheva', 'in_transit', current_date + 16, current_date - 2, now(), null),
    ('SAMPLE Harborline Parts', 'SAMPLE-2006', 'DHL', 'Shenzhen', 'Mumbai', 'label_created', current_date + 18, current_date, now(), null),

    ('SAMPLE Kite & Loom Supply', 'SAMPLE-3001', 'BlueDart', 'Singapore', 'Bengaluru', 'in_transit', current_date - 2, current_date - 11, now(), null),
    ('SAMPLE Kite & Loom Supply', 'SAMPLE-3002', 'SAMPLE Freight', 'Busan', 'Nhava Sheva', 'in_transit', current_date + 7, current_date - 5, now(), null),
    ('SAMPLE Kite & Loom Supply', 'SAMPLE-3003', 'DHL', 'Hamburg', 'Chennai', 'in_transit', current_date + 13, current_date - 8, now() - interval '6 days', null),
    ('SAMPLE Kite & Loom Supply', 'SAMPLE-3004', 'DHL', 'Shenzhen', 'Mumbai', 'delivered', current_date + 3, current_date - 9, now(), now() - interval '1 day'),
    ('SAMPLE Kite & Loom Supply', 'SAMPLE-3005', 'BlueDart', 'Hamburg', 'Chennai', 'out_for_delivery', current_date + 5, current_date - 4, now(), null),

    -- Older months, so the monthly report is not a single bar.
    -- Expected dates still in the future stay Low unless another rule fires.
    ('SAMPLE Northwind Components', 'SAMPLE-1101', 'DHL', 'Shenzhen', 'Mumbai', 'in_transit', current_date + 25, current_date - 40, now(), null),
    ('SAMPLE Harborline Parts', 'SAMPLE-2101', 'SAMPLE Freight', 'Hamburg', 'Chennai', 'in_transit', current_date + 30, current_date - 45, now() - interval '50 days', null),
    ('SAMPLE Kite & Loom Supply', 'SAMPLE-3101', 'DHL', 'Singapore', 'Bengaluru', 'in_transit', current_date - 20, current_date - 50, now() - interval '40 days', null),
    ('SAMPLE Northwind Components', 'SAMPLE-1201', 'DHL', 'Busan', 'Nhava Sheva', 'delivered', current_date + 40, current_date - 75, now(), now() - interval '60 days'),
    ('SAMPLE Harborline Parts', 'SAMPLE-2201', 'BlueDart', 'Shenzhen', 'Mumbai', 'in_transit', current_date - 30, current_date - 80, now() - interval '70 days', null)
) as v (
  supplier_name, tracking_number, carrier_code, origin, destination,
  status, expected_date, shipped_date, status_updated, delivered_at
)
join sample.suppliers s on s.supplier_name = v.supplier_name;

create view sample.scored as
select
  sh.shipment_id,
  sh.supplier_id,
  su.supplier_name,
  sh.tracking_number,
  sh.carrier_code,
  sh.origin,
  sh.destination,
  sh.status,
  sh.expected_date,
  sh.shipped_date,
  sh.status_updated,
  sh.delivered_at,
  sh.is_sample,
  case
    when sh.expected_date < current_date then 'High'
    when sh.carrier_code ilike '%freight%' then 'High'
    when sh.status_updated < now() - interval '2 days' then 'Medium'
    else 'Low'
  end as risk_level,
  case
    when sh.delivered_at is not null then (sh.delivered_at::date - sh.shipped_date)
    else (current_date - sh.shipped_date)
  end as lead_time_days
from sample.shipments sh
join sample.suppliers su on su.supplier_id = sh.supplier_id;

comment on view sample.scored is
  'Sample shipments with the three delay rules applied as of today.';

create view mart.delaysense_summary as
select
  count(*)::int as total_shipments,
  count(*) filter (where risk_level in ('High', 'Medium'))::int as predicted_delays,
  round(
    100.0 * count(*) filter (where risk_level in ('High', 'Medium')) / nullif(count(*), 0),
    2
  ) as pct_delayed,
  round(avg(lead_time_days), 2) as avg_lead_time_days,
  count(*) filter (where status = 'in_transit')::int as shipments_in_transit,
  count(*) filter (where status = 'delivered')::int as shipments_delivered,
  count(*) filter (where status = 'out_for_delivery')::int as shipments_out_for_delivery,
  count(*) filter (where status = 'label_created')::int as shipments_lables_created
from sample.scored;

create view mart.delaysense_trend as
select
  shipped_date as shipment_day,
  count(*)::int as total_shipments,
  count(*) filter (where risk_level in ('High', 'Medium'))::int as predicted_delays,
  round(
    100.0 * count(*) filter (where risk_level in ('High', 'Medium')) / nullif(count(*), 0),
    2
  ) as pct_delayed,
  round(avg(lead_time_days), 2) as avg_lead_time_days
from sample.scored
group by shipped_date;

create view mart.delaysense_suppliers as
select
  supplier_name,
  count(*)::int as total_shipments,
  count(*) filter (where risk_level in ('High', 'Medium'))::int as delayed_shipments,
  round(
    100.0 * count(*) filter (where risk_level in ('High', 'Medium')) / nullif(count(*), 0),
    2
  ) as delay_rate_pct,
  round(avg(lead_time_days), 2) as avg_lead_time_days
from sample.scored
group by supplier_name;

create view mart.shipments_dashboard as
select
  supplier_name,
  expected_date,
  risk_level in ('High', 'Medium') as delay_predicted,
  tracking_number,
  origin,
  destination,
  status,
  risk_level
from sample.scored;

create view mart.alerts_public as
select
  shipment_id as alert_id,
  case
    when risk_level = 'High' then 'DELAY_PREDICTED'
    else 'DELAY_WARNING'
  end as alert_type,
  case
    when risk_level = 'High' then 'CRITICAL'
    else 'WARNING'
  end as severity,
  case
    when expected_date < current_date then 'Sample alert: expected date is already past.'
    when carrier_code ilike '%freight%' then 'Sample alert: carrier name contains freight.'
    else 'Sample alert: last update is older than 2 days.'
  end as message,
  status_updated as triggered_at,
  false as acknowledged,
  supplier_name,
  origin,
  destination,
  tracking_number,
  expected_date as eta
from sample.scored
where risk_level in ('High', 'Medium');

create view mart.report_delay_trend_monthly as
select
  date_trunc('month', shipped_date)::date as month_start,
  count(*)::int as total_shipments,
  count(*) filter (where risk_level in ('High', 'Medium'))::int as predicted_delays,
  count(*) filter (where risk_level = 'High')::int as at_risk,
  round(avg(lead_time_days), 2) as avg_lead_time_days,
  round(
    100.0 * count(*) filter (where risk_level in ('High', 'Medium')) / nullif(count(*), 0),
    2
  ) as delay_rate_pct
from sample.scored
group by date_trunc('month', shipped_date);

create view mart.report_supplier_performance as
select
  supplier_name,
  supplier_id,
  count(*)::int as total_shipments,
  count(*) filter (where risk_level in ('High', 'Medium'))::int as delayed_shipments,
  round(
    100.0 * count(*) filter (where risk_level in ('High', 'Medium')) / nullif(count(*), 0),
    2
  ) as delay_rate_pct,
  round(avg(lead_time_days), 2) as avg_lead_time_days,
  round(
    100.0 * count(*) filter (where risk_level = 'Low') / nullif(count(*), 0),
    2
  ) as on_time_pct
from sample.scored
group by supplier_name, supplier_id;

create view mart.report_risky_routes as
select
  origin,
  destination,
  count(*)::int as total_shipments,
  count(*) filter (where risk_level in ('High', 'Medium'))::int as delayed_shipments,
  round(
    100.0 * count(*) filter (where risk_level in ('High', 'Medium')) / nullif(count(*), 0),
    2
  ) as delay_rate_pct,
  round(avg(lead_time_days), 2) as avg_lead_time_days,
  count(*) filter (where risk_level = 'High')::int as high_risk_count
from sample.scored
group by origin, destination;

create view mart.report_delay_prediction as
select
  tracking_number,
  supplier_name,
  origin,
  destination,
  expected_date,
  risk_level as predicted_risk,
  lead_time_days,
  status_updated as last_updated
from sample.scored;

-- The alerts page treats the end date as midnight, so an update from
-- today is left out. Keep High alerts on yesterday so the default
-- last-month filter includes them. Yesterday is still inside 2 days,
-- so the Medium rule does not replace High.
update sample.shipments
set status_updated = now() - interval '1 day'
where status_updated > date_trunc('day', now())
  and (
    expected_date < current_date
    or carrier_code ilike '%freight%'
  );

grant usage on schema mart to anon, authenticated;
grant select on
  mart.delaysense_summary,
  mart.delaysense_trend,
  mart.delaysense_suppliers,
  mart.shipments_dashboard,
  mart.alerts_public,
  mart.report_delay_trend_monthly,
  mart.report_supplier_performance,
  mart.report_risky_routes,
  mart.report_delay_prediction
to anon, authenticated;

commit;
