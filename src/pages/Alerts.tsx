import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, Clock, Package, TrendingDown, RefreshCw, Search, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAlerts, listSuppliers } from '@/services/alerts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Alerts = () => {
  const [items, setItems] = useState<any[]>([]);
  const [counters, setCounters] = useState({ openAlerts: 0, high: 0, medium: 0 });
  const [suppliers, setSuppliers] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<'All'|'CRITICAL'|'WARNING'>('All');
  const [supplier, setSupplier] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openOnly, setOpenOnly] = useState(true);
  
  // Default date range: one month from current date
  const getDefaultDates = () => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return { from: oneMonthAgo, to: today };
  };
  
  const defaultDates = getDefaultDates();
  const [fromDate, setFromDate] = useState<Date | undefined>(defaultDates.from);
  const [toDate, setToDate] = useState<Date | undefined>(defaultDates.to);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchAlerts({
        q: searchQuery,
        supplier,
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        openOnly,
        severity
      });
      setItems(result.items);
      setCounters(result.counters);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      const errorMessage = error?.message || "Couldn't load alerts";
      const errorDetails = error?.code === "42501" 
        ? "Permission denied. The alerts table needs read permissions configured in Supabase RLS policies."
        : "Check Supabase configuration and network connection.";
      
      toast({
        title: 'Error Loading Alerts',
        description: `${errorMessage}. ${errorDetails}`,
        variant: 'destructive',
      });
      
      setItems([]);
      setCounters({ openAlerts: 0, high: 0, medium: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const supplierList = await listSuppliers();
      setSuppliers(supplierList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every hour (3600000ms)
    const interval = setInterval(loadData, 3600000);
    return () => clearInterval(interval);
  }, [severity, supplier, searchQuery, openOnly, fromDate, toDate]);

  const getSeverityColor = (sev: string) => {
    const severity = sev?.toLowerCase();
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getSeverityIcon = (sev: string) => {
    const severity = sev?.toLowerCase();
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return TrendingDown;
      default:
        return Package;
    }
  };

  const getAlertTitle = (alertType: string) => {
    switch (alertType?.toUpperCase()) {
      case 'DELAY_PREDICTED':
        return 'High Delay Risk Detected';
      case 'LEADTIME_ANOMALY':
        return 'Lead Time Anomaly';
      case 'WEATHER':
        return 'Weather Disruption';
      default:
        return alertType?.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') || 'Alert';
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2">
            <span className="gradient-text">Active Alerts</span>
          </h1>
          <p className="text-muted-foreground font-medium">Monitor and respond to supply chain disruptions</p>
        </motion.div>

        {/* KPI Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card p-4 cursor-pointer hover:scale-102 transition-transform" onClick={() => { setSeverity('All'); setOpenOnly(true); }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Alerts</p>
                <p className="text-2xl font-bold">{counters.openAlerts}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="glass-card p-4 cursor-pointer hover:scale-102 transition-transform" onClick={() => { setSeverity('CRITICAL'); setOpenOnly(false); }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Severity</p>
                <p className="text-2xl font-bold text-danger">{counters.high}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
          </Card>
          <Card className="glass-card p-4 cursor-pointer hover:scale-102 transition-transform" onClick={() => { setSeverity('WARNING'); setOpenOnly(false); }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium Severity</p>
                <p className="text-2xl font-bold text-warning">{counters.medium}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-warning" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-6 mb-6">
          {/* First Row: Search and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking # or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Severities</SelectItem>
                <SelectItem value="CRITICAL">High</SelectItem>
                <SelectItem value="WARNING">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Second Row: From Date and To Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[50px]">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal flex-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[50px]">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal flex-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Third Row: Supplier, Open Only, and Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s} value={s}>
                    {s === 'All' ? 'All Suppliers' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch id="open-only" checked={openOnly} onCheckedChange={setOpenOnly} />
              <Label htmlFor="open-only" className="text-sm font-medium">Open Only</Label>
            </div>
            <Button onClick={loadData} disabled={loading} className="mx-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {loading && items.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading alerts...</p>
            </div>
          ) : items.length > 0 ? (
            items.map((item, idx) => {
              const SeverityIcon = getSeverityIcon(item.severity);
              const borderColorClass = item.severity === 'critical'
                ? 'border-l-red-500'
                : item.severity === 'warning'
                ? 'border-l-yellow-500'
                : 'border-l-gray-300';
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.1, 0.5) }}
                >
                  <Card className={`p-6 hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 border-l-8 ${borderColorClass}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getSeverityColor(item.severity)}`}>
                        <SeverityIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-heading font-semibold mb-1">{item.title}</h3>
                            <Badge variant="outline" className={getSeverityColor(item.severity)}>
                              {item.chipLabel}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(item.triggeredAt)}</span>
                        </div>
                        <p className="text-gray-900 mb-3">{item.message}</p>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                           <div>
                             <span className="text-gray-600">Tracking:</span>
                             <span className="ml-2 font-medium text-gray-900">{item.tracking}</span>
                           </div>
                           <div>
                             <span className="text-gray-600">Supplier:</span>
                             <span className="ml-2 font-medium text-gray-900">{item.supplier}</span>
                           </div>
                           <div>
                             <span className="text-gray-600">Route:</span>
                             <span className="ml-2 font-medium text-gray-900">{item.route}</span>
                           </div>
                           <div>
                             <span className="text-gray-600">ETA:</span>
                             <span className="ml-2 font-medium text-gray-900">{item.eta}</span>
                           </div>
                         </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-2">No Active Alerts</h3>
              <p className="text-muted-foreground">
                {searchQuery || supplier !== 'All' || severity !== 'All' || fromDate || toDate
                  ? 'No alerts match your current filters'
                  : 'All systems are running smoothly'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
