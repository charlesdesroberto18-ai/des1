import { motion } from 'motion/react';
import { DynamicIcon } from './Icons';

interface MetricCardProps {
  title: string;
  value: number;
  type: 'balance' | 'income' | 'expense' | 'savings';
  trend?: {
    value: number;
    isPositive: boolean;
    text: string;
  };
  iconName: string;
  colorClass: string;
  bgLightClass: string;
  borderColorClass: string;
}

export default function MetricCard({
  title,
  value,
  type,
  trend,
  iconName,
  colorClass,
  bgLightClass,
  borderColorClass,
}: MetricCardProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Convert typical background light classes to translucent ones on the dark theme
  const getGlassIconBg = () => {
    if (colorClass.includes('emerald')) return 'bg-emerald-500/15 text-emerald-400';
    if (colorClass.includes('rose')) return 'bg-rose-500/15 text-rose-400';
    if (colorClass.includes('amber')) return 'bg-amber-500/15 text-amber-400';
    return 'bg-indigo-500/15 text-indigo-400';
  };

  const getIconColorHex = () => {
    if (colorClass.includes('emerald')) return 'text-emerald-400';
    if (colorClass.includes('rose')) return 'text-rose-400';
    if (colorClass.includes('amber')) return 'text-amber-400';
    return 'text-indigo-400';
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-3xl glass-card glass-card-hover p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
    >
      {/* Decorative subtle top matching glow line */}
      <div className={`absolute top-0 left-0 right-0 h-1 opacity-60 ${colorClass}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl font-sans">
            {formatCurrency(value)}
          </h3>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${getGlassIconBg()}`}>
          <DynamicIcon name={iconName} className={`${getIconColorHex()} shrink-0`} size={22} />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              trend.isPositive
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            <DynamicIcon
              name={trend.isPositive ? 'ArrowUpRight' : 'ArrowDownLeft'}
              className="mr-1 inline-block shrink-0"
              size={12}
            />
            {trend.value}%
          </span>
          <span className="text-xs text-slate-400/80">{trend.text}</span>
        </div>
      )}

      {/* Embedded subtle backdrop graphic for elegance */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.03] text-white pointer-events-none">
        <DynamicIcon name={iconName} size={140} />
      </div>
    </motion.div>
  );
}
