import { dataClient } from '@/lib/dataClient'

export type AlertRow = {
  alert_id: string
  alert_type: 'DELAY_PREDICTED'|'DELAY_WARNING'|string
  severity: 'CRITICAL'|'WARNING'|string
  acknowledged: boolean
  message: string
  triggered_at: string
  supplier_name: string | null
  origin: string | null
  destination: string | null
  tracking_number: string | null
  eta: string | null
}

export async function fetchAlerts(params: {
  q?: string
  supplier?: string            // 'All' or a supplier_name
  fromDate?: string            // ISO (YYYY-MM-DD or full ISO)
  toDate?: string              // ISO
  openOnly?: boolean           // default true
  severity?: 'All'|'CRITICAL'|'WARNING'
}) {
  const {
    q = '', supplier = 'All', fromDate, toDate,
    openOnly = true, severity = 'All'
  } = params

  let req: any = dataClient.schema('mart').from('alerts_public' as any)
    .select('*')
    .order('triggered_at', { ascending: false })

  if (openOnly) req = req.eq('acknowledged', false)
  if (supplier !== 'All') req = req.eq('supplier_name', supplier)
  if (severity !== 'All') req = req.eq('severity', severity)
  if (fromDate) req = req.gte('triggered_at', fromDate)
  if (toDate)   req = req.lte('triggered_at', toDate)
  if (q) req = req.or(`tracking_number.ilike.%${q}%,supplier_name.ilike.%${q}%`)

  const { data, error } = await req
  if (error) throw error
  const rows = (data ?? []) as AlertRow[]

  // KPI tiles derived from the same rows
  const counters = {
    openAlerts: rows.length,
    high: rows.filter(r => r.severity === 'CRITICAL').length,
    medium: rows.filter(r => r.severity === 'WARNING').length,
  }

  // Shape list items for cards
  const items = rows.map(r => ({
    id: r.alert_id,
    title: r.alert_type === 'DELAY_PREDICTED' ? 'High Delay Risk Detected' : 'Delay Warning',
    severity: r.severity.toLowerCase(),       // 'critical' | 'warning' for CSS
    chipLabel: r.severity,                    // show 'CRITICAL' or 'WARNING'
    supplier: r.supplier_name ?? '—',
    route: [r.origin, r.destination].filter(Boolean).join(' → ') || '—',
    eta: r.eta ?? '—',
    message: r.message,
    tracking: r.tracking_number ?? '—',
    triggeredAt: r.triggered_at,
    acknowledged: r.acknowledged,
  }))

  return { items, counters }
}

// helper to populate supplier filter (distinct list)
export async function listSuppliers() {
  const { data, error } = await dataClient
    .schema('mart')
    .from('alerts_public' as any)
    .select('supplier_name', { count: 'exact', head: false })
    .not('supplier_name', 'is', null)
  if (error) throw error
  const names = Array.from(new Set((data as any[]).map(r => r.supplier_name as string)))
  names.sort((a,b) => a.localeCompare(b))
  return ['All', ...names]
}
