import React, { useState } from 'react';
import { KanbanCard } from '../types';
import { useToast } from './Toast';
import { DynamicIcon } from './Icons';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectsTabProps {
  cards: KanbanCard[];
  onAddCard: (card: Omit<KanbanCard, 'id'>) => void;
  onMoveCard: (id: string, nextCol: 'todo' | 'inprogress' | 'done') => void;
  onDeleteCard: (id: string) => void;
}

const CARD_CATEGORIES = ['Pessoal', 'Trabalho', 'Projeto Acadêmico', 'Finanças', 'Inovação'];

export default function ProjectsTab({ cards, onAddCard, onMoveCard, onDeleteCard }: ProjectsTabProps) {
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Trabalho');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderActive, setReminderActive] = useState(false);

  const [filterProj, setFilterProj] = useState('all');

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('O título do card é obrigatório!', 'Nome Vazio');
      return;
    }
    onAddCard({
      title: title.trim(),
      description: desc.trim(),
      column: 'todo',
      priority,
      category,
      dueDate: dueDate || undefined,
      reminderTime: reminderTime || undefined,
      reminderActive: reminderActive && !!dueDate && !!reminderTime,
    });
    setTitle('');
    setDesc('');
    setDueDate('');
    setReminderTime('');
    setReminderActive(false);
    setShowAddForm(false);
    toast.success('Card de projeto criado e adicionado à lista A Fazer!', 'Card Criado');
  };

  const handleMove = (id: string, current: 'todo' | 'inprogress' | 'done', direction: 'left' | 'right') => {
    let nextCol: 'todo' | 'inprogress' | 'done';
    if (current === 'todo') {
      nextCol = 'inprogress';
    } else if (current === 'inprogress') {
      nextCol = direction === 'left' ? 'todo' : 'done';
    } else {
      nextCol = 'inprogress';
    }
    onMoveCard(id, nextCol);
    toast.info(`Card movido para "${nextCol === 'todo' ? 'A Fazer' : nextCol === 'inprogress' ? 'Em Progresso' : 'Concluído'}"!`, 'Card Atualizado');
  };

  // Filter cards by category/project
  const filteredCards = cards.filter((c) => filterProj === 'all' || c.category === filterProj);

  const todoCards = filteredCards.filter((c) => c.column === 'todo');
  const inProgressCards = filteredCards.filter((c) => c.column === 'inprogress');
  const doneCards = filteredCards.filter((c) => c.column === 'done');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white">Quadro Kanban de Projetos</h2>
          <p className="text-xs text-slate-400">Gerencie fluxos de trabalho e sprints pessoais ou profissionais</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterProj}
            onChange={(e) => setFilterProj(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Projetos</option>
            {CARD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <DynamicIcon name={showAddForm ? 'X' : 'Plus'} size={14} />
            <span>{showAddForm ? 'Cancelar' : 'Criar Tarefa'}</span>
          </button>
        </div>
      </div>

      {/* Add Form Card */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreateCard}
              className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 space-y-4 max-w-2xl"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Atividade</label>
                <input
                  type="text"
                  placeholder="Ex: Protótipo de telas no Figma..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Projeto / Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {CARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição & Notas</label>
                <textarea
                  placeholder="Explique os requisitos mínimos ou passos para concluir..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prazo de Entrega (Opcional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Horário Alerta</label>
                  <input
                    type="time"
                    value={reminderTime}
                    disabled={!dueDate}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-45"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer h-9 select-none pb-1 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={reminderActive}
                      disabled={!dueDate || !reminderTime}
                      onChange={(e) => setReminderActive(e.target.checked)}
                      className="h-4 w-4 bg-slate-950 border border-white/10 rounded text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                    />
                    <span>Ativar Alerta</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold h-10 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <DynamicIcon name="Plus" size={14} />
                Adicionar no Quadro
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* TO DO COLUMN */}
        <div className="rounded-3xl bg-white/5 border border-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 block" /> A Fazer
            </span>
            <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
              {todoCards.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {todoCards.length === 0 ? (
              <p className="text-center py-10 text-[11px] text-slate-500">Nenhum card nesta etapa.</p>
            ) : (
              todoCards.map((c) => renderCard(c, 'todo'))
            )}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className="rounded-3xl bg-white/5 border border-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 block" /> Em Progresso
            </span>
            <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
              {inProgressCards.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {inProgressCards.length === 0 ? (
              <p className="text-center py-10 text-[11px] text-slate-500">Nenhum card em andamento.</p>
            ) : (
              inProgressCards.map((c) => renderCard(c, 'inprogress'))
            )}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div className="rounded-3xl bg-white/5 border border-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 block" /> Concluído
            </span>
            <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
              {doneCards.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {doneCards.length === 0 ? (
              <p className="text-center py-10 text-[11px] text-slate-500">Nenhuma tarefa concluída ainda.</p>
            ) : (
              doneCards.map((c) => renderCard(c, 'done'))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function renderCard(card: KanbanCard, col: 'todo' | 'inprogress' | 'done') {
    return (
      <div
        key={card.id}
        className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 space-y-3 hover:border-white/10 transition-all shadow-md"
      >
        <div className="flex items-start justify-between gap-1">
          <div>
            <span className="text-[9px] bg-slate-950 border border-white/5 text-indigo-300 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
              {card.category}
            </span>
            <h5 className="text-xs font-extrabold text-white mt-1 leading-snug">{card.title}</h5>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Excluir card de projeto "${card.title}"?`)) {
                onDeleteCard(card.id);
                toast.warning(`Atividade "${card.title}" excluída do quadro.`, 'Quadro Modificado');
              }
            }}
            className="h-6 w-6 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <DynamicIcon name="Trash2" size={11} />
          </button>
        </div>

        {card.description && <p className="text-[11px] text-slate-400 leading-normal font-medium">{card.description}</p>}

        {(card.dueDate || (card.reminderTime && card.reminderActive)) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {card.dueDate && (
              <span className="text-[9px] text-slate-500 flex items-center gap-1 font-medium bg-slate-950/40 px-2 py-0.5 rounded-md border border-white/5">
                <DynamicIcon name="Clock" size={10} />
                Prazo: {card.dueDate}
              </span>
            )}
            {card.reminderTime && card.reminderActive && (
              <span className="text-[9px] text-indigo-400 flex items-center gap-1 font-semibold animate-pulse bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10" title="Lembrete Ativo">
                <DynamicIcon name="Bell" size={10} />
                Alerta: {card.reminderTime}
              </span>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
          {/* Priority flag */}
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              card.priority === 'high'
                ? 'bg-rose-500/15 text-rose-400'
                : card.priority === 'medium'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-slate-500/15 text-slate-400'
            }`}
          >
            {card.priority === 'high' ? 'Alta' : card.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>

          {/* Nav flow buttons */}
          <div className="flex gap-1.5">
            {col !== 'todo' && (
              <button
                onClick={() => handleMove(card.id, col, 'left')}
                className="h-6 w-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded flex items-center justify-center cursor-pointer"
                title="Mover para esquerda"
              >
                <DynamicIcon name="ChevronLeft" size={12} />
              </button>
            )}
            {col !== 'done' && (
              <button
                onClick={() => handleMove(card.id, col, 'right')}
                className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded flex items-center justify-center cursor-pointer"
                title="Mover para direita"
              >
                <DynamicIcon name="ChevronRight" size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
