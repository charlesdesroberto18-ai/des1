import React, { useState, useEffect, useMemo } from 'react';
import { HealthLog, Medication, Consultation, Habit } from '../types';
import { useToast } from './Toast';
import { 
  Activity, 
  Droplet, 
  Trash2, 
  Plus, 
  Clock, 
  Calendar, 
  PlusCircle, 
  CheckCircle, 
  Circle, 
  Heart, 
  Sparkles,
  RefreshCw,
  Stethoscope,
  Bell,
  CheckSquare
} from 'lucide-react';

interface HealthTabProps {
  healthLog: HealthLog;
  onUpdateHealth: (updater: Partial<HealthLog>) => void;
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  consultations: Consultation[];
  setConsultations: React.Dispatch<React.SetStateAction<Consultation[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

interface ActivityLog {
  id: string;
  type: string;
  distance: number; // km
  duration: number; // min
  timestamp: string;
}

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function HealthTab({
  healthLog,
  onUpdateHealth,
  medications,
  setMedications,
  consultations,
  setConsultations,
  habits,
  setHabits
}: HealthTabProps) {
  const { toast } = useToast();

  const WATER_TARGET_ML = 3000;

  // Toggle states for collapsible forms
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [isAddingConsultation, setIsAddingConsultation] = useState(false);
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  // 1. Core States
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('personal_activities_log');
    return saved ? JSON.parse(saved) : [
      { id: 'act1', type: 'Caminhada', distance: 2.5, duration: 30, timestamp: new Date().toISOString() }
    ];
  });

  // Form inputs states
  const [activityType, setActivityType] = useState('Caminhada');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  // Medication form
  const [medName, setMedName] = useState('');
  const [medDescription, setMedDescription] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [medStartDate, setMedStartDate] = useState('');
  const [medTimesPerDay, setMedTimesPerDay] = useState('1');
  const [medTotalDoses, setMedTotalDoses] = useState('30');

  // Consultation form
  const [consDoctor, setConsDoctor] = useState('');
  const [consSpecialty, setConsSpecialty] = useState('');
  const [consDate, setConsDate] = useState('');
  const [consTime, setConsTime] = useState('');
  const [consNotes, setConsNotes] = useState('');

  // Custom habit form
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'outdoor' | 'exercise' | 'weekly_walk' | 'health'>('outdoor');
  const [newHabitTargetWeeks, setNewHabitTargetWeeks] = useState('1');

  // Sync activities to localStorage
  useEffect(() => {
    localStorage.setItem('personal_activities_log', JSON.stringify(activities));
  }, [activities]);

