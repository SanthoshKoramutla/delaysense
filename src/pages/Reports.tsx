import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Maximize2, TrendingUp, Users, MapPin, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyTrend, getSupplierPerformance, getRiskyRoutes, getDelayPredictions } from '@/lib/dataService';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [expandedReport, setExpandedReport] = useState<'trend' | 'supplier' | 'routes' | 'predictions' | null>(null);

  const { data: monthlyTrend, isLoading: loadingTrend } = useQuery({
    queryKey: ['monthlyTrend'],
    queryFn: () => getMonthlyTrend(),
    refetchInterval: 60000,
  });

  const { data: supplierPerf, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['supplierPerformance'],
    queryFn: getSupplierPerformance,
    refetchInterval: 60000,
  });

  const { data: riskyRoutes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['riskyRoutes'],
    queryFn: getRiskyRoutes,
    refetchInterval: 60000,
  });

  const { data: delayPredictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['delayPredictions'],
    queryFn: getDelayPredictions,
    refetchInterval: 60000,
  });

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadXLSX = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    // Simple TSV format that Excel can open
    const headers = Object.keys(data[0]).join('\t');
    const rows = data.map(row => Object.values(row).join('\t'));
    const tsv = [headers, ...rows].join('\n');
    
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any[], filename: string, title: string) => {
    if (!data || data.length === 0) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    
    // Prepare table data
    const headers = Object.keys(data[0]).map(key => 
      key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    const rows = data.map(row => Object.values(row).map(val => 
      typeof val === 'number' ? val.toFixed(2) : String(val)
    ));
    
    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 122, 255] },
    });
    
    doc.save(`${filename}.pdf`);
  };

  const latestTrend = monthlyTrend?.slice(-3) || [];
  const topSuppliers = supplierPerf?.slice(0, 3) || [];
  const topRiskyRoutes = riskyRoutes?.slice(0, 5) || [];
  const topPredictions = delayPredictions?.slice(0, 5) || [];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2">
            <span className="gradient-text">Reports Dashboard</span>
          </h1>
          <p className="text-muted-foreground font-medium">View and export detailed performance reports from DelaySense AI analytics mart.</p>
        </motion.div>

        {/* Report 1: Monthly Delay Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold">Monthly Delay Trend</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedReport('trend')}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </div>
            <div className="p-6">
              {loadingTrend ? (
                <div className="py-8 text-center text-muted-foreground">Loading trend data...</div>
              ) : latestTrend.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No trend data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Total Shipments</TableHead>
                        <TableHead className="text-right">Predicted Delays</TableHead>
                        <TableHead className="text-right">At Risk</TableHead>
                        <TableHead className="text-right">Avg Lead Time</TableHead>
                        <TableHead className="text-right">Delay Rate (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestTrend.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {new Date(row.month_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-right">{Number(row.total_shipments ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(row.predicted_delays ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(row.at_risk ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(row.avg_lead_time_days ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{Number(row.delay_rate_pct ?? 0).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(monthlyTrend || [], 'monthly-delay-trend')}
                disabled={!monthlyTrend || monthlyTrend.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadXLSX(monthlyTrend || [], 'monthly-delay-trend')}
                disabled={!monthlyTrend || monthlyTrend.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDF(monthlyTrend || [], 'monthly-delay-trend', 'Monthly Delay Trend Report')}
                disabled={!monthlyTrend || monthlyTrend.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Report 2: Supplier Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <Card className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold">Supplier Performance Summary</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedReport('supplier')}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </div>
            <div className="p-6">
              {loadingSuppliers ? (
                <div className="py-8 text-center text-muted-foreground">Loading supplier data...</div>
              ) : topSuppliers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No supplier data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Total Shipments</TableHead>
                        <TableHead className="text-right">Delayed</TableHead>
                        <TableHead className="text-right">Delay Rate (%)</TableHead>
                        <TableHead className="text-right">Avg Lead Time</TableHead>
                        <TableHead className="text-right">On-time (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSuppliers.map((supplier) => (
                        <TableRow key={supplier.supplier_id}>
                          <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                          <TableCell className="text-right">{Number(supplier.total_shipments ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(supplier.delayed_shipments ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(supplier.delay_rate_pct ?? 0).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{Number(supplier.avg_lead_time_days ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{Number(supplier.on_time_pct ?? 0).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(supplierPerf || [], 'supplier-performance')}
                disabled={!supplierPerf || supplierPerf.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadXLSX(supplierPerf || [], 'supplier-performance')}
                disabled={!supplierPerf || supplierPerf.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDF(supplierPerf || [], 'supplier-performance', 'Supplier Performance Report')}
                disabled={!supplierPerf || supplierPerf.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Report 3: Risky Routes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold">Top 10 Risky Routes</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedReport('routes')}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </div>
            <div className="p-6">
              {loadingRoutes ? (
                <div className="py-8 text-center text-muted-foreground">Loading route data...</div>
              ) : topRiskyRoutes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No route data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Origin</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead className="text-right">Total Shipments</TableHead>
                        <TableHead className="text-right">Delayed</TableHead>
                        <TableHead className="text-right">Delay Rate (%)</TableHead>
                        <TableHead className="text-right">Avg Lead Time</TableHead>
                        <TableHead className="text-right">High Risk Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRiskyRoutes.map((route, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{route.origin}</TableCell>
                          <TableCell className="font-medium">{route.destination}</TableCell>
                          <TableCell className="text-right">{Number(route.total_shipments ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(route.delayed_shipments ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(route.delay_rate_pct ?? 0).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{Number(route.avg_lead_time_days ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{Number(route.high_risk_count ?? 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(riskyRoutes || [], 'risky-routes')}
                disabled={!riskyRoutes || riskyRoutes.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadXLSX(riskyRoutes || [], 'risky-routes')}
                disabled={!riskyRoutes || riskyRoutes.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDF(riskyRoutes || [], 'risky-routes', 'Risky Routes Report')}
                disabled={!riskyRoutes || riskyRoutes.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Report 4: Delay Predictions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
          <Card className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold">Delay Predictions</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedReport('predictions')}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </div>
            <div className="p-6">
              {loadingPredictions ? (
                <div className="py-8 text-center text-muted-foreground">Loading prediction data...</div>
              ) : topPredictions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No prediction data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead className="text-right">Lead Time</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPredictions.map((pred, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{pred.tracking_number}</TableCell>
                          <TableCell>{pred.supplier_name}</TableCell>
                          <TableCell>{pred.origin} → {pred.destination}</TableCell>
                          <TableCell>{new Date(pred.expected_date).toLocaleDateString()}</TableCell>
                          <TableCell>{Number(pred.lead_time_days ?? 0).toFixed(0)} days</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              pred.predicted_risk === 'High' ? 'bg-red-100 text-red-800' :
                              pred.predicted_risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {pred.predicted_risk}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(delayPredictions || [], 'delay-predictions')}
                disabled={!delayPredictions || delayPredictions.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadXLSX(delayPredictions || [], 'delay-predictions')}
                disabled={!delayPredictions || delayPredictions.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDF(delayPredictions || [], 'delay-predictions', 'Delay Predictions Report')}
                disabled={!delayPredictions || delayPredictions.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Expanded Modal - Monthly Trend */}
        <Dialog open={expandedReport === 'trend'} onOpenChange={() => setExpandedReport(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Delay Trend - Full Report
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Shipments</TableHead>
                    <TableHead className="text-right">Predicted Delays</TableHead>
                    <TableHead className="text-right">At Risk</TableHead>
                    <TableHead className="text-right">Avg Lead Time</TableHead>
                    <TableHead className="text-right">Delay Rate (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(monthlyTrend || []).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {new Date(row.month_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">{Number(row.total_shipments ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(row.predicted_delays ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(row.at_risk ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(row.avg_lead_time_days ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(row.delay_rate_pct ?? 0).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Expanded Modal - Supplier Performance */}
        <Dialog open={expandedReport === 'supplier'} onOpenChange={() => setExpandedReport(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Supplier Performance - Full Report
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total Shipments</TableHead>
                    <TableHead className="text-right">Delayed</TableHead>
                    <TableHead className="text-right">Delay Rate (%)</TableHead>
                    <TableHead className="text-right">Avg Lead Time</TableHead>
                    <TableHead className="text-right">On-time (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(supplierPerf || []).map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                      <TableCell className="text-right">{Number(supplier.total_shipments ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(supplier.delayed_shipments ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(supplier.delay_rate_pct ?? 0).toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{Number(supplier.avg_lead_time_days ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(supplier.on_time_pct ?? 0).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Expanded Modal - Risky Routes */}
        <Dialog open={expandedReport === 'routes'} onOpenChange={() => setExpandedReport(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Risky Routes - Full Report
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Total Shipments</TableHead>
                    <TableHead className="text-right">Delayed</TableHead>
                    <TableHead className="text-right">Delay Rate (%)</TableHead>
                    <TableHead className="text-right">Avg Lead Time</TableHead>
                    <TableHead className="text-right">High Risk Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(riskyRoutes || []).map((route, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{route.origin}</TableCell>
                      <TableCell className="font-medium">{route.destination}</TableCell>
                      <TableCell className="text-right">{Number(route.total_shipments ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(route.delayed_shipments ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(route.delay_rate_pct ?? 0).toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{Number(route.avg_lead_time_days ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(route.high_risk_count ?? 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Expanded Modal - Delay Predictions */}
        <Dialog open={expandedReport === 'predictions'} onOpenChange={() => setExpandedReport(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Delay Predictions - Full Report
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead className="text-right">Lead Time</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(delayPredictions || []).map((pred, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{pred.tracking_number}</TableCell>
                      <TableCell>{pred.supplier_name}</TableCell>
                      <TableCell>{pred.origin} → {pred.destination}</TableCell>
                      <TableCell>{new Date(pred.expected_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{Number(pred.lead_time_days ?? 0).toFixed(0)} days</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.predicted_risk === 'High' ? 'bg-red-100 text-red-800' :
                          pred.predicted_risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {pred.predicted_risk}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(pred.last_updated).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Reports;
