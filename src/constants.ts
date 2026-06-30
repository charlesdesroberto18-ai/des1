import { Category, Transaction, Budget, SavingsGoal } from './types';

export const CATEGORIES: Record<string, Category> = {
  alimentacao: {
    id: 'alimentacao',
    name: 'Alimentação',
    icon: 'Utensils',
    color: 'bg-amber-500',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
  },
  moradia: {
    id: 'moradia',
    name: 'Moradia',
    icon: 'Home',
    color: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
  },
  transporte: {
    id: 'transporte',
    name: 'Transporte',
    icon: 'Car',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
  },
  lazer: {
    id: 'lazer',
    name: 'Lazer & Viagens',
    icon: 'Compass',
    color: 'bg-pink-500',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    bgLight: 'bg-pink-50',
  },
  saude: {
    id: 'saude',
    name: 'Saúde & Bem-estar',
    icon: 'HeartPulse',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
  },
  educacao: {
    id: 'educacao',
    name: 'Educação',
    icon: 'GraduationCap',
    color: 'bg-purple-500',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    bgLight: 'bg-purple-50',
  },
  outros_gastos: {
    id: 'outros_gastos',
    name: 'Outros Gastos',
    icon: 'Sparkles',
    color: 'bg-slate-500',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-700',
    bgLight: 'bg-slate-50',
  },
  // Classes de receita:
  salario: {
    id: 'salario',
    name: 'Salário',
    icon: 'Briefcase',
    color: 'bg-lime-500',
    borderColor: 'border-lime-200',
    textColor: 'text-lime-700',
    bgLight: 'bg-lime-50',
  },
  investimento: {
    id: 'investimento',
    name: 'Investimentos',
    icon: 'TrendingUp',
    color: 'bg-emerald-600',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-800',
    bgLight: 'bg-emerald-50',
  },
  freela: {
    id: 'freela',
    name: 'Freelas & Extras',
    icon: 'Cpu',
    color: 'bg-sky-500',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
    bgLight: 'bg-sky-50',
  },
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'alimentacao', limitAmount: 1000 },
  { category: 'moradia', limitAmount: 2000 },
  { category: 'transporte', limitAmount: 500 },
  { category: 'lazer', limitAmount: 400 },
  { category: 'saude', limitAmount: 500 },
  { category: 'educacao', limitAmount: 300 },
  { category: 'outros_gastos', limitAmount: 200 },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'g1',
    name: 'Reserva de Emergência',
    targetAmount: 15000,
    currentAmount: 12000,
    deadline: '2026-12-31',
    color: '#10b981', // emerald-500
  },
  {
    id: 'g2',
    name: 'Viagem de Fim de Ano',
    targetAmount: 8000,
    currentAmount: 3200,
    deadline: '2026-11-30',
    color: '#ea580c', // orange-600
  },
  {
    id: 'g3',
    name: 'Curso de Especialização',
    targetAmount: 4500,
    currentAmount: 2250,
    deadline: '2026-09-15',
    color: '#8b5cf6', // violet-500
  },
];
