import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const KPICard = ({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: KPICardProps) => {
  const variantConfig = {
    default: {
      iconBg: 'bg-gradient-to-br from-primary/20 to-primary/10',
      iconColor: 'text-primary',
      border: 'border-primary/20',
    },
    success: {
      iconBg: 'bg-gradient-to-br from-success/20 to-success/10',
      iconColor: 'text-success',
      border: 'border-success/20',
    },
    warning: {
      iconBg: 'bg-gradient-to-br from-warning/20 to-warning/10',
      iconColor: 'text-warning',
      border: 'border-warning/20',
    },
    danger: {
      iconBg: 'bg-gradient-to-br from-danger/20 to-danger/10',
      iconColor: 'text-danger',
      border: 'border-danger/20',
    },
  };

  const config = variantConfig[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 border-l-4 ${config.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold font-heading mb-1 text-foreground">{value}</p>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={`p-4 rounded-xl ${config.iconBg} ${config.iconColor} shadow-md`}>
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;
