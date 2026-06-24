import { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Transaction } from '../types';
import { CATEGORIES } from '../constants';
import { motion } from 'motion/react';
import { DynamicIcon } from './Icons';

interface FinanceChartsProps {
  transactions: Transaction[];
}

export default function FinanceCharts({ transactions }: FinanceChartsProps) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'flow'>('distribution');

  // 1. Calculate category distribution for EXPENSES
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const categoryTotals: Record<string, number> = {};

  expenseTransactions.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const pieData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const categoryInfo = CATEGORIES[catId] || {
      name: 'Outros',
      color: 'bg-slate-500',
    };
    return {
      name: categoryInfo.name,
      value: amount,
      color: getHexForCategory(catId),
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0',
    };
  }).sort((a, b) => b.value - a.value);

  // 2. Group transactions by date for flow chart
  // Group by date of the last 10 dates that have transactions
  const uniqueDates = Array.from(new Set(transactions.map((t) => t.date))).sort();
  const recentDates = uniqueDates.slice(-7); // Last 7 active days

  const barData = recentDates.map((date) => {
    const dayTrans = transactions.filter((t) => t.date === date);
    const income = dayTrans.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTrans.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const additional = dayTrans.filter((t) => t.type === 'additional').reduce((sum, t) => sum + t.amount, 0);
    
    // Format date as "DD/MM"
    const [_, month, day] = date.split('-');
    const formattedDate = `${day}/${month}`;

    return {
      fullDate: date,
      date: formattedDate,
      Receitas: income,
      Despesas: expense,
      Adicionais: additional,
    };
  });

  // Category Color Map helper
  function getHexForCategory(catId: string): string {
    const hexCodes: Record<string, string> = {
      alimentacao: '#f59e0b', // amber-500
      moradia: '#3b82f6',     // blue-500
      transporte: '#6366f1',  // indigo-500
      lazer: '#ec4899',       // pink-500
      saude: '#10b981',       // emerald-500
      educacao: '#8b5cf6',     // purple-500
      outros_gastos: '#64748b', // slate-500
      salario: '#84cc16',     // lime-500
      investimento: '#059669', // emerald-600
      freela: '#0ea5e9',      // sky-500
    };
    return hexCodes[catId] || '#94a3b8';
  }

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Custom tooltips
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-md p-3 shadow-xl">
          <p className="text-sm font-bold text-white">{data.name}</p>
          <p className="mt-1 text-sm font-semibold text-rose-400">
            {formatBRL(data.value)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{data.percentage}% do total de despesas</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-md p-3 shadow-xl">
          <p className="text-[10px] font-semibold text-slate-400 mb-1">Dia {label}</p>
          {payload.map((p: any, idx: number) => (
            <p
              key={idx}
              className={`text-sm font-bold ${
                p.name === 'Receitas' ? 'text-emerald-400' : p.name === 'Adicionais' ? 'text-sky-400' : 'text-rose-400'
              }`}
            >
              {p.name}: {formatBRL(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl glass-card p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <DynamicIcon name="Layers" size={18} className="text-indigo-400" />
            Análise Visual de Caixa
          </h2>
          <p className="text-xs text-slate-400">Visão gráfica dos seus fluxos e distribuições</p>
        </div>

        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DynamicIcon name="Filter" size={13} />
            Despesas por Categoria
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'flow'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DynamicIcon name="TrendingUp" size={13} />
            Últimos 7 Dias Ativos
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        {activeTab === 'distribution' ? (
          pieData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 h-full items-center">
              <div className="md:col-span-7 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with rich detail */}
              <div className="md:col-span-5 flex flex-col justify-center space-y-2 max-h-[260px] overflow-y-auto pr-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs border-b border-dashed border-white/10 pb-1.5">
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                    </div>
                    <div className="text-right ml-2">
                      <span className="font-mono font-bold text-white">{formatBRL(item.value)}</span>
                      <span className="text-slate-400 font-medium ml-1.5">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <DynamicIcon name="Info" size={32} className="text-slate-400" />
              <p className="text-sm font-medium">Nenhuma despesa para exibir a distribuição.</p>
              <p className="text-xs">Tente adicionar despesas com diferentes categorias.</p>
            </div>
          )
        ) : barData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Adicionais" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <DynamicIcon name="Info" size={32} className="text-slate-400" />
            <p className="text-sm font-medium">Fluxo diário indisponível por falta de datas.</p>
            <p className="text-xs">As barras aparecem conforme você registra novos dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
