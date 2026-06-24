import React, { useState, useEffect, useMemo } from 'react';
import { WorkJob, Transaction } from '../types';
import { useToast } from './Toast';
import { DynamicIcon } from './Icons';

interface WorkTabProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const WEEKDAYS = [
  { value: 0, name: 'Dom', fullName: 'Domingo' },
  { value: 1, name: 'Seg', fullName: 'Segunda-feira' },
  { value: 2, name: 'Ter', fullName: 'Terça-feira' },
  { value: 3, name: 'Qua', fullName: 'Quarta-feira' },
  { value: 4, name: 'Qui', fullName: 'Quinta-feira' },
  { value: 5, name: 'Sex', fullName: 'Sexta-feira' },
  { value: 6, name: 'Sáb', fullName: 'Sábado' },
];

const MONTHS = [
  { value: '01', name: 'Janeiro' },
  { value: '02', name: 'Fevereiro' },
  { value: '03', name: 'Março' },
  { value: '04', name: 'Abril' },
  { value: '05', name: 'Maio' },
  { value: '06', name: 'Junho' },
  { value: '07', name: 'Julho' },
  { value: '08', name: 'Agosto' },
  { value: '09', name: 'Setembro' },
  { value: '10', name: 'Outubro' },
  { value: '11', name: 'Novembro' },
  { value: '12', name: 'Dezembro' },
];

