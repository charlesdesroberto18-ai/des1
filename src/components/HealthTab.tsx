import React, { useState, useEffect } from 'react';
import { HealthLog } from '../types';
import { useToast } from './Toast';
import { DynamicIcon } from './Icons';

interface HealthTabProps {
  healthLog: HealthLog;
  onUpdateHealth: (updater: Partial<HealthLog>) => void;
}

interface ActivityLog {
  id: string;
  type: string;
  distance: number; // km
  duration: number; // min
  timestamp: string;
}

export default function HealthTab({ healthLog, onUpdateHealth }: HealthTabProps) {
  const { toast } = useToast();

  // Water target constant (3 Liters / 3000 ml)
  const WATER_TARGET_ML = 3000;

  // Local state for activities log
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('personal_activities_log');
    return saved ? JSON.parse(saved) : [
      { id: 'act1', type: 'Caminhada', distance: 2.5, duration: 30, timestamp: new Date().toISOString() },
      { id: 'act2', type: 'Corrida', distance: 5.0, duration: 25, timestamp: new Date().toISOString() }
    ];
  });

  // Save activities to localStorage on change
  useEffect(() => {
    localStorage.setItem('personal_activities_log', JSON.stringify(activities));
  }, [activities]);

  // Form states for adding activities
  const [activityType, setActivityType] = useState('Caminhada');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  // Is water goal completed?
  const isWaterCompleted = healthLog.waterIntake >= WATER_TARGET_ML;

  const handleToggleWater = () => {
    if (isWaterCompleted) {
      onUpdateHealth({ waterIntake: 0 });
      toast.warning('Meta de hidratação reiniciada para hoje.', 'Água Pendente');
    } else {
      onUpdateHealth({ waterIntake: WATER_TARGET_ML });
      toast.success('Parabéns! Você atingiu a meta de 3 Litros de água hoje! 💧', 'Hidratação Concluída');
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
      toast.error('Por favor, informe um tempo de duração válido!', 'Tempo Inválido');
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
    toast.success(`Atividade "${activityType}" de ${distVal}km registrada com sucesso!`, 'Atividade Adicionada');
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    toast.info('Atividade física removida com sucesso.', 'Registro Excluído');
  };

  // Calculations
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div>
        <h2 className="text-base font-extrabold text-white">Controle de Saúde e Hábitos Diários</h2>
        <p className="text-xs text-slate-400">Acompanhe sua hidratação e registre atividades com foco em alto rendimento</p>
      </div>

      {/* Overview Cards (Only hydration and active exercise tracker) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Hidratação Simplificada */}
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Meta de Água Diária</span>
              <h3 className="text-xl font-extrabold text-indigo-400 font-mono">
                {isWaterCompleted ? '3.0 Litros' : 'Pendente'}
                <span className="text-xs text-slate-500 font-medium ml-2">({healthLog.waterIntake}ml de 3000ml)</span>
              </h3>
            </div>
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              isWaterCompleted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              <DynamicIcon name={isWaterCompleted ? 'Check' : 'Droplet'} size={20} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="relative h-2 w-2/3 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                style={{ width: `${(healthLog.waterIntake / WATER_TARGET_ML) * 100}%` }} 
              />
            </div>
            <button
              onClick={handleToggleWater}
              className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all border cursor-pointer ${
                isWaterCompleted 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20'
              }`}
            >
              {isWaterCompleted ? 'Concluída!' : 'Concluir'}
            </button>
          </div>
        </div>

        {/* Card 2: Resumo de Atividades Físicas */}
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Exercício Acumulado</span>
              <h3 className="text-xl font-extrabold text-emerald-400 font-mono">
                {totalDistance.toFixed(1)} km
                <span className="text-xs text-slate-500 font-medium ml-2">em {totalDuration} min</span>
              </h3>
            </div>
            <div className="h-11 w-11 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
              <DynamicIcon name="Footprints" size={20} />
            </div>
          </div>
          
          <div className="mt-4 text-[10px] text-slate-500 font-semibold flex items-center justify-between">
            <span>Sessões registradas: {activities.length}</span>
            <span className="text-emerald-400">Pronto para Maps & Agenda</span>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Hydration Simplificada checkbox card */}
        <div className="lg:col-span-5 rounded-3xl glass-card border border-white/5 p-6 space-y-4 shadow-xl bg-slate-900/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DynamicIcon name="Droplet" size={16} className="text-indigo-400" />
              Meta de Hidratação Diária
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Meta simplificada recomendada: 3 Litros por dia</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-4xl">💧</span>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-white">Seu Alvo de Água: 3.0 Litros (3000ml)</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                Basta clicar no botão abaixo para marcar que você completou sua meta diária recomendada.
              </p>
            </div>

            <button
              onClick={handleToggleWater}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isWaterCompleted
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-extrabold'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 font-extrabold'
              }`}
            >
              <DynamicIcon name={isWaterCompleted ? 'CheckCircle' : 'Circle'} size={15} />
              <span>{isWaterCompleted ? 'Meta Concluída hoje!' : 'Marcar Meta Como Concluída'}</span>
            </button>
          </div>
        </div>

        {/* Right column: Atividade Física logger and list log */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl glass-card border border-white/5 p-6 space-y-4 shadow-xl bg-slate-900/40">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DynamicIcon name="PlusCircle" size={16} className="text-emerald-400" />
                Adicionar Atividade Física
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Informe os detalhes para prepararmos o cálculo de quilometragem e tempo</p>
            </div>

            <form onSubmit={handleAddActivity} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Atividade</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Caminhada">🚶 Caminhada</option>
                  <option value="Corrida">🏃 Corrida</option>
                  <option value="Ciclismo">🚴 Ciclismo</option>
                  <option value="Natação">🏊 Natação</option>
                  <option value="Academia">🏋️ Academia</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Distância (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 3.5"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Duração (minutos)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 40"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="sm:col-span-3 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
              >
                <DynamicIcon name="Plus" size={14} /> Registrar Atividade Física
              </button>
            </form>
          </div>

          {/* Activities Registered list log */}
          <div className="rounded-3xl glass-card border border-white/5 p-6 space-y-4 shadow-xl bg-slate-900/40">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Histórico de Atividades Físicas de Hoje</h4>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Nenhuma atividade registrada hoje. Comece a se mover! 💪</p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                        <DynamicIcon name="Footprints" size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{act.type}</span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {new Date(act.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-white block font-mono">{act.distance.toFixed(1)} km</span>
                        <span className="text-[9px] text-slate-500 font-semibold block">{act.duration} minutos</span>
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/5 transition-all cursor-pointer"
                        title="Excluir Atividade"
                      >
                        <DynamicIcon name="Trash" size={12} />
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
