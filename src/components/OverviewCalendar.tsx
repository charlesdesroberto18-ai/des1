import React, { useState } from 'react';
import { CalendarEvent, useGoogleAuth } from './GoogleIntegration';
import { Task, KanbanCard, Project, Medication, Consultation, Transaction } from '../types';
import { DynamicIcon } from './Icons';
import { useToast } from './Toast';

interface OverviewCalendarProps {
  calendarEvents: CalendarEvent[];
  localTasks: Task[];
  kanbanCards?: KanbanCard[];
  projects?: Project[];
  medications?: Medication[];
  consultations?: Consultation[];
  onAddLocalTask?: (task: Omit<Task, 'id' | 'source'>) => void;
  transactions?: Transaction[];
  onAddTransaction?: (newT: Omit<Transaction, 'id'>) => void;
}

export default function OverviewCalendar({
  calendarEvents,
  localTasks,
  kanbanCards = [],
  projects = [],
  medications = [],
  consultations = [],
  onAddLocalTask,
  transactions = [],
  onAddTransaction
}: OverviewCalendarProps) {
  const { isConnected, addGoogleCalendarEvent } = useGoogleAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Drawer states
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'event' | 'task' | 'transaction'>('event');

  // Form states for scheduling
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('Trabalho');
  const [newTaskReminderTime, setNewTaskReminderTime] = useState('09:00');
  const [newTaskReminderActive, setNewTaskReminderActive] = useState(false);

  const [newTxDescription, setNewTxDescription] = useState('');
  const [newTxType, setNewTxType] = useState<'income' | 'expense'>('expense');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxCategory, setNewTxCategory] = useState('Alimentação');
  const [newTxNotes, setNewTxNotes] = useState('');

  const [newEvtSummary, setNewEvtSummary] = useState('');
  const [newEvtLocation, setNewEvtLocation] = useState('');
  const [newEvtDescription, setNewEvtDescription] = useState('');
  const [newEvtStartTime, setNewEvtStartTime] = useState('');
  const [newEvtEndTime, setNewEvtEndTime] = useState('');
  const [newEvtUseReminder, setNewEvtUseReminder] = useState(true);
  const [newEvtReminderMinutes, setNewEvtReminderMinutes] = useState(30);
  const [isSchedulingEvent, setIsSchedulingEvent] = useState(false);

  // Modal Event form state
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventSummary, setEventSummary] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventUseReminder, setEventUseReminder] = useState(true);
  const [eventReminderMinutes, setEventReminderMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim() || !eventStartDate || !eventEndDate) return;

    setIsSubmitting(true);
    try {
      await addGoogleCalendarEvent(
        eventSummary,
        eventStartDate,
        eventEndDate,
        eventLocation || undefined,
        eventDescription || undefined,
        eventUseReminder,
        Number(eventReminderMinutes)
      );
      // Reset form & close
      setEventSummary('');
      setEventStartDate('');
      setEventEndDate('');
      setEventLocation('');
      setEventDescription('');
      setEventUseReminder(true);
      setEventReminderMinutes(30);
      setShowAddEventModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCellClick = (dateString: string) => {
    setSelectedDateStr(dateString);
    setIsDrawerOpen(true);
    
    // Set default times for future events on that date
    setNewEvtStartTime(`${dateString}T10:00`);
    setNewEvtEndTime(`${dateString}T11:00`);
    setNewEvtSummary('');
    setNewEvtLocation('');
    setNewEvtDescription('');
    
    // Reset other form fields
    setNewTaskTitle('');
    setNewTxDescription('');
    setNewTxAmount('');
    setNewTxNotes('');
  };

  const handleDrawerCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvtSummary.trim() || !newEvtStartTime || !newEvtEndTime) {
      toast.error('Preencha os campos obrigatórios do evento.', 'Campos Requeridos');
      return;
    }
    setIsSchedulingEvent(true);
    try {
      await addGoogleCalendarEvent(
        newEvtSummary.trim(),
        newEvtStartTime,
        newEvtEndTime,
        newEvtLocation || undefined,
        newEvtDescription || undefined,
        newEvtUseReminder,
        Number(newEvtReminderMinutes)
      );
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSchedulingEvent(false);
    }
  };

  const handleDrawerCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedDateStr) {
      toast.error('O título da tarefa é obrigatório.', 'Erro de Validação');
      return;
    }
    if (!onAddLocalTask) {
      toast.error('Erro de configuração: o gerenciador de tarefas não está disponível.', 'Erro');
      return;
    }

    onAddLocalTask({
      text: newTaskTitle.trim(),
      completed: false,
      category: newTaskCategory,
      priority: newTaskPriority,
      dueDate: selectedDateStr,
      reminderTime: newTaskReminderActive ? newTaskReminderTime : undefined,
      reminderActive: newTaskReminderActive,
      reminderTriggered: false
    });

    toast.success(`Tarefa "${newTaskTitle}" agendada com sucesso!`, 'Tarefa Criada');
    setNewTaskTitle('');
    setIsDrawerOpen(false);
  };

  const handleDrawerCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newTxAmount);
    if (!newTxDescription.trim() || isNaN(amountNum) || amountNum <= 0 || !selectedDateStr) {
      toast.error('Descrição válida e valor maior que zero são obrigatórios.', 'Erro de Validação');
      return;
    }
    if (!onAddTransaction) {
      toast.error('Erro de configuração: o controle financeiro não está disponível.', 'Erro');
      return;
    }

    onAddTransaction({
      description: newTxDescription.trim(),
      amount: amountNum,
      type: newTxType,
      category: newTxCategory,
      date: selectedDateStr,
      notes: newTxNotes.trim() || undefined
    });

    toast.success(`Transação de R$ ${amountNum.toFixed(2)} cadastrada com sucesso!`, 'Finanças Atualizadas');
    setNewTxDescription('');
    setNewTxAmount('');
    setNewTxNotes('');
    setIsDrawerOpen(false);
  };

  const formatSelectedDateFull = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get total days in the current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Get total days in the previous month (for filling the grid)
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Month names
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Days of the week header
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate day cells
  const dayCells: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

  // Fill in previous month's days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const prevMonthDate = new Date(year, month - 1, prevDay);
    const dateString = prevMonthDate.toISOString().split('T')[0];
    dayCells.push({ day: prevDay, isCurrentMonth: false, dateString });
  }

  // Fill in current month's days
  for (let i = 1; i <= totalDays; i++) {
    // adjust timezone to local date string representation
    const localDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    dayCells.push({ day: i, isCurrentMonth: true, dateString: localDateString });
  }

  // Fill in next month's days to make grid a multiple of 7
  const totalCells = Math.ceil(dayCells.length / 7) * 7;
  const nextMonthFill = totalCells - dayCells.length;
  for (let i = 1; i <= nextMonthFill; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const dateString = nextMonthDate.toISOString().split('T')[0];
    dayCells.push({ day: i, isCurrentMonth: false, dateString });
  }

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  // Find events for a specific date
  const getEventsAndTasksForDate = (dateString: string) => {
    const dayEvents = calendarEvents.filter((evt) => {
      const evtDate = evt.start?.dateTime || evt.start?.date || '';
      return evtDate.startsWith(dateString);
    });

    const dayTasks = localTasks.filter((task) => {
      return !task.completed && task.dueDate === dateString;
    });

    const dayCards = kanbanCards.filter((card) => {
      return card.column !== 'done' && card.dueDate === dateString;
    });

    const dayAlerts: { title: string; projName: string }[] = [];
    projects.forEach((proj) => {
      proj.alerts?.forEach((alert) => {
        if (alert.date === dateString) {
          dayAlerts.push({ title: alert.title, projName: proj.name });
        }
      });
    });

    const dayMeds = medications.filter((med) => {
      return med.startDate === dateString;
    });

    const dayConsultations = consultations.filter((cons) => {
      return cons.date === dateString;
    });

    return {
      events: dayEvents,
      tasks: dayTasks,
      cards: dayCards,
      alerts: dayAlerts,
      meds: dayMeds,
      consultations: dayConsultations
    };
  };

  return (
    <div className="rounded-3xl glass-card border border-white/5 p-6 shadow-xl space-y-4 bg-slate-900/40">
      {/* Calendar Header Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
            <DynamicIcon name="Calendar" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Calendário Mensal Completo</h3>
            <p className="text-[11px] text-slate-400">Compromissos sincronizados e tarefas prioritárias do seu dia</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {isConnected && (
            <button
              onClick={() => {
                // Pre-populate times
                const now = new Date();
                const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
                // format YYYY-MM-DDTHH:MM
                const pad = (n: number) => String(n).padStart(2, '0');
                const formatDT = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                setEventStartDate(formatDT(now));
                setEventEndDate(formatDT(inOneHour));
                setShowAddEventModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow"
            >
              <DynamicIcon name="Plus" size={13} />
              Criar Compromisso
            </button>
          )}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Hoje
          </button>
          <div className="flex items-center bg-slate-950/40 border border-white/5 rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Mês Anterior"
            >
              <DynamicIcon name="ChevronLeft" size={16} />
            </button>
            <span className="text-xs font-extrabold text-white px-3 min-w-[110px] text-center font-mono font-sans">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Próximo Mês"
            >
              <DynamicIcon name="ChevronRight" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Days of week */}
        <div className="grid grid-cols-7 text-center">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-[10px] font-extrabold text-slate-500 uppercase py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {dayCells.map((cell, idx) => {
            const isToday = cell.dateString === todayStr;
            const { events, tasks, cards, alerts, meds, consultations: dayConsultations } = getEventsAndTasksForDate(cell.dateString);
            
            const totalCount = events.length + tasks.length + cards.length + alerts.length + meds.length + dayConsultations.length;
            const hasItems = totalCount > 0;

            // Gather all items as tiny display logs
            const displayItems: { text: string; classes: string; key: string }[] = [];
            events.forEach((e, i) => displayItems.push({ text: e.summary || '', classes: 'bg-amber-500/10 text-amber-300 border-amber-500/10', key: `e-${i}` }));
            tasks.forEach((t, i) => displayItems.push({ text: t.text, classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/10', key: `t-${i}` }));
            cards.forEach((c, i) => displayItems.push({ text: `📋 ${c.title}`, classes: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/10', key: `c-${i}` }));
            alerts.forEach((a, i) => displayItems.push({ text: `🔔 [${a.projName}] ${a.title}`, classes: 'bg-rose-500/10 text-rose-300 border-rose-500/10', key: `a-${i}` }));
            meds.forEach((m, i) => displayItems.push({ text: `💊 ${m.name} (${m.time})`, classes: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/10', key: `m-${i}` }));
            dayConsultations.forEach((c, i) => displayItems.push({ text: `🩺 Consulta: ${c.doctor}`, classes: 'bg-purple-500/10 text-purple-300 border-purple-500/10', key: `cs-${i}` }));

            const isSelected = cell.dateString === selectedDateStr;

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell.dateString)}
                className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border flex flex-col justify-between transition-all relative cursor-pointer ${
                  cell.isCurrentMonth
                    ? 'bg-white/[0.02] border-white/5'
                    : 'bg-black/15 border-transparent text-slate-600'
                } ${
                  isToday 
                    ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20' 
                    : isSelected
                      ? 'border-indigo-400 bg-indigo-400/10 ring-2 ring-indigo-400/30'
                      : 'hover:border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {cell.day}
                  </span>
                  
                  {hasItems && (
                    <div className="flex flex-wrap gap-1 max-w-[40px] justify-end">
                      {events.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 block" title="Compromisso Google" />}
                      {tasks.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 block" title="Tarefa Local" />}
                      {cards.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 block" title="Card Kanban" />}
                      {alerts.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 block" title="Alerta de Projeto" />}
                      {meds.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 block" title="Medicamento Agendado" />}
                      {dayConsultations.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 block" title="Consulta Médica" />}
                    </div>
                  )}
                </div>

                {/* Day events visual overview */}
                <div className="mt-1.5 space-y-1 overflow-hidden select-none pointer-events-none flex-1">
                  {displayItems.slice(0, 3).map((item) => (
                    <div key={item.key} className={`text-[8px] px-1 py-0.5 rounded leading-tight truncate border font-medium ${item.classes}`}>
                      {item.text}
                    </div>
                  ))}
                  {displayItems.length > 3 && (
                    <div className="text-[7px] text-slate-500 font-extrabold pl-1">
                      +{displayItems.length - 3} mais...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-[10px] text-slate-500 font-bold pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 block" />
            <span>Eventos Google</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 block" />
            <span>Tarefas Locais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400 block" />
            <span>Projetos Kanban</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400 block" />
            <span>Alertas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 block" />
            <span>Remédios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400 block" />
            <span>Consultas</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-lg border border-indigo-500 bg-indigo-500/5 block" />
          <span>Hoje</span>
        </div>
      </div>

      {/* Google Calendar Event Creator Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <DynamicIcon name="Calendar" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Criar Evento no Google Calendar</h3>
                  <p className="text-[10px] text-slate-400">Sincronização bidirecional e alertas instantâneos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-450 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <DynamicIcon name="X" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Título do Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião de Planejamento de Metas"
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Início</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Término</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Localização (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Google Meet, Escritório, Sala 1"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Descrição / Notas (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais sobre o compromisso..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Reminders section with custom popup minutes */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-200">Lembrete Notificação Popup</p>
                    <p className="text-[9px] text-slate-500">Enviar alerta sonoro/visual antes do evento</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEventUseReminder(!eventUseReminder)}
                    className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      eventUseReminder ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        eventUseReminder ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {eventUseReminder && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-[9px] font-extrabold text-slate-450 uppercase font-sans">Antecedência:</span>
                    <select
                      value={eventReminderMinutes}
                      onChange={(e) => setEventReminderMinutes(Number(e.target.value))}
                      className="bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none"
                    >
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={120}>2 horas</option>
                      <option value={1440}>1 dia</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <DynamicIcon name="Check" size={13} />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side Panel Drawer (Aba Lateral) */}
      {isDrawerOpen && selectedDateStr && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="w-full max-w-md h-full bg-slate-900 border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                      selectedDateStr < todayStr 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                    }`}>
                      {selectedDateStr < todayStr ? 'Histórico Passado' : 'Planejamento Futuro'}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      {selectedDateStr.split('-').reverse().join('/')}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white capitalize leading-snug">
                    {formatSelectedDateFull(selectedDateStr)}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-450 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <DynamicIcon name="X" size={18} />
                </button>
              </div>

              {/* PAST DATE RESUMO */}
              {selectedDateStr < todayStr ? (
                <div className="space-y-6 pt-2">
                  {/* Financial Balance Summary for that Day */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <DynamicIcon name="DollarSign" size={13} className="text-emerald-400" />
                      Fluxo Financeiro do Dia
                    </h4>
                    
                    {/* Tiny summary metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/40 border border-white/5 p-3 rounded-2xl">
                      <div className="text-center space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Entradas</span>
                        <p className="text-[11px] font-bold font-mono text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            (transactions || [])
                              .filter((t) => t.date === selectedDateStr && (t.type === 'income' || t.type === 'additional'))
                              .reduce((sum, t) => sum + t.amount, 0)
                          )}
                        </p>
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Saídas</span>
                        <p className="text-[11px] font-bold font-mono text-rose-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            (transactions || [])
                              .filter((t) => t.date === selectedDateStr && t.type === 'expense')
                              .reduce((sum, t) => sum + t.amount, 0)
                          )}
                        </p>
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Saldo Diário</span>
                        {(() => {
                          const income = (transactions || [])
                            .filter((t) => t.date === selectedDateStr && (t.type === 'income' || t.type === 'additional'))
                            .reduce((sum, t) => sum + t.amount, 0);
                          const expense = (transactions || [])
                            .filter((t) => t.date === selectedDateStr && t.type === 'expense')
                            .reduce((sum, t) => sum + t.amount, 0);
                          const balance = income - expense;
                          return (
                            <p className={`text-[11px] font-bold font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Detailed transaction list */}
                    {(() => {
                      const dayTxs = (transactions || []).filter((t) => t.date === selectedDateStr);
                      if (dayTxs.length === 0) {
                        return <p className="text-[10px] text-slate-500 italic pl-1">Sem transações registradas nesta data.</p>;
                      }
                      return (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {dayTxs.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px]">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-200">{tx.description}</p>
                                <span className="text-[9px] text-slate-500 font-bold">{tx.category}</span>
                              </div>
                              <span className={`font-mono font-bold ${tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {tx.type === 'expense' ? '-' : '+'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Tasks & Google Events on Past Date */}
                  <div className="space-y-4">
                    {/* Google Events */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <DynamicIcon name="Calendar" size={13} className="text-indigo-400" />
                        Compromissos Agendados
                      </h4>
                      {(() => {
                        const dayEvts = calendarEvents.filter((evt) => {
                          const evtDate = evt.start?.dateTime || evt.start?.date || '';
                          return evtDate.startsWith(selectedDateStr);
                        });
                        if (dayEvts.length === 0) {
                          return <p className="text-[10px] text-slate-500 italic pl-1">Nenhum compromisso corporativo agendado.</p>;
                        }
                        return (
                          <div className="space-y-1.5">
                            {dayEvts.map((evt, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] space-y-1">
                                <p className="font-bold text-amber-300">{evt.summary || 'Sem Título'}</p>
                                {evt.location && <p className="text-[9px] text-slate-400 flex items-center gap-1"><DynamicIcon name="MapPin" size={10} /> {evt.location}</p>}
                                <p className="text-[9px] text-slate-400 font-mono">
                                  {evt.start?.dateTime 
                                    ? new Date(evt.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                                    : 'Dia Todo'}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Local Tasks */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <DynamicIcon name="CheckSquare" size={13} className="text-emerald-400" />
                        Tarefas do Dia
                      </h4>
                      {(() => {
                        const dayTasks = localTasks.filter((t) => t.dueDate === selectedDateStr);
                        if (dayTasks.length === 0) {
                          return <p className="text-[10px] text-slate-500 italic pl-1">Nenhuma tarefa registrada para este dia.</p>;
                        }
                        return (
                          <div className="space-y-1.5">
                            {dayTasks.map((task) => (
                              <div key={task.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                                  <span className={task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-bold'}>{task.text}</span>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${task.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                  {task.completed ? 'Concluída' : 'Pendente'}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                /* FUTURE OR TODAY DATE: SCHEDULE OPTIONS */
                <div className="space-y-6 pt-2">
                  {/* List of already scheduled events for today/future so they can see availability */}
                  {(() => {
                    const { events: dayEvts, tasks: dayTasks } = getEventsAndTasksForDate(selectedDateStr);
                    const totalScheduled = dayEvts.length + dayTasks.length;
                    if (totalScheduled > 0) {
                      return (
                        <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                          <p className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                            <DynamicIcon name="Info" size={12} />
                            Compromissos já agendados para este dia ({totalScheduled})
                          </p>
                          <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                            {dayEvts.map((e, i) => (
                              <div key={`e-${i}`} className="text-[10px] text-slate-300 truncate">
                                📅 <span className="font-bold text-slate-200">{e.summary}</span>
                              </div>
                            ))}
                            {dayTasks.map((t, i) => (
                              <div key={`t-${i}`} className="text-[10px] text-slate-300 truncate">
                                ✔ <span className="text-slate-300">{t.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Scheduling Forms Form Tab bar */}
                  <div className="space-y-4">
                    <div className="flex border-b border-white/5">
                      <button
                        onClick={() => setDrawerTab('event')}
                        className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer text-center ${
                          drawerTab === 'event' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-450 hover:text-slate-300'
                        }`}
                      >
                        Compromisso
                      </button>
                      <button
                        onClick={() => setDrawerTab('task')}
                        className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer text-center ${
                          drawerTab === 'task' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-450 hover:text-slate-300'
                        }`}
                      >
                        Tarefa
                      </button>
                      <button
                        onClick={() => setDrawerTab('transaction')}
                        className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer text-center ${
                          drawerTab === 'transaction' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-450 hover:text-slate-300'
                        }`}
                      >
                        Finanças
                      </button>
                    </div>

                    {/* Tab 1: Google Calendar Event scheduling */}
                    {drawerTab === 'event' && (
                      <form onSubmit={handleDrawerCreateEvent} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Título do Evento</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Reunião de Planejamento de Metas"
                            value={newEvtSummary}
                            onChange={(e) => setNewEvtSummary(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Início</label>
                            <input
                              type="datetime-local"
                              required
                              value={newEvtStartTime}
                              onChange={(e) => setNewEvtStartTime(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Término</label>
                            <input
                              type="datetime-local"
                              required
                              value={newEvtEndTime}
                              onChange={(e) => setNewEvtEndTime(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Localização (Opcional)</label>
                          <input
                            type="text"
                            placeholder="Ex: Google Meet, Escritório, Sala 1"
                            value={newEvtLocation}
                            onChange={(e) => setNewEvtLocation(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Descrição / Notas (Opcional)</label>
                          <textarea
                            rows={2}
                            placeholder="Informações adicionais sobre o compromisso..."
                            value={newEvtDescription}
                            onChange={(e) => setNewEvtDescription(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                          />
                        </div>

                        {/* Reminders section with custom popup minutes */}
                        <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-200">Lembrete Notificação Popup</p>
                              <p className="text-[8px] text-slate-500">Enviar alerta visual antes do evento</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewEvtUseReminder(!newEvtUseReminder)}
                              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                newEvtUseReminder ? 'bg-indigo-500' : 'bg-slate-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  newEvtUseReminder ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {newEvtUseReminder && (
                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                              <span className="text-[9px] font-extrabold text-slate-450 uppercase font-sans">Antecedência:</span>
                              <select
                                value={newEvtReminderMinutes}
                                onChange={(e) => setNewEvtReminderMinutes(Number(e.target.value))}
                                className="bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none"
                              >
                                <option value={5}>5 minutos</option>
                                <option value={10}>10 minutos</option>
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={60}>1 hora</option>
                                <option value={120}>2 horas</option>
                                <option value={1440}>1 dia</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSchedulingEvent}
                          className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          {isSchedulingEvent ? (
                            <>
                              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                              Sincronizando com o Google...
                            </>
                          ) : (
                            <>
                              <DynamicIcon name="Calendar" size={13} />
                              Sincronizar no Google Calendar
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Tab 2: Local Task scheduling */}
                    {drawerTab === 'task' && (
                      <form onSubmit={handleDrawerCreateTask} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Título da Tarefa</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Revisar planilha de orçamento"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Categoria</label>
                            <select
                              value={newTaskCategory}
                              onChange={(e) => setNewTaskCategory(e.target.value)}
                              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            >
                              <option value="Trabalho">Trabalho</option>
                              <option value="Pessoal">Pessoal</option>
                              <option value="Finanças">Finanças</option>
                              <option value="Saúde">Saúde</option>
                              <option value="Estudos">Estudos</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Prioridade</label>
                            <select
                              value={newTaskPriority}
                              onChange={(e) => setNewTaskPriority(e.target.value as any)}
                              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            >
                              <option value="low">Baixa</option>
                              <option value="medium">Média</option>
                              <option value="high">Alta</option>
                            </select>
                          </div>
                        </div>

                        {/* Reminder toggler */}
                        <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-200">Definir Lembrete de Alarme</p>
                              <p className="text-[8px] text-slate-500">Notificar com alarme sonoro na data</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewTaskReminderActive(!newTaskReminderActive)}
                              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                newTaskReminderActive ? 'bg-indigo-500' : 'bg-slate-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  newTaskReminderActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {newTaskReminderActive && (
                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                              <span className="text-[9px] font-extrabold text-slate-450 uppercase font-sans">Hora do Alarme:</span>
                              <input
                                type="time"
                                required
                                value={newTaskReminderTime}
                                onChange={(e) => setNewTaskReminderTime(e.target.value)}
                                className="bg-slate-900 border border-white/5 rounded-lg px-2 py-0.5 text-xs text-slate-300 font-mono focus:outline-none"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          <DynamicIcon name="Check" size={13} />
                          Agendar Tarefa Local
                        </button>
                      </form>
                    )}

                    {/* Tab 3: Financial Transaction scheduling */}
                    {drawerTab === 'transaction' && (
                      <form onSubmit={handleDrawerCreateTransaction} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Descrição</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Supermercado, Recebimento Freela"
                            value={newTxDescription}
                            onChange={(e) => setNewTxDescription(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Tipo</label>
                            <select
                              value={newTxType}
                              onChange={(e) => setNewTxType(e.target.value as any)}
                              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            >
                              <option value="expense">Despesa (Gasto)</option>
                              <option value="income">Receita (Ganho)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Valor (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              placeholder="0,00"
                              value={newTxAmount}
                              onChange={(e) => setNewTxAmount(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Categoria</label>
                          <select
                            value={newTxCategory}
                            onChange={(e) => setNewTxCategory(e.target.value)}
                            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                          >
                            <option value="Alimentação">Alimentação</option>
                            <option value="Moradia">Moradia</option>
                            <option value="Transporte">Transporte</option>
                            <option value="Salário">Salário</option>
                            <option value="Lazer">Lazer</option>
                            <option value="Estudos">Estudos</option>
                            <option value="Investimentos">Investimentos</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Notas (Opcional)</label>
                          <textarea
                            rows={2}
                            placeholder="Adicione observações sobre esta movimentação financeira..."
                            value={newTxNotes}
                            onChange={(e) => setNewTxNotes(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          <DynamicIcon name="DollarSign" size={13} />
                          Salvar Movimentação Financeira
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer indicator */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-6">
              <span>Sincronização Ativa</span>
              <span className="text-indigo-400">Dashboard v3.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