export default function WorkTab({ transactions, onAddTransaction, onDeleteTransaction }: WorkTabProps) {
  const { toast } = useToast();

  // Load Work Jobs
  const [jobs, setJobs] = useState<WorkJob[]>(() => {
    const saved = localStorage.getItem('personal_work_jobs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'wj-garcom',
        name: 'Garçom (Freelance)',
        type: 'freelance',
        rate: 150,
        scheduleDays: [5, 6], // Sexta, Sábado
        workedDates: [],
        monthlyPaidMonths: [],
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Save jobs on modification
  useEffect(() => {
    localStorage.setItem('personal_work_jobs', JSON.stringify(jobs));
  }, [jobs]);

  // Form states
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState<'freelance' | 'monthly'>('freelance');
  const [jobRate, setJobRate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<number[]>([1, 2, 3, 4, 5]); // Default Seg-Sex

  // Current selected week pivot (defaults to today)
  const [weekPivot, setWeekPivot] = useState(new Date());

  // Generate date array for the selected week pivot
  const currentWeekDays = useMemo(() => {
    const today = new Date(weekPivot);
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon ...
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOfWeek + i);
      week.push(d);
    }
    return week;
  }, [weekPivot]);

  // Helper date formatters
  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleToggleScheduleDay = (dayVal: number) => {
    setSelectedSchedule(prev => 
      prev.includes(dayVal) ? prev.filter(d => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(jobRate);

    if (!jobName.trim()) {
      toast.error('Informe um nome para o seu trabalho.', 'Campo Requerido');
      return;
    }
    if (isNaN(rateVal) || rateVal <= 0) {
      toast.error('Informe um valor de diária ou salário mensal válido.', 'Valor Inválido');
      return;
    }

    const newJob: WorkJob = {
      id: 'wj_' + Math.random().toString(36).substring(2, 9),
      name: jobName.trim(),
      type: jobType,
      rate: rateVal,
      scheduleDays: jobType === 'freelance' ? selectedSchedule : [],
      workedDates: [],
      monthlyPaidMonths: [],
      createdAt: new Date().toISOString()
    };

    setJobs(prev => [...prev, newJob]);
    setJobName('');
    setJobRate('');
    setSelectedSchedule([1, 2, 3, 4, 5]);
    toast.success(`Trabalho "${newJob.name}" cadastrado com sucesso!`, 'Trabalho Criado');
  };

  const handleDeleteJob = (jobId: string, name: string) => {
    // Also remove any linked income transactions to avoid phantom balances
    const targetJob = jobs.find(j => j.id === jobId);
    if (targetJob) {
      targetJob.workedDates.forEach(date => {
        onDeleteTransaction(`work_income_${jobId}_${date}`);
      });
      targetJob.monthlyPaidMonths.forEach(month => {
        onDeleteTransaction(`work_income_${jobId}_${month}`);
      });
    }

    setJobs(prev => prev.filter(j => j.id !== jobId));
    toast.info(`Trabalho "${name}" e todos os seus registros de ganhos vinculados foram removidos.`, 'Trabalho Excluído');
  };

  // Toggle Freelance Work Day
  const handleToggleDayWorked = (job: WorkJob, date: Date) => {
    const dateStr = formatDateStr(date);
    const hasWorked = job.workedDates.includes(dateStr);
    const dayIndex = date.getDay();
    const dayName = WEEKDAYS.find(w => w.value === dayIndex)?.fullName || '';

    let updatedWorkedDates = [...job.workedDates];

    if (hasWorked) {
      // Remove workday
      updatedWorkedDates = updatedWorkedDates.filter(d => d !== dateStr);
      // Remove income transaction
      onDeleteTransaction(`work_income_${job.id}_${dateStr}`);
      toast.warning(`Registro do dia ${date.toLocaleDateString('pt-BR')} removido. Saldo reduzido em R$ ${job.rate}.`, 'Falta Registrada');
    } else {
      // Add workday
      updatedWorkedDates.push(dateStr);
      // Create income transaction
      const newTx: Transaction = {
        id: `work_income_${job.id}_${dateStr}`,
        description: `Diária: ${job.name} (${dayName})`,
        amount: job.rate,
        type: 'income',
        category: 'Trabalho',
        date: dateStr,
        notes: `Gerado automaticamente via painel de Controle de Trabalho.`
      };
      onAddTransaction(newTx);
      toast.success(`Trabalho registrado em ${date.toLocaleDateString('pt-BR')}! R$ ${job.rate} adicionados ao seu saldo.`, 'Renda Adicionada');
    }

    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, workedDates: updatedWorkedDates } : j));
  };

  // Toggle Monthly Month Worked/Paid
  const handleToggleMonthPaid = (job: WorkJob, monthStr: string, monthName: string) => {
    const isPaid = job.monthlyPaidMonths.includes(monthStr);
    let updatedMonths = [...job.monthlyPaidMonths];

    if (isPaid) {
      updatedMonths = updatedMonths.filter(m => m !== monthStr);
      onDeleteTransaction(`work_income_${job.id}_${monthStr}`);
      toast.warning(`Salário do mês de ${monthName} removido. Saldo reduzido em R$ ${job.rate}.`, 'Salário Removido');
    } else {
      updatedMonths.push(monthStr);
      const today = new Date();
      const dateStr = `${monthStr}-${String(today.getDate()).padStart(2, '0')}`;
      const newTx: Transaction = {
        id: `work_income_${job.id}_${monthStr}`,
        description: `Salário Mensal: ${job.name} (${monthName})`,
        amount: job.rate,
        type: 'income',
        category: 'Trabalho',
        date: dateStr,
        notes: `Rendimento mensal gerado automaticamente pelo painel de Trabalho.`
      };
      onAddTransaction(newTx);
      toast.success(`Salário de ${monthName} recebido! R$ ${job.rate} adicionados ao seu saldo.`, 'Renda Mensal Recebida');
    }

    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, monthlyPaidMonths: updatedMonths } : j));
  };

  // Move weeks
  const handlePrevWeek = () => {
    const next = new Date(weekPivot);
    next.setDate(weekPivot.getDate() - 7);
    setWeekPivot(next);
  };

  const handleNextWeek = () => {
    const next = new Date(weekPivot);
    next.setDate(weekPivot.getDate() + 7);
    setWeekPivot(next);
  };

  const handleTodayWeek = () => {
    setWeekPivot(new Date());
  };

  // Format current week range for display
  const weekRangeText = useMemo(() => {
    const first = currentWeekDays[0];
    const last = currentWeekDays[6];
    return `Semana de ${first.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${last.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  }, [currentWeekDays]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 p-6 rounded-3xl">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <DynamicIcon name="Briefcase" className="text-emerald-400" size={22} />
            Controle de Trabalho, Freelance & Renda Extra
          </h2>
          <p className="text-xs text-slate-400">
            Cadastre seus freelances diários ou trabalhos mensais, planeje seu cronograma e adicione ganhos ao seu saldo com um único clique.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-950/40 border border-white/5 px-3 py-1.5 rounded-xl text-slate-300 font-semibold shrink-0">
          Total de Trabalhos Ativos: <span className="text-emerald-400 font-extrabold ml-1">{jobs.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Register New Work Card */}
        <div className="lg:col-span-5 rounded-3xl border border-white/5 bg-slate-900/40 p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DynamicIcon name="Plus" size={16} className="text-emerald-400" />
              Cadastrar Novo Trabalho / Renda
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Adicione sua atividade freelance ou emprego regular</p>
          </div>

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Cargo ou Serviço</label>
              <input
                type="text"
                placeholder="Ex: Garçom, Freelance Web, Professor Particular"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Remuneração</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as 'freelance' | 'monthly')}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="freelance">💵 Freelance / Diária</option>
                  <option value="monthly">📅 Mensal / Salário</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {jobType === 'freelance' ? 'Valor da Diária (R$)' : 'Salário Mensal (R$)'}
                </label>
                <input
                  type="number"
                  placeholder="Ex: 150"
                  value={jobRate}
                  onChange={(e) => setJobRate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Weekday Selector (only for freelance) */}
            {jobType === 'freelance' && (
              <div className="space-y-2 bg-slate-950/45 p-3.5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Dias Previstos na Semana (Sugestão de Agenda)
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {WEEKDAYS.map((day) => {
                    const isSelected = selectedSchedule.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleToggleScheduleDay(day.value)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-900 text-slate-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              <DynamicIcon name="Plus" size={14} /> Cadastrar Trabalho e Iniciar
            </button>
          </form>
        </div>

        {/* Right Column: Weekly Grid/Scheduler and Monthly List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Week Selector Bar */}
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-white/5">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors cursor-pointer"
              title="Semana Anterior"
            >
              <DynamicIcon name="ChevronRight" size={16} className="rotate-180" />
            </button>
            <div className="text-center">
              <span className="text-xs font-black text-white block">{weekRangeText}</span>
              <button
                onClick={handleTodayWeek}
                className="text-[9px] text-emerald-400 hover:underline font-bold uppercase mt-0.5"
              >
                Ir para Semana Atual
              </button>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors cursor-pointer"
              title="Próxima Semana"
            >
              <DynamicIcon name="ChevronRight" size={16} />
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/30 border border-white/5 p-12 text-center text-slate-500 text-xs">
              Nenhum trabalho cadastrado. Use o formulário à esquerda para registrar seu primeiro freelance! 💼
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-3xl border border-white/5 bg-slate-900/40 p-5 sm:p-6 shadow-xl relative group transition-all hover:border-white/10"
                >
                  {/* Job delete button */}
                  <button
                    onClick={() => handleDeleteJob(job.id, job.name)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Excluir Trabalho"
                  >
                    <DynamicIcon name="Trash2" size={14} />
                  </button>

                  <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <DynamicIcon name="Briefcase" size={14} />
                        </span>
                        {job.name}
                      </h4>
                      <p className="text-[10px] text-slate-450 mt-1 uppercase font-extrabold tracking-wider">
                        Tipo:{' '}
                        <span className="text-indigo-400">
                          {job.type === 'freelance' ? 'Freelance / Diária' : 'Trabalho Fixo / Mensal'}
                        </span>
                      </p>
                    </div>

                    <div className="text-right pr-6 sm:pr-8">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Remuneração</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        R$ {job.rate.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-500 font-medium">
                          {job.type === 'freelance' ? '/diária' : '/mês'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* FREELANCE DAILY TRACKER WEEK GRID */}
                  {job.type === 'freelance' ? (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                        Clique nos dias trabalhados nesta semana para registrar ganhos:
                      </span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                        {currentWeekDays.map((date) => {
                          const dateStr = formatDateStr(date);
                          const dayVal = date.getDay();
                          const isSuggested = job.scheduleDays.includes(dayVal);
                          const isWorked = job.workedDates.includes(dateStr);
                          const dayName = WEEKDAYS.find(w => w.value === dayVal)?.name || '';

                          return (
                            <button
                              key={dateStr}
                              onClick={() => handleToggleDayWorked(job, date)}
                              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[75px] cursor-pointer group/btn ${
                                isWorked
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/10 scale-105'
                                  : isSuggested
                                  ? 'bg-slate-900/60 border-indigo-500/20 text-slate-200 hover:border-indigo-400/40'
                                  : 'bg-slate-900/20 border-white/5 text-slate-450 hover:border-white/15'
                              }`}
                            >
                              <span className={`text-[10px] font-extrabold uppercase tracking-wide ${
                                isWorked ? 'text-slate-950' : 'text-slate-450'
                              }`}>
                                {dayName}
                              </span>
                              <span className={`text-xs font-bold font-mono mt-1 ${
                                isWorked ? 'text-slate-950' : 'text-slate-200'
                              }`}>
                                {date.getDate()}
                              </span>
                              
                              <div className="mt-1.5">
                                {isWorked ? (
                                  <span className="text-[9px] font-extrabold uppercase bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded-md">
                                    +R$ {job.rate}
                                  </span>
                                ) : isSuggested ? (
                                  <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest block group-hover/btn:hidden">
                                    Escala
                                  </span>
                                ) : null}
                                <span className={`text-[8px] font-bold uppercase hidden group-hover/btn:inline-block ${
                                  isWorked ? 'text-slate-950' : 'text-emerald-400'
                                }`}>
                                  {isWorked ? 'Desmarcar' : 'Trabalhei'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* MONTHLY INCOME CHECKBOX LIST */
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                        Registrar recebimento mensal para este ano:
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {MONTHS.map((m) => {
                          const year = weekPivot.getFullYear();
                          const monthStr = `${year}-${m.value}`;
                          const isPaid = job.monthlyPaidMonths.includes(monthStr);

                          return (
                            <button
                              key={monthStr}
                              onClick={() => handleToggleMonthPaid(job, monthStr, m.name)}
                              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[65px] cursor-pointer group/btn ${
                                isPaid
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/10'
                                  : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/15'
                              }`}
                            >
                              <span className={`text-[10px] font-bold uppercase ${
                                isPaid ? 'text-slate-950' : 'text-slate-450'
                              }`}>
                                {m.name}
                              </span>
                              <span className={`text-[9px] font-bold font-mono mt-1 ${
                                isPaid ? 'text-slate-950' : 'text-slate-400'
                              }`}>
                                {year}
                              </span>

                              <div className="mt-1">
                                {isPaid ? (
                                  <span className="text-[8px] font-black uppercase bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded-md">
                                    Pago!
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider block group-hover/btn:inline-block">
                                    Receber
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

