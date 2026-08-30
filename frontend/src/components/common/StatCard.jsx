import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-[var(--color-surface)] p-6 border border-[var(--color-border)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-signature)] hover:shadow-xl shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] shadow-inner">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-semibold">
          <span className={trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="ml-2 text-[var(--color-text-secondary)]">{trend.label || 'from last week'}</span>
        </div>
      )}
    </motion.div>
  );
};
