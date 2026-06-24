import React, { useState } from 'react';
import { CalendarEvent } from './GoogleIntegration';
import { Task, KanbanCard, Project, Medication, Consultation } from '../types';
import { DynamicIcon } from './Icons';

interface OverviewCalendarProps {
  calendarEvents: CalendarEvent[];
  localTasks: Task[];
  kanbanCards?: KanbanCard[];
  projects?: Project[];
  medications?: Medication[];
  consultations?: Consultation[];
  onAddLocalTask?: (task: Omit<Task, 'id' | 'source'>) => void;
}

export default function OverviewCalendar({
  calendarEvents,
  localTasks,
  kanbanCards = [],
  projects = [],
  medications = [],
  consultations = [],
  onAddLocalTask
}: OverviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

        <div className="flex items-center gap-2 self-end sm:self-auto">
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
            <span className="text-xs font-extrabold text-white px-3 min-w-[110px] text-center font-mono">
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

            return (
              <div
                key={idx}
                className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border flex flex-col justify-between transition-all relative ${
                  cell.isCurrentMonth
                    ? 'bg-white/[0.02] border-white/5'
                    : 'bg-black/15 border-transparent text-slate-600'
                } ${
                  isToday 
                    ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20' 
                    : 'hover:border-white/10'
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
    </div>
  );
}
