import React, { useState } from 'react';
import { SavingsGoal, LifeGoal } from '../types';
import SavingsGoalList from './SavingsGoalList';
import { useToast } from './Toast';
import { DynamicIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';

interface GoalsTabProps {
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (newGoal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateSavingsGoalProgress: (id: string, amountChange: number) => void;
  onDeleteSavingsGoal: (id: string) => void;

  lifeGoals: LifeGoal[];
  onAddLifeGoal: (goal: Omit<LifeGoal, 'id'>) => void;
  onUpdateLifeGoalSteps: (id: string, completedSteps: number) => void;
  onDeleteLifeGoal: (id: string) => void;
}

const LIFE_GOAL_CATEGORIES = ['Carreira', 'Estudos', 'Saúde & Fitness', 'Hobbies', 'Relacionamento', 'Outros'];

export default function GoalsTab({
  savingsGoals,
  onAddSavingsGoal,
  onUpdateSavingsGoalProgress,
  onDeleteSavingsGoal,

  lifeGoals,
  onAddLifeGoal,
  onUpdateLifeGoalSteps,
  onDeleteLifeGoal,
}: GoalsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'savings' | 'life'>('savings');
  const { toast } = useToast();

  // Life Goal form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Estudos');
  const [targetDate, setTargetDate] = useState('');
  const [totalSteps, setTotalSteps] = useState('5');
  const [notes, setNotes] = useState('');

  const handleAddLifeGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome da meta de vida!', 'Meta Sem Nome');
      return;
    }
    const steps = parseInt(totalSteps);
    if (isNaN(steps) || steps <= 0) {
      toast.error('O número de etapas/marcos deve ser maior que zero!', 'Etapas Inválidas');
      return;
    }
    if (!targetDate) {
      toast.error('Escolha um prazo/data limite para a meta!', 'Data Não Selecionada');
      return;
    }

    onAddLifeGoal({
      name: name.trim(),
      category,
      targetDate,
      completedSteps: 0,
      totalSteps: steps,
      notes: notes.trim() || undefined,
    });

    setName('');
    setNotes('');
    setTotalSteps('5');
    setShowAddForm(false);
    toast.success(`Meta "${name}" foi cadastrada com sucesso!`, 'Meta Planejada');
  };

  const handleStepChange = (id: string, current: number, total: number, increment: boolean) => {
    let nextVal = increment ? current + 1 : current - 1;
    if (nextVal < 0) nextVal = 0;
    if (nextVal > total) nextVal = total;
    onUpdateLifeGoalSteps(id, nextVal);

    if (nextVal === total) {
      toast.success('Parabéns! Você alcançou 100% desta meta de vida!', 'Objetivo Concluído 🎉');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex border-b border-white/10 p-1 bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('savings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'savings'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DynamicIcon name="PiggyBank" size={14} />
          <span>Poupança e Finanças</span>
        </button>
        <button
          onClick={() => setActiveSubTab('life')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'life'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DynamicIcon name="Target" size={14} />
          <span>Metas de Desenvolvimento</span>
        </button>
      </div>

      {activeSubTab === 'savings' && (
        <div className="animate-fade-in">
          <SavingsGoalList
            goals={savingsGoals}
            onAddGoal={onAddSavingsGoal}
            onUpdateGoalProgress={onUpdateSavingsGoalProgress}
            onDeleteGoal={onDeleteSavingsGoal}
          />
        </div>
      )}

      {activeSubTab === 'life' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-white">Metas Pessoais e Profissionais</h2>
              <p className="text-xs text-slate-400">Gerencie marcos de progresso das suas aspirações de vida</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <DynamicIcon name={showAddForm ? 'X' : 'Plus'} size={14} />
              <span>{showAddForm ? 'Fechar Form' : 'Nova Meta de Vida'}</span>
            </button>
          </div>

          {/* Add Life Goal Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleAddLifeGoalSubmit}
                  className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 space-y-4 max-w-3xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Meta de Vida</label>
                      <input
                        type="text"
                        placeholder="Ex: Concluir curso de React Native..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {LIFE_GOAL_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Data Limite</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Total de Marcos/Etapas</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 5"
                        value={totalSteps}
                        onChange={(e) => setTotalSteps(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Notas & Detalhes (Opcional)</label>
                    <textarea
                      placeholder="Marcos: 1. Terminar Intro, 2. Criar app piloto, 3. Deploy na AppStore..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold h-10 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <DynamicIcon name="Target" size={14} />
                    Salvar Planejamento
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Life Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {lifeGoals.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                  Você ainda não cadastrou nenhuma meta de desenvolvimento de vida. Cadastre uma no botão acima!
                </div>
              ) : (
                lifeGoals.map((g) => {
                  const progressPct = g.totalSteps > 0 ? (g.completedSteps / g.totalSteps) * 100 : 0;
                  const isDone = g.completedSteps === g.totalSteps;
                  const daysLeft = Math.round((new Date(g.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <motion.div
                      key={g.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="rounded-3xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between shadow-xl relative"
                    >
                      <div className="space-y-3">
                        {/* Title and Category */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded-full font-bold">
                              {g.category}
                            </span>
                            <h4 className={`text-sm font-bold text-white mt-1.5 leading-snug ${isDone ? 'line-through text-slate-400' : ''}`}>
                              {g.name}
                            </h4>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir a meta de vida "${g.name}"?`)) {
                                onDeleteLifeGoal(g.id);
                                toast.warning(`Meta "${g.name}" foi removida.`, 'Meta Excluída');
                              }
                            }}
                            className="h-6 w-6 rounded-lg text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <DynamicIcon name="Trash2" size={12} />
                          </button>
                        </div>

                        {/* Notes */}
                        {g.notes && (
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium bg-black/10 p-2.5 rounded-xl border border-white/5">
                            {g.notes}
                          </p>
                        )}
                      </div>

                      {/* Progress and control bar */}
                      <div className="space-y-3 mt-4 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-slate-400">Progresso marcos:</span>
                          <span className="font-mono font-bold text-indigo-300">
                            {g.completedSteps}/{g.totalSteps} ({progressPct.toFixed(0)}%)
                          </span>
                        </div>

                        {/* Visual Progress bar */}
                        <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isDone ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        {/* Date and step controls */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                            <DynamicIcon name="Calendar" size={11} />
                            {g.targetDate} ({daysLeft > 0 ? `${daysLeft}d restantes` : 'Vencido'})
                          </span>

                          <div className="flex gap-1.5">
                            <button
                              disabled={g.completedSteps === 0}
                              onClick={() => handleStepChange(g.id, g.completedSteps, g.totalSteps, false)}
                              className="h-6 w-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <DynamicIcon name="Minus" size={10} />
                            </button>
                            <button
                              disabled={isDone}
                              onClick={() => handleStepChange(g.id, g.completedSteps, g.totalSteps, true)}
                              className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <DynamicIcon name="Plus" size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