  // 2. Calculations
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);

  const isWaterCompleted = healthLog.waterIntake >= WATER_TARGET_ML;

  // Next consultation finder
  const upcomingConsultation = useMemo(() => {
    const active = consultations.filter(c => !c.isPast);
    if (active.length === 0) return null;
    return active.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];
  }, [consultations]);

  // Medications running low alarm
  const medicationsRunningOut = useMemo(() => {
    return medications.filter(m => m.remainingDoses <= 5);
  }, [medications]);

  // Priority notifications computed list
  const priorityNotifications = useMemo(() => {
    const list: { id: string; title: string; desc: string; type: 'med' | 'cons'; priority: 'high' | 'warning' }[] = [];
    
    medicationsRunningOut.forEach(med => {
      list.push({
        id: `med-alert-${med.id}`,
        title: `Medicamento acabando: ${med.name}`,
        desc: `Restam apenas ${med.remainingDoses} doses de um total de ${med.totalDoses}. Providencie a compra!`,
        type: 'med',
        priority: med.remainingDoses <= 2 ? 'high' : 'warning'
      });
    });

    if (upcomingConsultation) {
      const consDateTime = new Date(`${upcomingConsultation.date}T${upcomingConsultation.time}`);
      const today = new Date();
      const diffMs = consDateTime.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        list.push({
          id: `cons-alert-${upcomingConsultation.id}`,
          title: `Consulta de Alta Prioridade chegando`,
          desc: `Sua consulta de ${upcomingConsultation.specialty} com ${upcomingConsultation.doctor} é dia ${new Date(upcomingConsultation.date).toLocaleDateString('pt-BR')} às ${upcomingConsultation.time}.`,
          type: 'cons',
          priority: diffDays <= 1 ? 'high' : 'warning'
        });
      }
    }

    return list;
  }, [medicationsRunningOut, upcomingConsultation]);

  // 3. Handlers
  const handleToggleWater = () => {
    if (isWaterCompleted) {
      onUpdateHealth({ waterIntake: 0 });
      toast.warning('Meta de hidratação diária reiniciada.', 'Água Pendente');
    } else {
      onUpdateHealth({ waterIntake: WATER_TARGET_ML });
      toast.success('Parabéns! Você completou sua meta de 3 Litros hoje! 💧', 'Hidratação Concluída');
    }
  };

  const handleIncrementWater = (amount: number) => {
    const newAmount = Math.min(6000, healthLog.waterIntake + amount);
    onUpdateHealth({ waterIntake: newAmount });
    if (newAmount >= WATER_TARGET_ML && healthLog.waterIntake < WATER_TARGET_ML) {
      toast.success('Fantástico! A meta diária de 3L de água foi batida! 💧', 'Hidratação Concluída');
    } else {
      toast.info(`Adicionado +${amount}ml de água. Total atual: ${newAmount}ml`, 'Água Registrada');
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const distVal = parseFloat(distance);
    const durVal = parseFloat(duration);

    if (isNaN(distVal) || distVal <= 0) {
      toast.error('Por favor, informe uma distância em km válida!', 'Distância Inválida');
      return;
    }
    if (isNaN(durVal) || durVal <= 0) {
      toast.error('Por favor, informe uma duração em minutos válida!', 'Tempo Inválido');
      return;
    }

    const newActivity: ActivityLog = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      type: activityType,
      distance: distVal,
      duration: durVal,
      timestamp: new Date().toISOString()
    };

    setActivities((prev) => [newActivity, ...prev]);
    setDistance('');
    setDuration('');
    toast.success(`Atividade "${activityType}" de ${distVal}km registrada no histórico!`, 'Atividade Adicionada');
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    toast.info('Atividade física removida do histórico.', 'Registro Excluído');
  };

  // Medication helpers
  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      toast.error('O nome do medicamento é obrigatório!', 'Erro');
      return;
    }
    const times = parseInt(medTimesPerDay);
    const total = parseInt(medTotalDoses);
    if (isNaN(times) || times <= 0 || isNaN(total) || total <= 0) {
      toast.error('Valores de frequência ou total de doses são inválidos.', 'Erro');
      return;
    }

    const newMed: Medication = {
      id: 'med_' + Math.random().toString(36).substring(2, 9),
      name: medName.trim(),
      description: medDescription.trim() || undefined,
      time: medTime,
      timesPerDay: times,
      remainingDoses: total,
      totalDoses: total,
      startDate: medStartDate || undefined
    };

    setMedications(prev => [...prev, newMed]);
    setMedName('');
    setMedDescription('');
    setMedStartDate('');
    setIsAddingMedication(false);
    toast.success(`Medicação "${newMed.name}" adicionada com lembrete às ${newMed.time}!`, 'Lembrete Criado');
  };

  const handleTakeDose = (id: string) => {
    setMedications(prev => prev.map(m => {
      if (m.id === id) {
        const remaining = Math.max(0, m.remainingDoses - 1);
        if (remaining === 0) {
          toast.error(`Atenção: O medicamento ${m.name} acabou de vez!`, 'Medicação Zerada');
        } else if (remaining <= 5) {
          toast.warning(`Aviso urgente: Restam apenas ${remaining} doses do medicamento ${m.name}!`, 'Prioridade Alerta');
        } else {
          toast.success(`Dose de "${m.name}" tomada com sucesso!`, 'Dose Registrada');
        }
        return { ...m, remainingDoses: remaining };
      }
      return m;
    }));
  };

  const handleDeleteMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    toast.info('Medicação removida com sucesso.', 'Removido');
  };

  // Consultation helpers
  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consDoctor.trim() || !consSpecialty.trim() || !consDate || !consTime) {
      toast.error('Preencha médico, especialidade, data e horário!', 'Erro');
      return;
    }

    const newCons: Consultation = {
      id: 'cons_' + Math.random().toString(36).substring(2, 9),
      doctor: consDoctor.trim(),
      specialty: consSpecialty.trim(),
      date: consDate,
      time: consTime,
      notes: consNotes.trim() || undefined,
      isPast: false
    };

    setConsultations(prev => [newCons, ...prev]);
    setConsDoctor('');
    setConsSpecialty('');
    setConsDate('');
    setConsTime('');
    setConsNotes('');
    setIsAddingConsultation(false);
    toast.success(`Consulta com ${newCons.doctor} agendada para ${new Date(newCons.date).toLocaleDateString('pt-BR')}!`, 'Consulta Agendada');
  };

  const handleCompleteConsultation = (id: string) => {
    setConsultations(prev => prev.map(c => {
      if (c.id === id) {
        toast.success(`Consulta com ${c.doctor} marcada como concluída e arquivada!`, 'Consulta Arquivada');
        return { ...c, isPast: true };
      }
      return c;
    }));
  };

  const handleDeleteConsultation = (id: string) => {
    setConsultations(prev => prev.filter(c => c.id !== id));
    toast.info('Consulta excluída com sucesso.', 'Excluída');
  };

  // Habits helpers
  const handleToggleHabitDay = (habitId: string, dayIdx: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newDays = [...h.completedDays];
        newDays[dayIdx] = !newDays[dayIdx];
        
        // If they completed all 7 days, let's offer to increment week streak
        const allCompleted = newDays.every(d => d);
        if (allCompleted) {
          toast.success(`Sensacional! Você completou todos os dias desta semana para o hábito "${h.name}"! 🌟`, 'Meta Curta Concluída');
        }

        return { ...h, completedDays: newDays };
      }
      return h;
    }));
  };

  const handleResetHabitWeek = (habitId: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const completedThisWeek = h.completedDays.every(d => d);
        const newStreak = completedThisWeek ? h.streakWeeks + 1 : h.streakWeeks;
        toast.info(`Hábito "${h.name}" reiniciado para nova semana de controle.`, 'Nova Semana');
        return {
          ...h,
          completedDays: Array(7).fill(false),
          streakWeeks: newStreak
        };
      }
      return h;
    }));
  };

  const handleCreateCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) {
      toast.error('Digite o nome do seu hábito.', 'Erro');
      return;
    }
    const targetW = parseInt(newHabitTargetWeeks);

    const newHabit: Habit = {
      id: 'habit_' + Math.random().toString(36).substring(2, 9),
      name: newHabitName.trim(),
      type: newHabitType,
      completedDays: Array(7).fill(false),
      targetWeeks: targetW,
      streakWeeks: 0
    };

    setHabits(prev => [...prev, newHabit]);
    setNewHabitName('');
    setIsAddingHabit(false);
    toast.success(`Hábito de meta curta de ${targetW} semana(s) criado com sucesso!`, 'Hábito Cadastrado');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Heart className="text-emerald-400 fill-emerald-400" size={16} />
            Saúde, Hábitos e Medicina Pessoal
          </h2>
          <p className="text-xs text-slate-400 font-medium">Gerencie medicações, consultas, metas de hidratação e monitore seus hábitos de saúde de forma simplificada.</p>
        </div>
      </div>

      {/* Priority Notifications (Notification of Priority) */}
      {priorityNotifications.length > 0 && (
        <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 space-y-2.5 shadow-lg shadow-rose-950/10 animate-pulse">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <Bell size={14} />
            Alertas de Prioridade Máxima
          </div>
          <div className="space-y-2">
            {priorityNotifications.map(notif => (
              <div key={notif.id} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="text-rose-400 font-extrabold mt-0.5">•</span>
                <div>
                  <strong className="text-white block font-semibold">{notif.title}</strong>
                  <span className="text-[11px] text-slate-350">{notif.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Hidratação Água */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider block">Meta de Água</span>
              <h3 className="text-lg font-extrabold text-white font-mono">
                {isWaterCompleted ? 'Meta Concluída! 💧' : 'Pendente'}
                <span className="text-xs text-slate-500 font-medium block mt-0.5">{healthLog.waterIntake}ml de 3.000ml</span>
              </h3>
            </div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow transition-all ${
              isWaterCompleted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/10 text-indigo-450'
            }`}>
              <Droplet size={18} className={isWaterCompleted ? 'fill-emerald-400' : ''} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 justify-between">
            <div className="flex-1 relative h-2 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (healthLog.waterIntake / WATER_TARGET_ML) * 100)}%` }} 
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleIncrementWater(250)}
                className="px-2 py-1 text-[9px] font-extrabold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                +250ml
              </button>
              <button
                onClick={() => handleIncrementWater(500)}
                className="px-2 py-1 text-[9px] font-extrabold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                +500ml
              </button>
              <button
                onClick={handleToggleWater}
                className="px-2 py-1 text-[9px] font-extrabold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                {isWaterCompleted ? 'Reset' : 'Full'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Exercício Acumulado */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider block">Exercício Acumulado</span>
              <h3 className="text-lg font-extrabold text-white font-mono">
                {totalDistance.toFixed(1)} km
                <span className="text-xs text-slate-500 font-medium block mt-0.5">Duração: {totalDuration} minutos hoje</span>
              </h3>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shadow">
              <Activity size={18} />
            </div>
          </div>
          
          <div className="mt-4 text-[9px] text-slate-500 font-semibold flex items-center justify-between">
            <span>Sessões registradas: {activities.length}</span>
            <span className="text-emerald-400">Atividades físicas ativas</span>
          </div>
        </div>

        {/* Card 3: Próxima Consulta */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider block">Próxima Consulta</span>
              {upcomingConsultation ? (
                <div>
                  <h3 className="text-xs font-bold text-white truncate max-w-[180px]">{upcomingConsultation.doctor}</h3>
                  <span className="text-[10px] text-amber-400 font-mono block mt-0.5">
                    {new Date(upcomingConsultation.date).toLocaleDateString('pt-BR')} às {upcomingConsultation.time}
                  </span>
                </div>
              ) : (
                <h3 className="text-xs text-slate-500 font-semibold block mt-1">Nenhuma agendada</h3>
              )}
            </div>
            <div className="h-10 w-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shadow">
              <Stethoscope size={18} />
            </div>
          </div>
          
          <div className="mt-4 text-[9px] text-slate-500 font-semibold">
            {upcomingConsultation ? (
              <span className="text-amber-400 truncate block">Especialidade: {upcomingConsultation.specialty}</span>
            ) : (
              <span>Lembrete de consultas ativo</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION A: MEDICAÇÕES EM USO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${isAddingMedication ? 'lg:col-span-8' : 'lg:col-span-12'} rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-4 shadow-xl transition-all`}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Clock className="text-indigo-400" size={13} />
                Lembrete de Medicações Ativas
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Registre os horários e doses restantes para receber notificações automáticas antes de acabar.</p>
            </div>
            <button
              onClick={() => setIsAddingMedication(!isAddingMedication)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shadow"
            >
              <Plus size={11} />
              {isAddingMedication ? 'Fechar' : 'Adicionar'}
            </button>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAddingMedication ? '' : 'lg:grid-cols-3'} gap-4`}>
            {medications.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-8 text-slate-500 text-xs">
                Nenhum medicamento adicionado no momento. Use o botão "Adicionar" para cadastrar.
              </div>
            ) : (
              medications.map(med => {
                const isLow = med.remainingDoses <= 5;
                const isCritical = med.remainingDoses <= 2;
                return (
                  <div key={med.id} className={`rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 bg-white/[0.01] ${
                    isCritical ? 'border-rose-500/35 shadow shadow-rose-950/15' : isLow ? 'border-amber-500/30' : 'border-white/5'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          {med.name}
                          {isLow && (
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              Acabando
                            </span>
                          )}
                        </h4>
                        {med.description && (
                          <p className="text-[10px] text-slate-400 italic leading-tight">{med.description}</p>
                        )}
                        <p className="text-[10px] text-slate-455 mt-1 flex items-center gap-1 font-semibold">
                          <Clock size={10} />
                          {med.time} ({med.timesPerDay}x ao dia)
                        </p>
                        {med.startDate && (
                          <span className="text-[9px] text-indigo-400 font-bold block mt-1">📅 Início: {new Date(med.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-white/5 text-[10px]">
                      <div>
                        <span className="text-slate-400 font-medium block">Doses Restantes</span>
                        <strong className={`font-mono text-xs ${isCritical ? 'text-rose-400 font-black' : isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                          {med.remainingDoses} de {med.totalDoses}
                        </strong>
                      </div>
                      <button
                        onClick={() => handleTakeDose(med.id)}
                        disabled={med.remainingDoses === 0}
                        className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg transition-colors cursor-pointer ${
                          med.remainingDoses === 0 
                            ? 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        }`}
                      >
                        Tomar Dose
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Medication Add Form */}
        {isAddingMedication && (
          <div className="lg:col-span-4 rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Adicionar Medicamento</h4>
            <form onSubmit={handleAddMedication} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nome da Medicação</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paracetamol, Pantoprazol..."
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Descrição/Dosagem</label>
                <input
                  type="text"
                  placeholder="Ex: Tomar com água, 500mg..."
                  value={medDescription}
                  onChange={e => setMedDescription(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Data de Início (Opcional)</label>
                <input
                  type="date"
                  value={medStartDate}
                  onChange={e => setMedStartDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Horário</label>
                  <input
                    type="time"
                    required
                    value={medTime}
                    onChange={e => setMedTime(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Frequência/Dia</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={medTimesPerDay}
                    onChange={e => setMedTimesPerDay(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Total Doses</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={medTotalDoses}
                  onChange={e => setMedTotalDoses(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <PlusCircle size={13} /> Cadastrar Medicação
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECTION B: CONSULTAS & HISTÓRICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consultation Agenda */}
        <div className={`${isAddingConsultation ? 'lg:col-span-8' : 'lg:col-span-12'} rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-4 shadow-xl transition-all`}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Stethoscope className="text-amber-500" size={13} />
                Histórico & Agenda de Consultas
              </h3>
              <p className="text-[10px] text-slate-455 mt-0.5">Gerencie os próximos agendamentos médicos e mantenha o histórico de check-ups passados.</p>
            </div>
            <button
              onClick={() => setIsAddingConsultation(!isAddingConsultation)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shadow"
            >
              <Plus size={11} />
              {isAddingConsultation ? 'Fechar' : 'Agendar'}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Próximos Agendamentos (Lembretes)</h4>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isAddingConsultation ? '' : 'lg:grid-cols-3'} gap-4`}>
              {consultations.filter(c => !c.isPast).length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-6 text-slate-500 text-xs">
                  Nenhuma consulta agendada. Clique no botão "Agendar" para registrar.
                </div>
              ) : (
                consultations.filter(c => !c.isPast).map(c => {
                  const consDateVal = new Date(c.date);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const isSoon = consDateVal.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000;
                  return (
                    <div key={c.id} className={`rounded-xl p-4 bg-white/[0.01] border flex flex-col justify-between space-y-3 ${
                      isSoon ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-white/5'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-extrabold uppercase">{c.specialty}</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-300 font-bold px-1.5 py-0.5 rounded-md uppercase">
                            Próxima
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-white">{c.doctor}</h5>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Calendar size={10} />
                          {new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {c.time}
                        </p>
                        {c.notes && (
                          <p className="text-[10px] italic text-slate-505 mt-1">Obs: {c.notes}</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/5">
                        <button
                          onClick={() => handleDeleteConsultation(c.id)}
                          className="text-slate-500 hover:text-rose-400 text-[10px] font-semibold"
                        >
                          Remover
                        </button>
                        <button
                          onClick={() => handleCompleteConsultation(c.id)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                        >
                          <CheckCircle size={11} /> Concluir Consulta
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider pt-2 border-t border-white/5">Histórico de Consultas Anteriores</h4>
            <div className={`grid grid-cols-1 ${isAddingConsultation ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-3 max-h-[220px] overflow-y-auto pr-1`}>
              {consultations.filter(c => c.isPast).length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs col-span-full">
                  Sem consultas passadas registradas no histórico.
                </div>
              ) : (
                consultations.filter(c => c.isPast).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{c.doctor} <span className="text-[10px] font-normal text-slate-500 block">({c.specialty})</span></h5>
                        <span className="text-[9px] text-slate-500 font-mono">Concluída em {new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteConsultation(c.id)}
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Consultation form */}
        {isAddingConsultation && (
          <div className="lg:col-span-4 rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Agendar Consulta</h4>
            <form onSubmit={handleAddConsultation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nome do Médico</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Carlos..."
                  value={consDoctor}
                  onChange={e => setConsDoctor(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Especialidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cardiologia, Oftalmo..."
                  value={consSpecialty}
                  onChange={e => setConsSpecialty(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Data</label>
                  <input
                    type="date"
                    required
                    value={consDate}
                    onChange={e => setConsDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Horário</label>
                  <input
                    type="time"
                    required
                    value={consTime}
                    onChange={e => setConsTime(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Notas/Recomendações</label>
                <textarea
                  placeholder="Ex: Ir em jejum de 8h..."
                  value={consNotes}
                  onChange={e => setConsNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-2 rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <Calendar size={13} /> Agendar Lembrete
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECTION C: HÁBITOS & METAS DE SEMANAS CURTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${isAddingHabit ? 'lg:col-span-8' : 'lg:col-span-12'} rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-5 shadow-xl transition-all`}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <CheckSquare className="text-indigo-400" size={13} />
                Controle de Hábitos Semanais (Metas Curtas)
              </h3>
              <p className="text-[10px] text-slate-455 mt-0.5">Configure hábitos diários para a semana e controle sua consistência. Comece com metas curtas de 1 a 2 semanas.</p>
            </div>
            <button
              onClick={() => setIsAddingHabit(!isAddingHabit)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shadow"
            >
              <Plus size={11} />
              {isAddingHabit ? 'Fechar' : 'Criar Hábito'}
            </button>
          </div>

          <div className={`grid grid-cols-1 ${isAddingHabit ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {habits.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs col-span-full">
                Nenhum hábito cadastrado. Clique em "Criar Hábito" para configurar sua primeira meta curta.
              </div>
            ) : (
              habits.map(habit => {
                const completedCount = habit.completedDays.filter(Boolean).length;
                const percent = Math.round((completedCount / 7) * 100);
                return (
                  <div key={habit.id} className="rounded-xl p-4 bg-white/[0.01] border border-white/5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                          <span className="capitalize text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md">
                            {habit.type === 'outdoor' ? 'Ar Livre' : habit.type === 'weekly_walk' ? 'Caminhada' : habit.type === 'water' ? 'Água' : 'Exercício'}
                          </span>
                          {habit.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Meta curta: <strong className="text-slate-300 font-semibold">{habit.targetWeeks} sem.</strong> | Streak: <strong className="text-emerald-400 font-semibold">{habit.streakWeeks} sem.</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-white bg-slate-950/60 border border-white/5 px-2 py-0.5 rounded-md">
                          {completedCount}/7d ({percent}%)
                        </span>
                        <button
                          onClick={() => handleResetHabitWeek(habit.id)}
                          className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="Resetar semana para iniciar novo controle"
                        >
                          <RefreshCw size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Day picker checklist (Mon-Sun) */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {DAYS_OF_WEEK.map((day, idx) => {
                        const done = habit.completedDays[idx];
                        return (
                          <button
                            key={day}
                            onClick={() => handleToggleHabitDay(habit.id, idx)}
                            className={`py-2 rounded-lg text-[10px] font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                              done 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-inner' 
                                : 'bg-slate-950/45 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-350'
                            }`}
                          >
                            <span className="text-[8px] uppercase tracking-wider block font-semibold">{day}</span>
                            {done ? <CheckCircle size={11} className="text-emerald-400" /> : <Circle size={11} className="text-slate-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Custom Habit creation form */}
        {isAddingHabit && (
          <div className="lg:col-span-4 rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Criar Hábito Curto</h4>
            <form onSubmit={handleCreateCustomHabit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nome do Hábito</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alongamento na Praça..."
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Tipo de Hábito</label>
                <select
                  value={newHabitType}
                  onChange={e => setNewHabitType(e.target.value as any)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="outdoor">🌳 Hábito ao Ar Livre</option>
                  <option value="exercise">🏋️ Atividade Física</option>
                  <option value="weekly_walk">🚶 Meta de Caminhada Diária</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Meta Curta Inicial</label>
                <select
                  value={newHabitTargetWeeks}
                  onChange={e => setNewHabitTargetWeeks(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1">1 Semana (Curta)</option>
                  <option value="2">2 Semanas (Curta)</option>
                  <option value="4">4 Semanas (Médio Prazo)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <PlusCircle size={13} /> Criar Hábito
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECTION D: REGISTRO DE EXERCÍCIOS SIMPLIFICADO */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Activity className="text-emerald-400" size={13} />
            Registro de Exercícios e Atividades Físicas
          </h3>
          <p className="text-[10px] text-slate-450 mt-0.5">Registre de forma simples e rápida suas corridas, caminhadas e pedaleadas diárias para controle do seu histórico.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Manual input form */}
          <form onSubmit={handleAddActivity} className="md:col-span-5 space-y-3 p-4 rounded-xl bg-slate-950/30 border border-white/5">
            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Plus size={12} className="text-emerald-400" /> Registro Manual Rápido
            </h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1 col-span-3">
                <label className="text-[8px] font-bold text-slate-500 uppercase">Atividade</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Caminhada">🚶 Caminhada</option>
                  <option value="Corrida">🏃 Corrida</option>
                  <option value="Ciclismo">🚴 Ciclismo</option>
                  <option value="Musculação">🏋️ Musculação</option>
                  <option value="Outro">✨ Outro Exercício</option>
                </select>
              </div>
              <div className="space-y-1 col-span-1.5">
                <label className="text-[8px] font-bold text-slate-500 uppercase">Distância (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 2.5"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="space-y-1 col-span-1.5">
                <label className="text-[8px] font-bold text-slate-500 uppercase">Duração (min)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 30"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-extrabold py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
            >
              Salvar Sessão de Exercício
            </button>
          </form>

          {/* Historical list */}
          <div className="md:col-span-7 p-4 rounded-xl bg-slate-950/30 border border-white/5 flex flex-col justify-between space-y-3">
            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Histórico Recente de Exercícios</h5>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 flex-1">
              {activities.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-8">Nenhuma sessão registrada. Comece salvando seu primeiro exercício!</p>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="flex items-center justify-between text-xs p-2.5 bg-white/[0.01] rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {act.type === 'Corrida' ? '🏃' : act.type === 'Ciclismo' ? '🚴' : act.type === 'Musculação' ? '🏋️' : '🚶'}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-200 block">{act.type}</span>
                        <span className="text-[10px] text-slate-500">
                          {act.distance > 0 ? `${act.distance} km` : 'Foco em tempo'} • {act.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(act.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                      <button 
                        onClick={() => handleDeleteActivity(act.id)} 
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
