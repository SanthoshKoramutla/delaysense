import { dataClient } from './dataClient';

export interface Summary {
  total_shipments: number;
  predicted_delays: number;
  pct_delayed: number;
  avg_lead_time_days: number;
  shipments_in_transit: number;
  shipments_delivered: number;
  shipments_out_for_delivery: number;
  shipments_lables_created: number;
}

export interface TrendData {
  shipment_day: string;
  total_shipments: number;
  predicted_delays: number;
  pct_delayed: number;
  avg_lead_time_days: number;
}

export interface SupplierData {
  supplier_name: string;
  total_shipments: number;
  delayed_shipments: number;
  delay_rate_pct: number;
  avg_lead_time_days: number;
}

export interface SupplierName {
  supplier_name: string;
}

export interface ShipmentData {
  supplier_name: string;
  expected_date: string;
  delay_predicted: boolean;
}

export interface AlertData {
  alert_id: string;
  alert_type: string;
  severity: string;
  message: string;
  triggered_at: string;
  acknowledged: boolean;
  shipment?: {
    shipment_id: string;
    tracking_number: string;
    carrier_code: string;
    origin: string;
    destination: string;
    expected_date: string;
    status: string;
    risk_level: string;
    supplier?: {
      supplier_id: string;
      supplier_name: string;
    };
  };
}

export interface AlertCounts {
  total: number;
  high: number;
  medium: number;
}

export async function getSummary(): Promise<Summary> {
  const { data, error } = await dataClient
    .schema('mart')
    .from('delaysense_summary')
    .select('*')
    .single();

  if (error) throw error;
  return data as unknown as Summary;
}

export async function getTrend(params?: {
  from?: string;
  to?: string;
}): Promise<TrendData[]> {
  let query = dataClient
    .schema('mart')
    .from('delaysense_trend')
    .select('*')
    .order('shipment_day', { ascending: true });

  if (params?.from) {
    query = query.gte('shipment_day', params.from);
  }
  if (params?.to) {
    query = query.lte('shipment_day', params.to);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as TrendData[];
}

export async function getSuppliers(): Promise<SupplierData[]> {
  const { data, error } = await dataClient
    .schema('mart')
    .from('delaysense_suppliers')
    .select('*')
    .order('delay_rate_pct', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data as unknown as SupplierData[];
}

export async function getSuppliersList(): Promise<SupplierName[]> {
  const { data, error } = await dataClient
    .schema('mart')
    .from('delaysense_suppliers')
    .select('supplier_name')
    .order('supplier_name', { ascending: true });

  if (error) throw error;
  return data as unknown as SupplierName[];
}

export async function getSupplierTrend(params?: {
  from?: string;
  to?: string;
  suppliers?: string[];
}): Promise<ShipmentData[]> {
  let query = dataClient
    .schema('mart')
    .from('shipments_dashboard')
    .select('supplier_name,expected_date,delay_predicted')
    .order('expected_date', { ascending: true });

  if (params?.from) {
    query = query.gte('expected_date', params.from);
  }
  if (params?.to) {
    query = query.lte('expected_date', params.to);
  }
  if (params?.suppliers && params.suppliers.length > 0) {
    query = query.in('supplier_name', params.suppliers);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as ShipmentData[];
}

export async function getAlerts(params?: {
  severity?: string;
  from?: string;
  to?: string;
  search?: string;
  openOnly?: boolean;
}): Promise<AlertData[]> {
  let query = dataClient
    .schema('mart')
    .from('alerts_public')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(50);

  if (params?.severity) {
    query = query.eq('severity', params.severity);
  }
  if (params?.from) {
    query = query.gte('triggered_at', params.from);
  }
  if (params?.to) {
    query = query.lte('triggered_at', params.to);
  }
  if (params?.openOnly) {
    query = query.eq('acknowledged', false);
  }
  if (params?.search) {
    query = query.or(`message.ilike.%${params.search}%,supplier_name.ilike.%${params.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as AlertData[];
}

export async function getAlertCounts(): Promise<AlertCounts> {
  const [totalRes, highRes, mediumRes] = await Promise.all([
    dataClient
      .schema('mart')
      .from('alerts_public')
      .select('alert_id', { count: 'exact', head: true })
      .eq('acknowledged', false),
    dataClient
      .schema('mart')
      .from('alerts_public')
      .select('alert_id', { count: 'exact', head: true })
      .eq('acknowledged', false)
      .eq('severity', 'HIGH'),
    dataClient
      .schema('mart')
      .from('alerts_public')
      .select('alert_id', { count: 'exact', head: true })
      .eq('acknowledged', false)
      .eq('severity', 'MEDIUM'),
  ]);

  return {
    total: totalRes.count || 0,
    high: highRes.count || 0,
    medium: mediumRes.count || 0,
  };
}

export interface MonthlyTrendData {
  month_start: string;
  total_shipments: number;
  predicted_delays: number;
  at_risk: number;
  avg_lead_time_days: number;
  delay_rate_pct: number;
}

export interface SupplierPerformanceData {
  supplier_name: string;
  supplier_id: string;
  total_shipments: number;
  delayed_shipments: number;
  delay_rate_pct: number;
  avg_lead_time_days: number;
  on_time_pct: number;
}

export interface RiskyRouteData {
  origin: string;
  destination: string;
  total_shipments: number;
  delayed_shipments: number;
  delay_rate_pct: number;
  avg_lead_time_days: number;
  high_risk_count: number;
}

export async function getMonthlyTrend(params?: {
  from?: string;
  to?: string;
}): Promise<MonthlyTrendData[]> {
  let query = dataClient
    .schema('mart')
    .from('report_delay_trend_monthly')
    .select('*')
    .order('month_start', { ascending: true });

  if (params?.from) {
    query = query.gte('month_start', params.from);
  }
  if (params?.to) {
    query = query.lte('month_start', params.to);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as MonthlyTrendData[];
}

export async function getSupplierPerformance(): Promise<SupplierPerformanceData[]> {
  const { data, error } = await dataClient
    .schema('mart')
    .from('report_supplier_performance')
    .select('*')
    .order('delay_rate_pct', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as unknown as SupplierPerformanceData[];
}

export async function getRiskyRoutes(): Promise<RiskyRouteData[]> {
  const { data, error } = await dataClient
    .schema('mart')
    .from('report_risky_routes')
    .select('*')
    .order('delay_rate_pct', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as unknown as RiskyRouteData[];
}

export interface DelayPredictionData {
  tracking_number: string;
  supplier_name: string;
  origin: string;
  destination: string;
  expected_date: string;
  predicted_risk: string;
  lead_time_days: number;
  last_updated: string;
}

export async function getDelayPredictions(): Promise<DelayPredictionData[]> {
  const { data, error } = await dataClient
    .schema('mart')
    .from('report_delay_prediction')
    .select('*')
    .order('expected_date', { ascending: true });

  if (error) throw error;
  return data as unknown as DelayPredictionData[];
}
