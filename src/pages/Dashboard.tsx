import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, Clock, Search, RefreshCw, Truck, CheckCircle, PackageCheck, Tag } from 'lucide-react';
import KPICard from '@/components/KPICard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  getSummary, 
  getTrend, 
  getSuppliers, 
  getSuppliersList, 
  getSupplierTrend,
  Summary, 
  TrendData, 
  SupplierData,
  SupplierName,
  ShipmentData 
} from '@/lib/dataService';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'total_shipments' | 'pct_delayed' | 'avg_lead_time_days'>('total_shipments');
  
  // Default date range: one month from current date
  const getDefaultDates = () => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return {
      from: oneMonthAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaultDates.from);
  const [dateTo, setDateTo] = useState(defaultDates.to);
  const [error, setError] = useState<string | null>(null);
  
  // Supplier comparison state
  const [suppliersList, setSuppliersList] = useState<SupplierName[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [supplierTrendData, setSupplierTrendData] = useState<any[]>([]);
  const [supplierMetric, setSupplierMetric] = useState<'shipments' | 'delay_pct'>('shipments');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dateFrom || dateTo) {
      loadTrendData();
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredSuppliers(
        suppliers.filter((s) => s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchTerm, suppliers]);

  useEffect(() => {
    if (selectedSuppliers.length > 0) {
      loadSupplierTrendData();
    }
  }, [dateFrom, dateTo, selectedSuppliers]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, trendData, suppliersData, suppliersListData] = await Promise.all([
        getSummary(),
        getTrend({ from: dateFrom || undefined, to: dateTo || undefined }),
        getSuppliers(),
        getSuppliersList(),
      ]);
      setSummary(summaryData);
      setTrend(trendData);
      setSuppliers(suppliersData);
      setFilteredSuppliers(suppliersData);
      setSuppliersList(suppliersListData);
    } catch (error) {
      setError('Could not load dashboard data. Check Supabase URL/key, RLS, or view names.');
      toast({
        title: 'Error',
        description: 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async () => {
    try {
      const trendData = await getTrend({ from: dateFrom || undefined, to: dateTo || undefined });
      setTrend(trendData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load trend data',
        variant: 'destructive',
      });
    }
  };

  const loadSupplierTrendData = async () => {
    try {
      const rawData = await getSupplierTrend({ 
        from: dateFrom || undefined, 
        to: dateTo || undefined,
        suppliers: selectedSuppliers.length > 0 ? selectedSuppliers : undefined
      });
      
      // Aggregate by date and supplier
      const aggregated = rawData.reduce((acc, item) => {
        const key = `${item.expected_date}_${item.supplier_name}`;
        if (!acc[key]) {
          acc[key] = {
            date: item.expected_date,
            supplier: item.supplier_name,
            total: 0,
            delayed: 0,
          };
        }
        acc[key].total += 1;
        if (item.delay_predicted) {
          acc[key].delayed += 1;
        }
        return acc;
      }, {} as Record<string, any>);

      // Group by date
      const byDate = Object.values(aggregated).reduce((acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = { date: item.date };
        }
        acc[item.date][`${item.supplier}_shipments`] = item.total;
        acc[item.date][`${item.supplier}_delay_pct`] = (item.delayed / item.total) * 100;
        return acc;
      }, {} as Record<string, any>);

      setSupplierTrendData(Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error loading supplier trend:', error);
      toast({
        title: 'Error',
        description: 'Could not load supplier comparison data',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedSuppliers.length > 0) {
      await loadSupplierTrendData();
    }
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Dashboard data updated successfully',
    });
  };

  const toggleSupplier = (supplier: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplier) ? prev.filter((s) => s !== supplier) : [...prev, supplier]
    );
  };

  const clearDateRange = () => {
    setDateFrom('');
    setDateTo('');
  };

  if (loading || !summary) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topSuppliers = filteredSuppliers.slice(0, 10);

  const metricConfig = {
    total_shipments: { name: 'Total Shipments', color: 'hsl(var(--primary))' },
    pct_delayed: { name: 'Delay %', color: 'hsl(var(--warning))' },
    avg_lead_time_days: { name: 'Avg Lead Time', color: 'hsl(var(--chart-3))' },
  };

  const chartData = trend.map((item) => ({
    ...item,
    displayValue: selectedMetric === 'pct_delayed' ? item[selectedMetric] : item[selectedMetric],
  }));

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-2">
                <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-muted-foreground font-medium">Monitor your supply chain in real-time</p>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* KPI Cards */}
        {summary ? (
          <div className="space-y-6 mb-8">
            {/* Performance & Risk Metrics */}
            <div>
              <h2 className="text-lg font-heading font-semibold mb-4 text-foreground">Performance & Risk Metrics</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <KPICard
                  title="Total Shipments"
                  value={summary.total_shipments}
                  icon={Package}
                  variant="default"
                  delay={0}
                />
                <KPICard
                  title="Predicted Delays"
                  value={summary.predicted_delays}
                  icon={AlertTriangle}
                  variant={summary.predicted_delays > 0 ? 'warning' : 'success'}
                  delay={0.1}
                />
                <KPICard
                  title="Delay Rate"
                  value={`${Number(summary.pct_delayed ?? 0).toFixed(2)}%`}
                  icon={TrendingUp}
                  variant={summary.pct_delayed > 0.05 ? 'danger' : 'success'}
                  delay={0.2}
                />
                <KPICard
                  title="Avg Lead Time"
                  value={`${Number(summary.avg_lead_time_days ?? 0).toFixed(2)} days`}
                  icon={Clock}
                  variant="default"
                  delay={0.3}
                />
              </div>
            </div>

            {/* Operational Status Distribution */}
            <div>
              <h2 className="text-lg font-heading font-semibold mb-4 text-foreground">Operational Status Distribution</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <KPICard
                  title="Labels Created"
                  value={summary.shipments_lables_created ?? 0}
                  icon={Tag}
                  variant="default"
                  delay={0.4}
                />
                <KPICard
                  title="In Transit"
                  value={summary.shipments_in_transit ?? 0}
                  icon={Truck}
                  variant="default"
                  delay={0.5}
                />
                <KPICard
                  title="Out for Delivery"
                  value={summary.shipments_out_for_delivery ?? 0}
                  icon={PackageCheck}
                  variant="default"
                  delay={0.6}
                />
                <KPICard
                  title="Delivered"
                  value={summary.shipments_delivered ?? 0}
                  icon={CheckCircle}
                  variant="success"
                  delay={0.7}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No summary data yet.</div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card p-6 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold text-foreground">Trend Analysis</h2>
                <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_shipments">Total Shipments</SelectItem>
                    <SelectItem value="pct_delayed">Delay %</SelectItem>
                    <SelectItem value="avg_lead_time_days">Avg Lead Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">From:</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">To:</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <h3 className="text-center text-lg font-semibold mb-3 text-foreground">
                {metricConfig[selectedMetric].name}
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="shipment_day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => Number(value).toFixed(2)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="displayValue"
                      stroke={metricConfig[selectedMetric].color}
                      strokeWidth={2}
                      name={metricConfig[selectedMetric].name}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No shipments in the selected range.
                </div>
              )}
            </Card>
          </motion.div>

          {/* Delay Rate by Supplier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card p-6 bg-gradient-to-br from-secondary/5 to-transparent">
              <h2 className="text-xl font-heading font-semibold mb-4 text-foreground">Top 10 Suppliers by Delay Rate</h2>
              {topSuppliers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSuppliers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      dataKey="supplier_name"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      fontWeight="bold"
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                    />
                    <Bar dataKey="delay_rate_pct" name="Delay Rate %">
                      {topSuppliers.map((entry, index) => {
                        const rate = entry.delay_rate_pct;
                        const intensity = Math.min(rate / 100, 1);
                        const color = `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No suppliers found.
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Supplier Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass-card p-6 bg-gradient-to-br from-accent/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-foreground">Supplier Performance</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
            {filteredSuppliers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Supplier</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Shipments</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Delayed</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Delay Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Avg Lead Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier, idx) => {
                      const getDelayRateColor = (rate: number) => {
                        if (rate >= 75) return 'text-red-600 font-semibold';
                        if (rate >= 50) return 'text-orange-500 font-semibold';
                        if (rate >= 25) return 'text-yellow-600 font-semibold';
                        return 'text-blue-600 font-semibold';
                      };
                      
                      return (
                        <tr key={idx} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                          <td className="py-3 px-4">{supplier.supplier_name}</td>
                          <td className="text-right py-3 px-4">{supplier.total_shipments}</td>
                          <td className="text-right py-3 px-4">{supplier.delayed_shipments}</td>
                          <td className="text-right py-3 px-4">
                            <span className={getDelayRateColor(supplier.delay_rate_pct)}>
                              {Number(supplier.delay_rate_pct ?? 0).toFixed(2)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">{Number(supplier.avg_lead_time_days ?? 0).toFixed(2)} days</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No suppliers found.</div>
            )}
          </Card>
        </motion.div>

        {/* Compare by Supplier Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="glass-card p-6 bg-gradient-to-br from-chart-1/5 to-transparent">
            <h2 className="text-xl font-heading font-semibold mb-4 text-foreground">Compare Delay Trends by Supplier</h2>
            
            <div className="space-y-4 mb-4">
              {/* Date range controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">From:</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">To:</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Metric selector */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Metric:</label>
                  <Select value={supplierMetric} onValueChange={(value: any) => setSupplierMetric(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipments">Total Shipments</SelectItem>
                      <SelectItem value="delay_pct">Delay %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier multi-select */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Suppliers:</label>
                  <Select onValueChange={(value) => {
                    if (value === 'All') {
                      setSelectedSuppliers(suppliersList.map(s => s.supplier_name));
                    } else if (value) {
                      toggleSupplier(value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSuppliers.length > 0 ? `${selectedSuppliers.length} selected` : "All"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="All">All Suppliers</SelectItem>
                      {suppliersList.map((s) => (
                        <SelectItem key={s.supplier_name} value={s.supplier_name}>
                          {selectedSuppliers.includes(s.supplier_name) ? '✓ ' : ''}{s.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {selectedSuppliers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedSuppliers.map((supplier) => (
                  <button
                    key={supplier}
                    onClick={() => toggleSupplier(supplier)}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm hover:bg-primary/30 transition-colors"
                  >
                    {supplier} ×
                  </button>
                ))}
              </div>
            )}

            {selectedSuppliers.length > 0 && supplierTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={supplierTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => Number(value).toFixed(2)}
                  />
                  <Legend />
                  {selectedSuppliers.map((supplier, idx) => {
                    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                    const dataKey = supplierMetric === 'shipments' ? `${supplier}_shipments` : `${supplier}_delay_pct`;
                    return (
                      <Line
                        key={supplier}
                        type="monotone"
                        dataKey={dataKey}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        name={`${supplier} ${supplierMetric === 'shipments' ? '(Shipments)' : '(Delay %)'}`}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                {selectedSuppliers.length === 0 
                  ? 'Select suppliers to compare delay trends' 
                  : 'No data for selected range'}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
