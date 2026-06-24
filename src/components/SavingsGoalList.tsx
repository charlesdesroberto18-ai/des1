import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { DynamicIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface SavingsGoalListProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoalProgress: (id: string, amountChange: number) => void;
  onDeleteGoal: (id: string) => void;
}

export default function SavingsGoalList({
  goals,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
}: SavingsGoalListProps) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#6366f1'); // Default Indigo

  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [activeWithdrawId, setActiveWithdrawId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const calculateDaysLeft = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) {
      toast.error('Insira o nome descriptivo da nova meta!', 'Objetivo Sem Nome');
      return;
    }
    const targetVal = parseFloat(newGoalTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error('O objetivo planejado de poupança precisa ser um valor numérico maior que zero!', 'Alvo Inválido');
      return;
    }
    if (!newGoalDeadline) {
      toast.error('Delineie uma data limite de conclusão para esta meta!', 'Data Não Informada');
      return;
    }
    
    onAddGoal({
      name: newGoalName.trim(),
      targetAmount: targetVal,
      currentAmount: 0,
      deadline: newGoalDeadline,
      color: newGoalColor,
    });

    // Reset Form
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDeadline('');
    setNewGoalColor('#6366f1');
    setShowAddForm(false);
  };

  const handleTransactionSubmit = (id: string, isDeposit: boolean) => {
    const change = parseFloat(amountInput);
    if (isNaN(change) || change <= 0) {
      toast.error('Digite um montante de depósito ou resgate válido!', 'Aporte Inválido');
      return;
    }

    const targetGoal = goals.find(g => g.id === id);
    if (!isDeposit && targetGoal && targetGoal.currentAmount < change) {
      toast.error(`Saldo insuficiente nesta meta para este saque! Você possui apenas ${formatBRL(targetGoal.currentAmount)}.`, 'Resgate Recusado');
      return;
    }
    
    // If withdrawing, represent as negative number
    onUpdateGoalProgress(id, isDeposit ? change : -change);
    
    // Reset state
    setActiveDepositId(null);
    setActiveWithdrawId(null);
    setAmountInput('');
  };

  return (
    <div className="rounded-3xl glass-card p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <DynamicIcon name="PiggyBank" size={18} className="text-emerald-400" />
            Metas de Poupança
          </h2>
          <p className="text-xs text-slate-400">Guarde dinheiro para objetivos específicos</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-350 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <DynamicIcon name={showAddForm ? 'X' : 'Plus'} size={14} />
          {showAddForm ? 'Cancelar' : 'Nova Meta'}
        </button>
      </div>

      {/* Add New Goal Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleAddSubmit}
            className="mb-5 overflow-hidden border border-white/10 bg-white/5 rounded-2xl p-4 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Cadastrar Novo Objetivo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nome do Sonho / Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novo notebook, Viagem..."
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Valor Alvo (R$)</label>
                <input
                  type="number"
                  step="50"
                  required
                  placeholder="Ex: 5000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Prazo Final</label>
                <input
                  type="date"
                  required
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Cor Temática no Dashboard</label>
                <div className="flex items-center gap-2 mt-1">
                  {['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#ea580c', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGoalColor(color)}
                      className={`h-6 w-6 rounded-full border transition-all cursor-pointer ${
                        newGoalColor === color ? 'border-white scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-550 hover:bg-indigo-650 font-bold text-xs text-white py-2 shadow-sm transition-colors cursor-pointer"
            >
              <DynamicIcon name="Check" size={14} /> Incorporar Objetivo
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Goal Items List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const daysLeft = calculateDaysLeft(goal.deadline);
          const isCompleted = percent >= 100;

          const isActionOpen = activeDepositId === goal.id || activeWithdrawId === goal.id;

          return (
            <div key={goal.id} className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors duration-200">
              <button
                onClick={() => onDeleteGoal(goal.id)}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-450 transition-all p-1 cursor-pointer"
                title="Excluir meta"
              >
                <DynamicIcon name="Trash2" size={12} />
              </button>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                    {goal.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <DynamicIcon name="Calendar" size={11} />
                    Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                    {!isCompleted && (
                      <span className={`font-semibold ${daysLeft < 30 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                        ({daysLeft > 0 ? `${daysLeft} dias restantes` : 'Vencido'})
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-white">
                    {formatBRL(goal.currentAmount)}
                  </span>
                  <span className="text-xs text-slate-450 block font-medium">
                    alvo: {formatBRL(goal.targetAmount)}
                  </span>
                </div>
              </div>

              {/* Progress Level Bar */}
              <div className="mt-3">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: goal.color }}>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <DynamicIcon name="Award" size={12} /> Metas Concluída!
                      </span>
                    ) : (
                      `${percent.toFixed(0)}% Economizado`
                    )}
                  </span>

                  {/* Actions Bar */}
                  {!isActionOpen ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveDepositId(goal.id);
                          setActiveWithdrawId(null);
                        }}
                        className="text-[10px] font-bold text-emerald-450 hover:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-555/20 cursor-pointer"
                      >
                        Depositar
                      </button>
                      {goal.currentAmount > 0 && (
                        <button
                          onClick={() => {
                            setActiveWithdrawId(goal.id);
                            setActiveDepositId(null);
                          }}
                          className="text-[10px] font-bold text-rose-450 hover:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-555/20 cursor-pointer"
                        >
                          Resgatar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-slate-950/70 border border-white/15 p-1 rounded-lg">
                      <input
                        type="number"
                        placeholder="Valor"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="w-14 px-1 bg-slate-900 text-white py-0.5 text-xs border border-white/10 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleTransactionSubmit(goal.id, activeDepositId === goal.id)}
                        className="p-1 px-1.5 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setActiveDepositId(null);
                          setActiveWithdrawId(null);
                          setAmountInput('');
                        }}
                        className="p-1 text-slate-400 hover:bg-white/10 rounded cursor-pointer"
                      >
                        <DynamicIcon name="X" size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="text-center py-6 border-b border-dashed border-white/5 text-slate-500">
            <p className="text-xs font-semibold">Nenhuma meta ativa cadastrada.</p>
            <p className="text-[10px] text-slate-500 mt-1">Crie metas para guardar dinheiro com propósito!</p>
          </div>
        )}
      </div>
    </div>
  );
}
