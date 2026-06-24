import React, { useState } from 'react';
import { Task } from '../types';
import { useGoogleAuth } from './GoogleIntegration';
import { useToast } from './Toast';
import { DynamicIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';

interface TasksTabProps {
  localTasks: Task[];
  onAddLocalTask: (task: Omit<Task, 'id' | 'source'>) => void;
  onToggleLocalTask: (id: string) => void;
  onDeleteLocalTask: (id: string) => void;
}

const TASK_CATEGORIES = ['Pessoal', 'Trabalho', 'Estudos', 'Finanças', 'Saúde', 'Projetos', 'Outros'];

export default function TasksTab({
  localTasks,
  onAddLocalTask,
  onToggleLocalTask,
  onDeleteLocalTask,
}: TasksTabProps) {
  const {
    isConnected,
    googleTasks,
    isLoadingTasks,
    addGoogleTask,
    toggleGoogleTaskState,
    refreshTasks,
    loginWithGoogle,
  } = useGoogleAuth();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'local' | 'google'>('local');

  // Local task form states
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Pessoal');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderActive, setReminderActive] = useState(false);

  // Local task filter states
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Google task form states
  const [googleNewText, setGoogleNewText] = useState('');
  const [googleDueDate, setGoogleDueDate] = useState('');
  const [googleReminderTime, setGoogleReminderTime] = useState('');
  const [googleReminderActive, setGoogleReminderActive] = useState(false);

  const handleAddLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      toast.error('Insira o texto da tarefa!', 'Nome Vazio');
      return;
    }
    onAddLocalTask({
      text: newText.trim(),
      completed: false,
      category,
      priority,
      dueDate: dueDate || undefined,
      reminderTime: reminderTime || undefined,
      reminderActive: reminderActive && !!dueDate && !!reminderTime,
    });
    setNewText('');
    setDueDate('');
    setReminderTime('');
    setReminderActive(false);
    toast.success('Sua nova tarefa local foi registrada!', 'Tarefa Criada');
  };

  const handleAddGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleNewText.trim()) {
      toast.error('O título da tarefa não pode estar vazio!', 'Nome Vazio');
      return;
    }
    await addGoogleTask(
      googleNewText.trim(),
      googleDueDate || undefined,
      googleReminderTime || undefined,
      googleReminderActive && !!googleDueDate && !!googleReminderTime
    );
    setGoogleNewText('');
    setGoogleDueDate('');
    setGoogleReminderTime('');
    setGoogleReminderActive(false);
  };



  // Filter Local Tasks
  const filteredLocalTasks = localTasks.filter((t) => {
    const matchesSearch = t.text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && !t.completed) ||
      (filterStatus === 'completed' && t.completed);

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex border-b border-white/10 p-1 bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('local')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'local'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DynamicIcon name="CheckSquare" size={14} />
          <span>Tarefas Pessoais</span>
          <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-300">
            {localTasks.filter((t) => !t.completed).length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('google')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'google'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DynamicIcon name="Sparkle" size={14} />
          <span>Google Tasks</span>
          {isConnected && (
            <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-300">
              {googleTasks.filter((t) => t.status === 'needsAction').length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Create */}
          <div className="lg:col-span-4 rounded-3xl glass-card border border-white/5 p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DynamicIcon name="PlusCircle" size={16} className="text-indigo-400" />
                Nova Tarefa Local
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Cadastre suas pendências diárias</p>
            </div>

            <form onSubmit={handleAddLocalSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Tarefa</label>
                <input
                  type="text"
                  placeholder="Ex: Revisar relatório de despesas..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Data Limite (Opcional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {dueDate && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Horário Alerta</label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer h-9 select-none pb-1 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={reminderActive}
                        onChange={(e) => setReminderActive(e.target.checked)}
                        disabled={!reminderTime}
                        className="h-4 w-4 bg-slate-900 border border-white/10 rounded text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                      />
                      <span>Ativar Lembrete</span>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <DynamicIcon name="Plus" size={14} /> Adicionar Tarefa
              </button>
            </form>
          </div>

          {/* List Local Tasks */}
          <div className="lg:col-span-8 rounded-3xl glass-card border border-white/5 p-5 space-y-4 shadow-xl">
            {/* Filters bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="relative flex-1">
                <DynamicIcon
                  name="Search"
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Pesquisar tarefas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/40 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-900/40 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="all">Todas Categorias</option>
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-slate-900/40 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="all">Prioridades</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-slate-900/40 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="all">Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="completed">Concluídas</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filteredLocalTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Nenhuma tarefa local encontrada correspondente aos filtros.
                  </div>
                ) : (
                  filteredLocalTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        task.completed
                          ? 'bg-emerald-500/5 border-emerald-500/10'
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => onToggleLocalTask(task.id)}
                          className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            task.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-white/20 hover:border-indigo-500 bg-black/20'
                          }`}
                        >
                          {task.completed && <DynamicIcon name="Check" size={12} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium text-white truncate ${
                              task.completed ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {task.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-slate-900 border border-white/5 text-slate-400 px-1.5 py-0.2 rounded-md font-medium">
                              {task.category}
                            </span>
                            {task.dueDate && (
                              <span className="text-[9px] text-slate-500 flex items-center gap-1 font-medium">
                                <DynamicIcon name="Clock" size={10} />
                                {task.dueDate}
                              </span>
                            )}
                            {task.reminderTime && task.reminderActive && (
                              <span className="text-[9px] text-indigo-400 flex items-center gap-1 font-semibold animate-pulse" title="Lembrete Ativo">
                                <DynamicIcon name="Bell" size={10} />
                                {task.reminderTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-2">
                        {/* Priority indicator */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            task.priority === 'high'
                              ? 'bg-rose-500/15 text-rose-450 border border-rose-500/20'
                              : task.priority === 'medium'
                              ? 'bg-amber-500/15 text-amber-450 border border-amber-500/20'
                              : 'bg-slate-500/15 text-slate-400 border border-slate-500/10'
                          }`}
                        >
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>

                        <button
                          onClick={() => onDeleteLocalTask(task.id)}
                          className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <DynamicIcon name="Trash2" size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'google' && (
        <div className="space-y-6">
          {!isConnected ? (
            <div className="rounded-3xl bg-slate-900/50 border border-white/10 p-8 text-center max-w-2xl mx-auto space-y-4 shadow-2xl">
              <div className="h-14 w-14 bg-indigo-500/15 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                <DynamicIcon name="Sparkles" size={26} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">Integração oficial com Google Tasks</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Sincronize todas as tarefas registradas na sua conta oficial Google. Visualize, adicione, conclua ou atualize em tempo real, inclusive integrando de volta ao seu telefone.
                </p>
              </div>
              <button
                onClick={loginWithGoogle}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold h-11 px-6 rounded-xl flex items-center justify-center gap-2.5 mx-auto transition-all shadow-lg cursor-pointer"
              >
                <DynamicIcon name="Key" size={14} />
                Conectar com Google Tasks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Create Google Task */}
              <div className="lg:col-span-4 rounded-3xl glass-card border border-white/5 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <DynamicIcon name="PlusCircle" size={16} className="text-indigo-400" />
                      Nova Google Task
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-0.5">Sincroniza imediatamente na nuvem</p>
                  </div>
                  <button
                    onClick={refreshTasks}
                    disabled={isLoadingTasks}
                    className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 flex items-center justify-center transition-colors cursor-pointer"
                    title="Recarregar"
                  >
                    <DynamicIcon name="RefreshCw" size={11} className={isLoadingTasks ? 'animate-spin' : ''} />
                  </button>
                </div>

                <form onSubmit={handleAddGoogleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição da Tarefa</label>
                    <input
                      type="text"
                      placeholder="Comprar mantimentos para casa..."
                      value={googleNewText}
                      onChange={(e) => setGoogleNewText(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Prazo Final</label>
                      <input
                        type="date"
                        value={googleDueDate}
                        onChange={(e) => setGoogleDueDate(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Horário Alerta</label>
                      <input
                        type="time"
                        value={googleReminderTime}
                        onChange={(e) => setGoogleReminderTime(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      id="googleReminderActive"
                      checked={googleReminderActive}
                      onChange={(e) => setGoogleReminderActive(e.target.checked)}
                      className="h-4 w-4 text-indigo-500 focus:ring-0 rounded bg-slate-900 border-white/10 cursor-pointer"
                    />
                    <label htmlFor="googleReminderActive" className="text-[10px] text-slate-300 font-medium cursor-pointer select-none">
                      Ativar Alerta Dinâmico 🔔
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <DynamicIcon name="UploadCloud" size={14} /> Sincronizar Nova Tarefa
                  </button>
                </form>
              </div>

              {/* List Google Tasks */}
              <div className="lg:col-span-8 rounded-3xl glass-card border border-white/5 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Lista Oficial de Tarefas (Padrão)</span>
                  {isLoadingTasks && (
                    <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                      <DynamicIcon name="RefreshCw" size={10} className="animate-spin" />
                      Baixando do Google...
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {googleTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      {isLoadingTasks ? 'Buscando suas tarefas no Google...' : 'Nenhuma tarefa ativa cadastrada no seu Google Tasks.'}
                    </div>
                  ) : (
                    googleTasks.map((task) => {
                      const isComp = task.status === 'completed';
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isComp ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleGoogleTaskState(task.id, !isComp)}
                              className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                isComp
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-white/20 hover:border-indigo-500 bg-black/20'
                              }`}
                            >
                              {isComp && <DynamicIcon name="Check" size={12} />}
                            </button>
                            <div>
                              <p className={`text-xs font-medium text-white ${isComp ? 'line-through text-slate-500' : ''}`}>
                                {task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                {task.due && (
                                  <span className="text-[9px] text-slate-500 flex items-center gap-1">
                                    <DynamicIcon name="Calendar" size={10} />
                                    Vence em: {new Date(task.due).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                                {task.reminderActive && (
                                  <span className="text-[9px] text-amber-400 flex items-center gap-1 font-mono font-bold animate-pulse">
                                    <DynamicIcon name="Bell" size={10} />
                                    Alerta: {task.reminderTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
