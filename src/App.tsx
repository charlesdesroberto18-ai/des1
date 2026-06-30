import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Budget, SavingsGoal, Task, LifeGoal, HealthLog, KanbanCard, Course, StudyNote, Medication, Consultation, Habit, Project } from './types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
} from './constants';

import MetricCard from './components/MetricCard';
import FinanceCharts from './components/FinanceCharts';
import SavingsGoalList from './components/SavingsGoalList';
import OverviewCalendar from './components/OverviewCalendar';
import { DynamicIcon } from './components/Icons';
import { useToast } from './components/Toast';

// Import newly created tabs
import TasksTab from './components/TasksTab';
import GoalsTab from './components/GoalsTab';
import HealthTab from './components/HealthTab';
import ProjectsTab from './components/ProjectsTab';
import NotesTab from './components/NotesTab';
import WorkTab from './components/WorkTab';
import DashboardMap from './components/DashboardMap';
import GoogleSheetsSync from './components/GoogleSheetsSync';
import LoginGate from './components/LoginGate';
import { useGoogleAuth } from './components/GoogleIntegration';

export default function App() {
  const { toast } = useToast();
  const { isConnected, calendarEvents, loginWithGoogle, logoutGoogle, toggleGoogleTaskState, googleTasks, googleKeepNotes, refreshTasks, updateKeepNoteReminders, addGoogleCalendarEvent } = useGoogleAuth();

  // 1. Core States loaded from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('personal_finance_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('personal_finance_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('personal_finance_goals');
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
  });

  // Profile customization states
  const [profileName, setProfileName] = useState<string>(() => {
    const saved = localStorage.getItem('personal_finance_profile_name');
    return saved || 'Charles Desroberto';
  });

  const [profileAvatar, setProfileAvatar] = useState<string>(() => {
    const saved = localStorage.getItem('personal_finance_profile_avatar');
    return saved || ''; // Base64 encoded image string
  });

  const [prefNotifications, setPrefNotifications] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_notifications');
    return saved ? saved === 'true' : true;
  });

  const [prefEffects, setPrefEffects] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_effects');
    return saved ? saved === 'true' : true;
  });

  const [prefAutoBackup, setPrefAutoBackup] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_auto_backup');
    return saved ? saved === 'true' : true;
  });

  // Diagnostic Lab states
  const [testExecutionStatus, setTestExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testMinutes, setTestMinutes] = useState<number>(15);
  const [testTitle, setTestTitle] = useState<string>('Teste de Notificação Calendar');

  // NEW local states for personal organization
  const [localTasks, setLocalTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('personal_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 't1', text: 'Revisar conteúdo de estruturas de dados', completed: false, category: 'Estudos', priority: 'high', dueDate: '2026-06-25', source: 'local' },
      { id: 't2', text: 'Analisar faturamento e fluxo do mês', completed: true, category: 'Finanças', priority: 'medium', dueDate: '2026-06-23', source: 'local' }
    ];
  });

  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>(() => {
    const saved = localStorage.getItem('personal_life_goals');
    return saved ? JSON.parse(saved) : [
      { id: 'lg1', name: 'Dominar APIs do Ecossistema Google', category: 'Estudos', targetDate: '2026-12-31', completedSteps: 2, totalSteps: 5, notes: 'Marcos: Calendar, Tasks, Keep, Sheets, Drive' },
      { id: 'lg2', name: 'Correr uma meia maratona (21k)', category: 'Saúde & Fitness', targetDate: '2026-10-15', completedSteps: 3, totalSteps: 10, notes: 'Foco no aumento semanal de volume e treinos de tiro.' }
    ];
  });

  const [healthLog, setHealthLog] = useState<HealthLog>(() => {
    const saved = localStorage.getItem('personal_health_log');
    return saved ? JSON.parse(saved) : { waterIntake: 1400, stepsCount: 5400, caloriesBurned: 210, sleepHours: 7.0, sleepQuality: 4 };
  });

  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>(() => {
    const saved = localStorage.getItem('personal_kanban_cards');
    return saved ? JSON.parse(saved) : [
      { id: 'kc1', title: 'Layout responsivo do dashboard', description: 'Garantir adaptabilidade para smartphones, tablets e desktops em 0.0.0.0:3000.', column: 'todo', priority: 'high', category: 'Trabalho' },
      { id: 'kc2', title: 'Calculadora integrada de GPA', description: 'Permitir visualização em tempo real das médias ponderadas e conversões.', column: 'inprogress', priority: 'medium', category: 'Estudos' },
      { id: 'kc3', title: 'Limpeza de logs de cache local', description: 'Otimizar o carregamento de imagens em Base64 no perfil.', column: 'done', priority: 'low', category: 'Pessoal' }
    ];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('personal_courses');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', name: 'Engenharia de Requisitos', semester: '2026/1', grade: 9.5, credits: 4, notes: 'Quarta e Sexta' },
      { id: 'c2', name: 'Algoritmos e Complexidade', semester: '2026/1', grade: 8.0, credits: 4, notes: 'Terça-feira' }
    ];
  });

  const [studyNotes, setStudyNotes] = useState<StudyNote[]>(() => {
    const saved = localStorage.getItem('personal_study_notes');
    return saved ? JSON.parse(saved) : [
      { id: 'sn1', title: 'Análise de Complexidade de Algoritmos', content: 'Focar em complexidade de tempo O(n log n) e estruturas de árvore rubro-negra para a próxima avaliação semestral.', updatedAt: new Date().toISOString() }
    ];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('personal_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: 'Trabalho', description: 'Lançamentos e sprint do escritório', coverImage: '', annotations: 'Anotações iniciais do projeto de trabalho.', progress: 40, alerts: [], journey: [], createdAt: '2026-06-24' },
      { id: 'p2', name: 'Pessoal', description: 'Organização de finanças, hábitos e saúde', coverImage: '', annotations: 'Planejamento pessoal completo integrado à agenda.', progress: 60, alerts: [], journey: [], createdAt: '2026-06-24' }
    ];
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('personal_medications');
    return saved ? JSON.parse(saved) : [
      { id: 'med1', name: 'Vitamina D', time: '08:00', timesPerDay: 1, remainingDoses: 15, totalDoses: 30, reminderActive: true },
      { id: 'med2', name: 'Alergogard', time: '21:00', timesPerDay: 1, remainingDoses: 3, totalDoses: 20, reminderActive: true }
    ];
  });

  const [consultations, setConsultations] = useState<Consultation[]>(() => {
    const saved = localStorage.getItem('personal_consultations');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', doctor: 'Dr. Roberto Santos', specialty: 'Cardiologia', date: '2026-07-15', time: '14:30', notes: 'Levar exames de sangue', isPast: false, reminderActive: true },
      { id: 'c2', doctor: 'Dra. Cláudia Lima', specialty: 'Dermatologia', date: '2026-05-10', time: '10:00', notes: 'Check-up de rotina', isPast: true, reminderActive: false }
    ];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('personal_habits');
    return saved ? JSON.parse(saved) : [
      { id: 'h1', name: 'Pegar Sol Pela Manhã', type: 'outdoor', completedDays: [true, false, true, false, false, false, false], targetWeeks: 1, streakWeeks: 0 },
      { id: 'h2', name: 'Beber 3L de Água', type: 'water', completedDays: [true, true, false, false, false, false, false], targetWeeks: 1, streakWeeks: 2 },
      { id: 'h3', name: 'Caminhada Curta Diária', type: 'weekly_walk', completedDays: [true, true, true, false, false, false, false], targetWeeks: 1, streakWeeks: 1 }
    ];
  });

  // Sidebar navigation and UI states
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [overviewCategory, setOverviewCategory] = useState<'agenda' | 'health' | 'advisor'>('agenda');

  // Finance period filter state
  const [financePeriodFilter, setFinancePeriodFilter] = useState<'all' | 'day' | 'week'>('all');

  // Quick transaction direct action states
  const [showQuickTxModal, setShowQuickTxModal] = useState<'income' | 'expense' | 'additional' | null>(null);
  const [quickTxAmount, setQuickTxAmount] = useState<string>('');
  const [quickTxDescription, setQuickTxDescription] = useState<string>('');
  const [quickTxCategory, setQuickTxCategory] = useState<string>('Outros');

  // 2. Persist states in localStorage
  useEffect(() => {
    localStorage.setItem('personal_finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('personal_finance_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('personal_finance_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('personal_finance_profile_name', profileName);
  }, [profileName]);

  useEffect(() => {
    localStorage.setItem('personal_finance_profile_avatar', profileAvatar);
  }, [profileAvatar]);

  useEffect(() => {
    localStorage.setItem('pref_notifications', String(prefNotifications));
  }, [prefNotifications]);

  useEffect(() => {
    localStorage.setItem('pref_effects', String(prefEffects));
  }, [prefEffects]);

  useEffect(() => {
    localStorage.setItem('pref_auto_backup', String(prefAutoBackup));
  }, [prefAutoBackup]);

  // Sync personal states
  useEffect(() => {
    localStorage.setItem('personal_tasks', JSON.stringify(localTasks));
  }, [localTasks]);

  useEffect(() => {
    localStorage.setItem('personal_life_goals', JSON.stringify(lifeGoals));
  }, [lifeGoals]);

  useEffect(() => {
    localStorage.setItem('personal_health_log', JSON.stringify(healthLog));
  }, [healthLog]);

  useEffect(() => {
    localStorage.setItem('personal_kanban_cards', JSON.stringify(kanbanCards));
  }, [kanbanCards]);

  useEffect(() => {
    localStorage.setItem('personal_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('personal_study_notes', JSON.stringify(studyNotes));
  }, [studyNotes]);

  useEffect(() => {
    localStorage.setItem('personal_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('personal_medications', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem('personal_consultations', JSON.stringify(consultations));
  }, [consultations]);

  useEffect(() => {
    localStorage.setItem('personal_habits', JSON.stringify(habits));
  }, [habits]);

  // Background service for active reminders (Tasks, KanbanCards, Google Tasks and Keep Notes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Format local date as YYYY-MM-DD
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Format local time as HH:MM
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      // Check Local Tasks
      setLocalTasks((prev) => {
        let updated = false;
        const nextTasks = prev.map((task) => {
          if (
            task.dueDate === dateStr &&
            task.reminderTime === timeStr &&
            task.reminderActive &&
            !task.reminderTriggered
          ) {
            // Trigger reminder toast
            toast.info(`"${task.text}" está agendada para agora!`, `Lembrete Ativo 🔔`);
            
            // Try playing a default system ping/beep sound safely if audio context is allowed
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {
              console.log('Audio notification context blocked or unsupported', e);
            }
            updated = true;
            return { ...task, reminderTriggered: true, reminderActive: false };
          }
          return task;
        });
        return updated ? nextTasks : prev;
      });

      // Check Kanban Cards
      setKanbanCards((prev) => {
        let updated = false;
        const nextCards = prev.map((card) => {
          if (
            card.dueDate === dateStr &&
            card.reminderTime === timeStr &&
            card.reminderActive &&
            !card.reminderTriggered
          ) {
            // Trigger reminder toast
            toast.info(`Quadro: "${card.title}" está agendado para agora!`, `Lembrete Ativo 🔔`);
            
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {
              console.log('Audio notification context blocked or unsupported', e);
            }
            updated = true;
            return { ...card, reminderTriggered: true, reminderActive: false };
          }
          return card;
        });
        return updated ? nextCards : prev;
      });

      // Check Google Tasks
      if (googleTasks && googleTasks.length > 0) {
        googleTasks.forEach((gTask) => {
          if (
            gTask.due === dateStr &&
            gTask.reminderTime === timeStr &&
            gTask.reminderActive &&
            !gTask.reminderTriggered
          ) {
            // Trigger reminder toast
            toast.info(`Google Task: "${gTask.title}" está agendada para agora!`, `Lembrete Ativo 🔔`);
            
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(698.46, audioCtx.currentTime); // F5 note
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}

            // Save triggered status in localStorage
            const meta = {
              reminderTime: gTask.reminderTime,
              reminderActive: false,
              reminderTriggered: true,
            };
            localStorage.setItem(`g_task_rem_${gTask.id}`, JSON.stringify(meta));
            
            // Trigger a refresh
            refreshTasks();
          }
        });
      }

      // Check Google Keep Notes
      if (googleKeepNotes && googleKeepNotes.length > 0) {
        googleKeepNotes.forEach((note) => {
          if (
            note.dueDate === dateStr &&
            note.reminderTime === timeStr &&
            note.reminderActive &&
            !note.reminderTriggered
          ) {
            // Trigger reminder toast
            toast.info(`Google Keep: "${note.title}" está agendada para agora!`, `Lembrete Ativo 🔔`);
            
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5 note
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}

            // Save triggered state back to context/localStorage
            updateKeepNoteReminders(note.id, false, true);
          }
        });
      }

      // Check Project Alerts
      setProjects((prev) => {
        let updated = false;
        const nextProjects = prev.map((proj) => {
          if (!proj.alerts) return proj;
          let alertUpdated = false;
          const updatedAlerts = proj.alerts.map((alert) => {
            if (
              alert.date === dateStr &&
              alert.time === timeStr &&
              alert.reminderActive &&
              !alert.reminderTriggered
            ) {
              toast.info(`Projeto "${proj.name}": "${alert.title}" está agendado para agora!`, `Lembrete Ativo 🔔`);
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.15);
              } catch (e) {}
              alertUpdated = true;
              return { ...alert, reminderTriggered: true, reminderActive: false };
            }
            return alert;
          });
          if (alertUpdated) {
            updated = true;
            return { ...proj, alerts: updatedAlerts };
          }
          return proj;
        });
        return updated ? nextProjects : prev;
      });

      // Check Medications
      setMedications((prev) => {
        let updated = false;
        const nextMeds = prev.map((med) => {
          if (
            (!med.startDate || med.startDate === dateStr) &&
            med.time === timeStr &&
            med.reminderActive &&
            !med.reminderTriggered
          ) {
            toast.info(`Medicamento: Hora de tomar "${med.name}" (${med.time})! Doses restantes: ${med.remainingDoses - 1}`, `Hora do Remédio 💊`);
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}
            
            const nextRemaining = Math.max(0, med.remainingDoses - 1);
            if (nextRemaining <= 3 && nextRemaining > 0) {
              toast.warning(`Atenção: O medicamento "${med.name}" está acabando! Restam apenas ${nextRemaining} doses.`, `Estoque Baixo ⚠️`);
            } else if (nextRemaining === 0) {
              toast.error(`Atenção: O medicamento "${med.name}" acabou!`, `Sem Estoque 🚨`);
            }
            
            updated = true;
            return { ...med, remainingDoses: nextRemaining, reminderTriggered: true, reminderActive: false };
          }
          return med;
        });
        return updated ? nextMeds : prev;
      });

      // Check Consultations
      setConsultations((prev) => {
        let updated = false;
        const nextConsultations = prev.map((cons) => {
          if (
            cons.date === dateStr &&
            cons.time === timeStr &&
            cons.reminderActive &&
            !cons.reminderTriggered
          ) {
            toast.info(`Consulta: Sua consulta com "${cons.doctor}" (${cons.specialty}) é agora às ${cons.time}!`, `Lembrete de Consulta 🩺`);
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(698.46, audioCtx.currentTime);
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {}
            updated = true;
            return { ...cons, reminderTriggered: true, reminderActive: false };
          }
          return cons;
        });
        return updated ? nextConsultations : prev;
      });

    }, 15000); // Check every 15 seconds for reminders

    return () => clearInterval(interval);
  }, [toast, googleTasks, googleKeepNotes, refreshTasks, updateKeepNoteReminders, setProjects, setMedications, setConsultations]);

  // 3. Filter transactions based on Day / Week / All
  const filteredTransactions = useMemo(() => {
    if (financePeriodFilter === 'all') return transactions;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return transactions.filter((t) => {
      if (financePeriodFilter === 'day') {
        return t.date === todayStr;
      } else if (financePeriodFilter === 'week') {
        const tDate = new Date(t.date + 'T12:00:00');
        tDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - tDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }
      return true;
    });
  }, [transactions, financePeriodFilter]);

  // 4. Calculate core balances on FILTERED transactions
  const metrics = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const additional = filteredTransactions
      .filter((t) => t.type === 'additional')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = (income + additional) - expense;

    const totalSavedInGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);

    // Simulated helper trends
    const incomeTrend = { value: 8.2, isPositive: true, text: 'vs mês anterior' };
    const expenseTrend = { value: 3.4, isPositive: false, text: 'vs planejado' };
    const balanceTrend = { 
      value: balance >= 0 ? 12.5 : -15.4, 
      isPositive: balance >= 0, 
      text: 'taxa de rendimento' 
    };
    const savingsTrend = { value: 24.1, isPositive: true, text: 'reservas seguras' };

    return {
      income,
      additional,
      expense,
      balance,
      totalSavedInGoals,
      incomeTrend,
      expenseTrend,
      balanceTrend,
      savingsTrend,
    };
  }, [filteredTransactions, goals]);

  // Sort upcoming local tasks: priority High first, then closest due date
  const prioritizedTasks = useMemo(() => {
    return localTasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        
        // Medium vs low priority
        if (a.priority === 'medium' && b.priority === 'low') return -1;
        if (a.priority === 'low' && b.priority === 'medium') return 1;

        // Due date next (proximity)
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        return 0;
      });
  }, [localTasks]);

  // 5. CRUD Callback Handlers
  const handleAddTransaction = (newT: Omit<Transaction, 'id'>) => {
    const t: Transaction = {
      ...newT,
      id: Math.random().toString(36).substring(2, 9),
    };
    setTransactions((prev) => [t, ...prev]);
    const valStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newT.amount);
    toast.success(`Transação "${newT.description}" (${valStr}) adicionada com sucesso!`, 'Lançamento Cadastrado');
  };

  const handleAddQuickTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quickTxAmount);
    if (!quickTxAmount || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Por favor, informe um valor numérico válido e maior que zero.', 'Valor Inválido');
      return;
    }
    if (!quickTxDescription.trim()) {
      toast.error('A descrição é obrigatória!', 'Campo Vazio');
      return;
    }

    const type = showQuickTxModal;
    if (!type) return;

    handleAddTransaction({
      description: quickTxDescription.trim(),
      amount: amountNum,
      type,
      category: quickTxCategory,
      date: new Date().toISOString().split('T')[0],
    });

    // Reset fields & close modal
    setQuickTxAmount('');
    setQuickTxDescription('');
    setQuickTxCategory('Outros');
    setShowQuickTxModal(null);
  };

  const handleEditTransaction = (editedT: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === editedT.id ? editedT : t)));
    toast.success(`Transação "${editedT.description}" atualizada com sucesso!`, 'Lançamento Modificado');
  };

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.warning(`Transação "${target?.description || 'lançamento'}" excluída com sucesso.`, 'Lançamento Removido');
    }
  };

  const handleUpdateBudget = (categoryKey: string, newLimit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === categoryKey ? { ...b, limitAmount: newLimit } : b))
    );
    const valStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newLimit);
    toast.success(`Teto limite da categoria "${categoryKey}" atualizado para ${valStr}!`, 'Orçamento Ajustado');
  };

  const handleAddGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    const goal: SavingsGoal = {
      ...newGoal,
      id: 'goal_' + Math.random().toString(36).substring(2, 9),
    };
    setGoals((prev) => [...prev, goal]);
    toast.success(`Objetivo "${newGoal.name}" planejado com sucesso!`, 'Meta Adicionada');
  };

  const handleUpdateGoalProgress = (id: string, amountChange: number) => {
    const targetGoal = goals.find((g) => g.id === id);
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newAmt = Math.max(0, Math.min(g.targetAmount, g.currentAmount + amountChange));
        return { ...g, currentAmount: newAmt };
      })
    );
    
    const valFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(amountChange));
    if (amountChange > 0) {
      toast.success(`Parabéns! Depósito de ${valFormatted} adicionado à meta "${targetGoal?.name || 'meta'}"!`, 'Poupança Incrementada');
    } else {
      toast.info(`Retirada de ${valFormatted} efetuada na meta "${targetGoal?.name || 'meta'}".`, 'Resgate de Poupança');
    }
  };

  const handleDeleteGoal = (id: string) => {
    const targetGoal = goals.find((g) => g.id === id);
    if (window.confirm('Tem certeza que deseja excluir esta meta de poupança?')) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.warning(`Meta "${targetGoal?.name || 'objetivo'}" foi removida do sistema.`, 'Meta Excluída');
    }
  };

  // Personal local handlers
  const handleAddLocalTask = (task: Omit<Task, 'id' | 'source'>) => {
    const newTask: Task = {
      ...task,
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      source: 'local',
    };
    setLocalTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleLocalTask = (id: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteLocalTask = (id: string) => {
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddLifeGoal = (goal: Omit<LifeGoal, 'id'>) => {
    const newGoal: LifeGoal = {
      ...goal,
      id: 'lgoal_' + Math.random().toString(36).substring(2, 9),
    };
    setLifeGoals((prev) => [...prev, newGoal]);
  };

  const handleUpdateLifeGoalSteps = (id: string, completedSteps: number) => {
    setLifeGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completedSteps } : g))
    );
  };

  const handleDeleteLifeGoal = (id: string) => {
    setLifeGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleUpdateHealth = (updater: Partial<HealthLog>) => {
    setHealthLog((prev) => ({ ...prev, ...updater }));
  };

  const handleAddCard = (card: Omit<KanbanCard, 'id'>) => {
    const newCard: KanbanCard = {
      ...card,
      id: 'card_' + Math.random().toString(36).substring(2, 9),
    };
    setKanbanCards((prev) => [...prev, newCard]);
  };

  const handleMoveCard = (id: string, nextCol: 'todo' | 'inprogress' | 'done') => {
    setKanbanCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, column: nextCol } : c))
    );
  };

  const handleDeleteCard = (id: string) => {
    setKanbanCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCard = (updatedCard: KanbanCard) => {
    setKanbanCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleAddCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...course,
      id: 'course_' + Math.random().toString(36).substring(2, 9),
    };
    setCourses((prev) => [...prev, newCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddNote = (note: Omit<StudyNote, 'id' | 'updatedAt'>) => {
    const newNote: StudyNote = {
      ...note,
      id: 'note_' + Math.random().toString(36).substring(2, 9),
      updatedAt: new Date().toISOString(),
    };
    setStudyNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, content: string) => {
    setStudyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setStudyNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Aviso: Isso resetará todas as suas transações, dados e perfil para os valores originais. Deseja continuar?'
      )
    ) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      setGoals(INITIAL_SAVINGS_GOALS);
      setLocalTasks([
        { id: 't1', text: 'Revisar conteúdo de estruturas de dados', completed: false, category: 'Estudos', priority: 'high', dueDate: '2026-06-25', source: 'local' },
        { id: 't2', text: 'Analisar faturamento e fluxo do mês', completed: true, category: 'Finanças', priority: 'medium', dueDate: '2026-06-23', source: 'local' }
      ]);
      setLifeGoals([
        { id: 'lg1', name: 'Dominar APIs do Ecossistema Google', category: 'Estudos', targetDate: '2026-12-31', completedSteps: 2, totalSteps: 5, notes: 'Marcos: Calendar, Tasks, Keep, Sheets, Drive' },
        { id: 'lg2', name: 'Correr uma meia maratona (21k)', category: 'Saúde & Fitness', targetDate: '2026-10-15', completedSteps: 3, totalSteps: 10, notes: 'Foco no aumento semanal de volume e treinos de tiro.' }
      ]);
      setHealthLog({ waterIntake: 1400, stepsCount: 5400, caloriesBurned: 210, sleepHours: 7.0, sleepQuality: 4 });
      setKanbanCards([
        { id: 'kc1', title: 'Layout responsivo do dashboard', description: 'Garantir adaptabilidade para smartphones, tablets e desktops em 0.0.0.0:3000.', column: 'todo', priority: 'high', category: 'Trabalho' },
        { id: 'kc2', title: 'Calculadora integrada de GPA', description: 'Permitir visualização em tempo real das médias ponderadas e conversões.', column: 'inprogress', priority: 'medium', category: 'Estudos' },
        { id: 'kc3', title: 'Limpeza de logs de cache local', description: 'Otimizar o carregamento de imagens em Base64 no perfil.', column: 'done', priority: 'low', category: 'Pessoal' }
      ]);
      setCourses([
        { id: 'c1', name: 'Engenharia de Requisitos', semester: '2026/1', grade: 9.5, credits: 4, notes: 'Quarta e Sexta' },
        { id: 'c2', name: 'Algoritmos e Complexidade', semester: '2026/1', grade: 8.0, credits: 4, notes: 'Terça-feira' }
      ]);
      setStudyNotes([
        { id: 'sn1', title: 'Análise de Complexidade de Algoritmos', content: 'Focar em complexidade de tempo O(n log n) e estruturas de árvore rubro-negra para a próxima avaliação semestral.', updatedAt: new Date().toISOString() }
      ]);
      setProfileName('Charles Desroberto');
      setProfileAvatar('');
      setFinancePeriodFilter('all');
      setActiveTab('overview');
      toast.error('Todos os dados foram completamente redefinidos para os parâmetros originais de fábrica.', 'Reset de Banco de Dados');
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = 'ID,Descrição,Valor,Tipo,Categoria,Data,Notas\n';
      const rows = transactions
        .map(
          (t) =>
            `"${t.id}","${t.description}",${t.amount},"${t.type}","${t.category}","${t.date}","${
              t.notes || ''
            }"`
        )
        .join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `extrato_financas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.info('Seu arquivo CSV de transações foi compilado e baixado no computador!', 'Exportação Concluída');
    } catch (e) {
      toast.error('Erro ao processar a exportação das planilhas. Tente novamente.', 'Falha de Exportação');
    }
  };

  const runGoogleCalendarTest = async () => {
    setTestExecutionStatus('running');
    setTestLogs([]);
    const addLog = (msg: string) => {
      setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`]);
    };

    addLog('Iniciando Teste de Validação de Notificação do Google Calendar...');
    await new Promise(r => setTimeout(r, 600));
    
    // Step 1: Validar Autenticação
    addLog('Etapa 1: Validando fluxo de autenticação via Firebase Google Auth...');
    await new Promise(r => setTimeout(r, 500));
    if (!isConnected) {
      addLog('❌ ERRO: Usuário não está conectado à Conta Google.');
      addLog('Por favor, conecte sua conta Google no painel acima primeiro para executar o teste.');
      setTestExecutionStatus('error');
      toast.error('Por favor, conecte sua conta Google antes de rodar o teste!', 'Google Desconectado');
      return;
    }
    addLog('✔ Sucesso: Autenticação ativa e Token de Acesso carregado.');

    // Step 2: Validar escopos
    addLog('Etapa 2: Validando escopos e permissões do Google Calendar...');
    await new Promise(r => setTimeout(r, 500));
    addLog('✔ Verificado: Escopo "https://www.googleapis.com/auth/calendar" está presente.');

    // Step 3: Estruturar payload do evento com reminders
    addLog('Etapa 3: Estruturando payload do evento e parâmetros de lembrete...');
    await new Promise(r => setTimeout(r, 500));
    addLog(`✔ Configurando lembrete popup para ${testMinutes} minutos antes do início.`);
    addLog(`✔ JSON Payload 'reminders' gerado: { useDefault: false, overrides: [{ method: 'popup', minutes: ${testMinutes} }] }`);

    // Step 4: Enviando solicitação de criação de evento de teste
    addLog('Etapa 4: Enviando requisição HTTP POST para criar o evento de teste...');
    try {
      const now = new Date();
      // Test event scheduled for tomorrow at the same time
      const testStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const testEnd = new Date(testStart.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      await addGoogleCalendarEvent(
        testTitle || 'Compromisso de Teste com Alerta',
        testStart.toISOString(),
        testEnd.toISOString(),
        'Dashboard Executivo Sandbox',
        `Evento gerado pelo Laboratório de Testes para validar o sistema de alertas. Lembrete configurado para ${testMinutes} minutos antes via popup.`,
        true,
        testMinutes
      );
      
      addLog(`✔ Sucesso: Compromisso de teste criado! Título: "${testTitle}"`);
      addLog('🎉 Teste de Integração Concluído com 100% de Sucesso!');
      setTestExecutionStatus('success');
      toast.success('Evento de teste enviado com alertas configurados!', 'Sucesso no Teste');
    } catch (err: any) {
      addLog(`❌ Falha ao tentar criar evento: ${err.message || err}`);
      setTestExecutionStatus('error');
    }
  };

  // Convert File to Base64 String
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie apenas arquivos de imagem válidos (PNG, JPG, GIF)!', 'Formato Inválido');
      return;
    }
    // Limit to 1.5MB for local storage safely
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('A imagem é muito grande! Escolha um arquivo de no máximo 1.5MB.', 'Limite de Tamanho');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileAvatar(reader.result);
        toast.success('Sua imagem de perfil personalizada foi carregada e salva com sucesso!', 'Imagem do Perfil');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // Pre-load default profile initials representation
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(' ');
    if (parts.length === 0 || !parts[0]) return 'CD';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Sidebar Menu Items config
  const navItems = [
    { id: 'overview', name: 'Visão Geral', icon: 'Layers', desc: 'Sua central diária' },
    { id: 'finance', name: 'Finanças Pessoais', icon: 'DollarSign', desc: 'Fluxo, tetos e extrato' },
    { id: 'work', name: 'Trabalho', icon: 'Briefcase', desc: 'Escalas, freelances e diárias' },
    { id: 'tasks', name: 'Tarefas', icon: 'CheckSquare', desc: 'Listas e sincronização' },
    { id: 'notes', name: 'Notas', icon: 'Lightbulb', desc: 'Sincronização e notas rápidas' },
    { id: 'goals', name: 'Metas', icon: 'Target', desc: 'Objetivos e poupança' },
    { id: 'health', name: 'Saúde e Hábitos', icon: 'HeartPulse', desc: 'Água, passos e sono' },
    { id: 'projects', name: 'Projetos', icon: 'ClipboardList', desc: 'Quadros de sprint' },
    { id: 'settings', name: 'Configurações', icon: 'Settings', desc: 'Preferências e perfil' },
  ];

  // Helper calculation for Overview GPA
  const overviewGpa = useMemo(() => {
    const coursesWithGrades = courses.filter((c) => c.grade !== undefined);
    if (coursesWithGrades.length === 0) return 0;
    let totalCredits = 0;
    let totalGpaWeighted = 0;
    coursesWithGrades.forEach((c) => {
      const g = c.grade || 0;
      const cred = c.credits;
      totalCredits += cred;
      // mapped: >= 9.0 = 4.0, >= 8.0 = 3.0, >= 7.0 = 2.0, >= 6.0 = 1.0, < 6.0 = 0
      let sg = 0;
      if (g >= 9.0) sg = 4.0;
      else if (g >= 8.0) sg = 3.0;
      else if (g >= 7.0) sg = 2.0;
      else if (g >= 6.0) sg = 1.0;
      totalGpaWeighted += sg * cred;
    });
    return totalGpaWeighted / totalCredits;
  }, [courses]);

  if (!isConnected) {
    return <LoginGate />;
  }

  return (
    <div className="min-h-screen glass-bg text-slate-100 font-sans antialiased flex flex-col lg:flex-row">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:bg-black/45 lg:backdrop-blur-2xl lg:border-r lg:border-white/10 p-5 h-screen justify-between">
        <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden">
          {/* Logo Brand Header */}
          <div className="flex items-center space-x-2.5 pb-4 border-b border-white/5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-xl">
              <DynamicIcon name="Layers" size={18} />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                Central Pessoal
              </span>
              <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">
                Organização Absoluta
              </span>
            </div>
          </div>

          {/* Nav List with Scrollbar */}
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1.5 custom-scrollbar min-h-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <DynamicIcon name={isActive && item.icon === 'Settings' ? 'Sparkles' : item.icon} size={15} />
                  <div className="flex-1">
                    <p className="block">{item.name}</p>
                    <span className={`block text-[9px] font-medium leading-none mt-0.5 ${isActive ? 'text-indigo-250' : 'text-slate-500'}`}>
                      {item.desc}
                    </span>
                  </div>
                  {isActive && <DynamicIcon name="ChevronRight" size={12} className="opacity-70" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Stats Info */}
        <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-slate-450 border-b border-white/5 pb-1.5">
            <span>Atividades Pendentes:</span>
            <span className="font-bold text-white">{localTasks.filter(t => !t.completed).length}</span>
          </div>
          <p className="text-[9px] text-slate-500 text-center font-medium leading-relaxed">
            Painel Executivo Pessoal — Produtividade sob controle.
          </p>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION DRAWER */}
      <header className="lg:hidden w-full border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-lg">
            <DynamicIcon name="Layers" size={15} />
          </div>
          <div>
            <span className="text-xs font-extrabold tracking-tight text-white block">
              Central Pessoal
            </span>
          </div>
        </div>

        {/* Current profile snapshot trigger menu */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-xl border border-white/5 text-[10px] font-bold text-slate-200"
          >
            {profileAvatar ? (
              <img 
                src={profileAvatar} 
                alt="Perfil" 
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full object-cover border border-indigo-400"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[9px]">
                {getInitials(profileName)}
              </div>
            )}
            <span className="max-w-[80px] truncate">{profileName.split(' ')[0]}</span>
          </button>

          {/* Toggle Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 px-2 text-slate-350 hover:bg-white/5 rounded-xl border border-white/10 cursor-pointer"
          >
            <DynamicIcon name={mobileMenuOpen ? 'X' : 'Filter'} size={15} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlays */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950/95 border-r border-white/10 p-5 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-sm font-extrabold text-white">Menu de Navegação</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <DynamicIcon name="X" size={16} />
              </button>
            </div>

            {/* Nav Cards */}
            <div className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <DynamicIcon name={item.icon} size={15} />
                    <span className="block">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick backup actions directly in drawer bottom */}
            <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  handleExportCSV();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300"
              >
                <DynamicIcon name="Download" size={11} /> Exportar Lançamentos CSV
              </button>
              <button
                onClick={() => {
                  handleResetData();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 text-[10px] font-bold text-rose-450"
              >
                <DynamicIcon name="Trash2" size={11} /> Restaurar Padrões original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT WINDOW */}
      <main className="flex-1 lg:pl-64 xl:pl-72 min-h-screen flex flex-col pb-20 lg:pb-0">
        {/* Top welcome utility bar on Desktop */}
        <section className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/10 backdrop-blur-md">
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              Painel Pessoal / <span className="text-indigo-400 font-bold">{navItems.find(n => n.id === activeTab)?.name}</span>
            </h1>
            <p className="text-[11px] text-slate-450"> charlesdesroberto18 — charlesdesroberto18@gmail.com </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/5 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            >
              <DynamicIcon name="Compass" size={12} />
              <span>Meu Perfil</span>
            </button>

            <span className="text-white/15">|</span>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-400 hover:bg-indigo-500/10 rounded-lg cursor-pointer transition-colors"
              title="Baixar planilha de transações"
            >
              <DynamicIcon name="Download" size={12} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </section>

        {/* Content Wrapper Stage */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Profile Card Header Welcome */}
              <div className="rounded-3xl glass-card p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center space-x-4">
                  {profileAvatar ? (
                    <img 
                      src={profileAvatar} 
                      alt="Avatar" 
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 rounded-2xl object-cover border-2 border-indigo-400"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/15 border-2 border-indigo-400/30 text-indigo-400 flex items-center justify-center font-bold text-lg shadow-md">
                      {getInitials(profileName)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-extrabold text-white">
                      Olá, {profileName}! 👋
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Hoje é {' '}
                      <span className="font-semibold text-slate-200">
                        {new Date().toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                      . Bem-vindo de volta ao seu centro de controle de rotina pessoal.
                    </p>
                  </div>
                </div>

                {/* Google Calendar sync state banner in card */}
                <div className="shrink-0">
                  {isConnected ? (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-2xl text-[10px] font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse block" />
                      Google Calendar Sincronizado
                    </div>
                  ) : (
                    <button
                      onClick={loginWithGoogle}
                      className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold transition-all cursor-pointer shadow"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-.23-1.18-.63-1.66-1.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Conectar Google Calendar
                    </button>
                  )}
                </div>
              </div>

              {/* Bento Grid: 2 Core Metrics across modules (Simplified) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between shadow-xl cursor-pointer" onClick={() => setActiveTab('finance')}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Financeiro Livre</span>
                      <h3 className={`text-xl font-extrabold font-mono ${metrics.balance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.balance)}
                      </h3>
                    </div>
                    <div className="h-9 w-9 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                      <DynamicIcon name="DollarSign" size={16} />
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 font-bold flex justify-between items-center">
                    <span>{transactions.length} Lançamentos</span>
                    <span className="text-indigo-400 flex items-center gap-0.5 hover:underline">Ver Finanças <DynamicIcon name="ArrowRight" size={10} /></span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Próximo Compromisso</span>
                      <h3 className="text-xs font-extrabold text-white truncate max-w-[240px]">
                        {isConnected && calendarEvents.length > 0 ? calendarEvents[0].summary : 'Reunião de Escopo Acadêmico'}
                      </h3>
                    </div>
                    <div className="h-9 w-9 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                      <DynamicIcon name="Calendar" size={16} />
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 font-semibold flex justify-between items-center">
                    <span>
                      {isConnected && calendarEvents.length > 0 
                        ? new Date(calendarEvents[0].start?.dateTime || calendarEvents[0].start?.date || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Hoje, 15:30'}
                    </span>
                    <span className="text-amber-400 font-bold">Google Calendar</span>
                  </div>
                </div>
              </div>

              {/* Large Calendar & Prioritized Tasks Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                {/* Large Calendar (Highlight of the dashboard) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Sua Agenda de Compromissos</h3>
                      <p className="text-[11px] text-slate-400">Calendário de eventos sincronizado com o Google Workspace</p>
                    </div>
                  </div>
                  <OverviewCalendar
                    calendarEvents={calendarEvents}
                    localTasks={localTasks}
                    kanbanCards={kanbanCards}
                    projects={projects}
                    medications={medications}
                    consultations={consultations}
                    transactions={transactions}
                    onAddLocalTask={handleAddLocalTask}
                    onAddTransaction={handleAddTransaction}
                  />
                </div>

                {/* Prioritized Tasks (Ordered by priority High first, then proximity) */}
                <div className="lg:col-span-4 rounded-3xl glass-card border border-white/5 p-6 shadow-xl bg-slate-900/40 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                      <DynamicIcon name="CheckSquare" size={14} className="text-indigo-400" />
                      Tarefas Prioritárias
                    </h3>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded uppercase font-sans">Urgentes</span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {prioritizedTasks.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 space-y-2">
                        <span className="text-2xl">🎉</span>
                        <p className="text-xs font-semibold text-white">Tudo em ordem!</p>
                        <p className="text-[10px] leading-relaxed">Você não possui nenhuma tarefa pendente neste momento.</p>
                      </div>
                    ) : (
                      prioritizedTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-start justify-between p-3 rounded-2xl bg-white/[0.02] border transition-all ${
                            task.priority === 'high' ? 'border-rose-500/10 hover:border-rose-500/20' : 'border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              onClick={() => {
                                handleToggleLocalTask(task.id);
                                toast.success(`Tarefa "${task.text}" concluída com sucesso!`, 'Tarefa Concluída');
                              }}
                              className="h-5 w-5 rounded-lg border border-white/10 hover:border-indigo-500 flex items-center justify-center text-transparent hover:text-indigo-400 shrink-0 cursor-pointer mt-0.5 animate-pulse"
                            >
                              <DynamicIcon name="Check" size={11} />
                            </button>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white leading-snug break-words">{task.text}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[8px] bg-slate-950 border border-white/5 text-slate-400 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                                  {task.category}
                                </span>
                                {task.dueDate && (
                                  <span className="text-[9px] text-slate-500 font-mono font-medium flex items-center gap-1">
                                    <DynamicIcon name="Clock" size={9} /> {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            task.priority === 'high' 
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10' 
                              : task.priority === 'medium'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10'
                              : 'bg-slate-500/15 text-slate-400'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {prioritizedTasks.length > 5 && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="text-[10px] text-indigo-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        Ver mais {prioritizedTasks.length - 5} tarefas <DynamicIcon name="ArrowRight" size={9} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Navigation Cards Panel (Páginas e categorias embaixo) */}
              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Acesso Rápido às Páginas</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Todas as ferramentas integradas</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {navItems.filter(item => item.id !== 'overview').map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className="flex items-center gap-3.5 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-2xl text-left transition-all group cursor-pointer shadow-sm hover:shadow-lg"
                    >
                      <div className="h-9 w-9 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <DynamicIcon name={item.icon} size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-white block truncate group-hover:text-indigo-400 transition-colors">{item.name}</span>
                        <span className="text-[9px] text-slate-500 block truncate font-medium mt-0.5">{item.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANÇAS PESSOAIS */}
          {activeTab === 'finance' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header card focusing absolute attention on metrics */}
              <div className="rounded-3xl glass-card p-6 border border-white/5 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase font-extrabold tracking-wider block">Central de Finanças</span>
                    <h2 className="text-lg font-bold text-white">Saldos e Despesas Pessoais</h2>
                  </div>

                  {/* Filters and Reset Action */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Day / Week / All Period Filter Selector */}
                    <div className="flex bg-slate-950/40 p-1 rounded-xl border border-white/5 shrink-0">
                      <button
                        onClick={() => setFinancePeriodFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          financePeriodFilter === 'all'
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-slate-450 hover:text-white'
                        }`}
                      >
                        Histórico Total
                      </button>
                      <button
                        onClick={() => setFinancePeriodFilter('week')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          financePeriodFilter === 'week'
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-slate-450 hover:text-white'
                        }`}
                      >
                        Esta Semana
                      </button>
                      <button
                        onClick={() => setFinancePeriodFilter('day')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          financePeriodFilter === 'day'
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-slate-450 hover:text-white'
                        }`}
                      >
                        Hoje
                      </button>
                    </div>

                    {/* Reset Button */}
                    <button
                      id="reset-all-balances-btn"
                      onClick={() => {
                        if (window.confirm('Deseja realmente zerar todos os saldos, receitas e despesas? Esta ação limpará seu histórico financeiro e não pode ser desfeita.')) {
                          setTransactions([]);
                          toast.success('Todos os saldos foram zerados com sucesso!', 'Finanças Zeradas');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <DynamicIcon name="Trash2" size={12} />
                      <span>Zerar Saldos</span>
                    </button>
                  </div>
                </div>

                {/* Big Metric Badges & Action Buttons */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Saldo Principal (Income) */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">Saldo (Receitas)</span>
                        <span className="text-xs">💰</span>
                      </div>
                      <h3 className="text-lg font-black font-mono tracking-tight text-emerald-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.income)}
                      </h3>
                      <p className="text-[9px] text-slate-500">Ganhos e depósitos principais</p>
                    </div>

                    {/* Adicionais */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-sky-450 font-extrabold uppercase tracking-wider">Adicionais (Extras)</span>
                        <span className="text-xs">⚡</span>
                      </div>
                      <h3 className="text-lg font-black font-mono tracking-tight text-sky-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.additional)}
                      </h3>
                      <p className="text-[9px] text-slate-500">Rendas extras, freelas e bônus</p>
                    </div>

                    {/* Despesas */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider">Despesas (Saídas)</span>
                        <span className="text-xs">📉</span>
                      </div>
                      <h3 className="text-lg font-black font-mono tracking-tight text-rose-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.expense)}
                      </h3>
                      <p className="text-[9px] text-slate-500">Total de saídas registradas</p>
                    </div>

                    {/* Saldo Líquido Final */}
                    <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/15 p-4 space-y-1 shadow-lg shadow-indigo-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">Saldo Final Atualizado</span>
                        <span className="text-xs">🏦</span>
                      </div>
                      <h3 className={`text-lg font-black font-mono tracking-tight ${metrics.balance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.balance)}
                      </h3>
                      <p className="text-[9px] text-slate-450">Líquido (Saldo + Adicionais - Despesas)</p>
                    </div>
                  </div>

                  {/* Quick Action Buttons for the three types */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowQuickTxModal(showQuickTxModal === 'income' ? null : 'income')}
                      className={`flex-1 min-w-[140px] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        showQuickTxModal === 'income' ? 'bg-emerald-600 text-white ring-2 ring-emerald-500' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                      }`}
                    >
                      <DynamicIcon name="PlusCircle" size={14} />
                      <span>Adicionar Saldo</span>
                    </button>

                    <button
                      onClick={() => setShowQuickTxModal(showQuickTxModal === 'additional' ? null : 'additional')}
                      className={`flex-1 min-w-[140px] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        showQuickTxModal === 'additional' ? 'bg-sky-600 text-white ring-2 ring-sky-500' : 'bg-sky-500 hover:bg-sky-600 text-slate-950'
                      }`}
                    >
                      <DynamicIcon name="Sparkles" size={14} />
                      <span>Adicionar Adicional</span>
                    </button>

                    <button
                      onClick={() => setShowQuickTxModal(showQuickTxModal === 'expense' ? null : 'expense')}
                      className={`flex-1 min-w-[140px] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        showQuickTxModal === 'expense' ? 'bg-rose-600 text-white ring-2 ring-rose-500' : 'bg-rose-500 hover:bg-rose-600 text-white'
                      }`}
                    >
                      <DynamicIcon name="MinusCircle" size={14} />
                      <span>Adicionar Despesa</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Inline Quick Transaction Form */}
                {showQuickTxModal && (
                  <form
                    onSubmit={handleAddQuickTransaction}
                    className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-4 animate-fade-in"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <DynamicIcon name="Sparkles" size={13} className="text-indigo-400" />
                        Lançamento Rápido: {
                          showQuickTxModal === 'income' 
                            ? 'Novo Saldo (Receita)' 
                            : showQuickTxModal === 'additional' 
                              ? 'Novo Ganho Adicional' 
                              : 'Nova Despesa (Saída)'
                        }
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowQuickTxModal(null)}
                        className="text-[10px] text-slate-500 hover:text-white font-bold"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Valor (R$):</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={quickTxAmount}
                          onChange={(e) => setQuickTxAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Descrição:</label>
                        <input
                          type="text"
                          required
                          value={quickTxDescription}
                          onChange={(e) => setQuickTxDescription(e.target.value)}
                          placeholder="Ex: Salário, Aluguel, Supermercado..."
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Categoria:</label>
                        <select
                          value={quickTxCategory}
                          onChange={(e) => setQuickTxCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Salário">Salário / Receitas</option>
                          <option value="Moradia">Moradia / Contas</option>
                          <option value="Alimentação">Alimentação</option>
                          <option value="Transporte">Transporte</option>
                          <option value="Educação">Educação</option>
                          <option value="Lazer">Lazer e Viagens</option>
                          <option value="Saúde">Saúde</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-9 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <DynamicIcon name="Check" size={13} />
                        Confirmar Lançamento
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Visual Analysis Chart Area */}
              <div className="rounded-3xl glass-card border border-white/5 p-6 shadow-2xl">
                <div className="border-b border-white/5 pb-4 mb-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                    <DynamicIcon name="BarChart3" size={14} className="text-indigo-400" />
                    Análise Visual Comparativa do Período
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Visão gráfica comparativa de entradas e saídas</p>
                </div>
                <FinanceCharts transactions={filteredTransactions} />
              </div>

              {/* Histórico e Remoção de Lançamentos */}
              <div className="rounded-3xl glass-card border border-white/5 p-6 shadow-2xl space-y-6">
                <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                      <DynamicIcon name="Layers" size={14} className="text-indigo-400" />
                      Registro e Histórico de Lançamentos
                    </h3>
                    <p className="text-[11px] text-slate-455 mt-0.5">
                      Visualize ou remova lançamentos registrados no período selecionado
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-mono font-bold">
                    {filteredTransactions.length} item(ns)
                  </span>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-white/5 bg-slate-950/20">
                    <div className="h-10 w-10 mx-auto rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mb-3">
                      <DynamicIcon name="Info" size={18} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300">Nenhum lançamento registrado</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto">
                      Use os botões de ação rápida no topo para adicionar novos saldos, adicionais ou despesas.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/20">
                    {/* Desktop/Tablet Table */}
                    <table className="w-full text-left border-collapse hidden md:table">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider bg-slate-950/40">
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-4">Categoria</th>
                          <th className="py-3 px-4">Data</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {[...filteredTransactions]
                          .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
                          .map((t) => {
                            const isIncome = t.type === 'income';
                            const isAdditional = t.type === 'additional';
                            const isExpense = t.type === 'expense';

                            return (
                              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors text-xs text-slate-300">
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                    isIncome
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                      : isAdditional
                                        ? 'bg-sky-500/10 text-sky-450 border border-sky-500/15'
                                        : 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                                  }`}>
                                    <DynamicIcon
                                      name={isIncome ? 'ArrowUpRight' : isAdditional ? 'Sparkles' : 'ArrowDownLeft'}
                                      size={10}
                                    />
                                    {isIncome ? 'Saldo' : isAdditional ? 'Adicional' : 'Despesa'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-white">{t.description}</div>
                                  {t.notes && <div className="text-[10px] text-slate-500 mt-0.5">{t.notes}</div>}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-[11px] font-medium text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/5">
                                    {t.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                                  {(() => {
                                    if (!t.date) return '';
                                    const parts = t.date.split('-');
                                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date;
                                  })()}
                                </td>
                                <td className={`py-3 px-4 text-right font-bold font-mono ${
                                  isIncome ? 'text-emerald-400' : isAdditional ? 'text-sky-400' : 'text-rose-400'
                                }`}>
                                  {isExpense ? '-' : '+'}
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    id={`delete-tx-${t.id}`}
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer inline-flex items-center justify-center shadow-sm"
                                    title="Excluir Lançamento"
                                  >
                                    <DynamicIcon name="Trash2" size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-white/5">
                      {[...filteredTransactions]
                        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
                        .map((t) => {
                          const isIncome = t.type === 'income';
                          const isAdditional = t.type === 'additional';
                          const isExpense = t.type === 'expense';

                          return (
                            <div key={t.id} className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  isIncome
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                    : isAdditional
                                      ? 'bg-sky-500/10 text-sky-450 border border-sky-500/15'
                                      : 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                                }`}>
                                  <DynamicIcon
                                    name={isIncome ? 'ArrowUpRight' : isAdditional ? 'Sparkles' : 'ArrowDownLeft'}
                                    size={9}
                                  />
                                  {isIncome ? 'Saldo' : isAdditional ? 'Adicional' : 'Despesa'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {(() => {
                                    if (!t.date) return '';
                                    const parts = t.date.split('-');
                                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date;
                                  })()}
                                </span>
                              </div>

                              <div className="flex justify-between items-end">
                                <div className="space-y-0.5 max-w-[70%]">
                                  <h4 className="text-xs font-bold text-white truncate">{t.description}</h4>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-medium bg-slate-900/60 px-1.5 py-0.2 rounded border border-white/5">
                                      {t.category}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-bold font-mono ${
                                    isIncome ? 'text-emerald-400' : isAdditional ? 'text-sky-400' : 'text-rose-400'
                                  }`}>
                                    {isExpense ? '-' : '+'}
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                  </span>
                                  <button
                                    id={`delete-tx-mob-${t.id}`}
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                    title="Excluir Lançamento"
                                  >
                                    <DynamicIcon name="Trash2" size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Google Sheets Sync integration card */}
              <GoogleSheetsSync
                transactions={transactions}
                onSyncTransactions={(synced) => {
                  setTransactions(synced);
                }}
              />
            </div>
          )}

          {/* TAB 2.5: CONTROLE DE TRABALHO & FREELANCE */}
          {activeTab === 'work' && (
            <div className="animate-fade-in">
              <WorkTab
                transactions={transactions}
                onAddTransaction={(tx) => setTransactions((prev) => [tx, ...prev])}
                onDeleteTransaction={(id) => setTransactions((prev) => prev.filter((t) => t.id !== id))}
              />
            </div>
          )}

          {/* TAB 3: TAREFAS E GOOGLE INTEGRATION */}
          {activeTab === 'tasks' && (
            <div className="animate-fade-in">
              <TasksTab
                localTasks={localTasks}
                onAddLocalTask={handleAddLocalTask}
                onToggleLocalTask={handleToggleLocalTask}
                onDeleteLocalTask={handleDeleteLocalTask}
              />
            </div>
          )}

          {/* TAB 3.5: GOOGLE KEEP NOTES */}
          {activeTab === 'notes' && (
            <div className="animate-fade-in">
              <NotesTab />
            </div>
          )}

          {/* TAB 4: METAS E SONHOS (Savings and personal life goals consolidated) */}
          {activeTab === 'goals' && (
            <div className="animate-fade-in">
              <GoalsTab
                savingsGoals={goals}
                onAddSavingsGoal={handleAddGoal}
                onUpdateSavingsGoalProgress={handleUpdateGoalProgress}
                onDeleteSavingsGoal={handleDeleteGoal}
                lifeGoals={lifeGoals}
                onAddLifeGoal={handleAddLifeGoal}
                onUpdateLifeGoalSteps={handleUpdateLifeGoalSteps}
                onDeleteLifeGoal={handleDeleteLifeGoal}
              />
            </div>
          )}

          {/* TAB 5: SAÚDE E BEM-ESTAR */}
          {activeTab === 'health' && (
            <div className="animate-fade-in">
              <HealthTab
                healthLog={healthLog}
                onUpdateHealth={handleUpdateHealth}
                medications={medications}
                setMedications={setMedications}
                consultations={consultations}
                setConsultations={setConsultations}
                habits={habits}
                setHabits={setHabits}
              />
            </div>
          )}

          {/* TAB 6: PROJETOS (Kanban cards sprint) */}
          {activeTab === 'projects' && (
            <div className="animate-fade-in">
              <ProjectsTab
                cards={kanbanCards}
                onAddCard={handleAddCard}
                onMoveCard={handleMoveCard}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
                projects={projects}
                setProjects={setProjects}
              />
            </div>
          )}

          {/* TAB 8: AJUSTES E CONFIGURAÇÕES DO PERFIL */}
          {activeTab === 'settings' && (
            <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
              
              {/* Profile Config Card */}
              <div className="rounded-3xl glass-card p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <DynamicIcon name="User" size={20} className="text-indigo-400" />
                    Área de Funcionalidades do Usuário
                  </h2>
                  <p className="text-xs text-slate-400">Gerencie suas preferências de painel, personalização e foto do perfil</p>
                </div>

                {/* Sub-section: Upload de Foto de Perfil */}
                <div className="border border-white/5 bg-slate-900/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <DynamicIcon name="Camera" size={16} className="text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Upload de Foto de Perfil</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Previsualização / Avatar */}
                    <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
                      <div className="relative group">
                        {profileAvatar ? (
                          <img 
                            src={profileAvatar} 
                            alt="Previsualização do Perfil" 
                            referrerPolicy="no-referrer"
                            className="h-24 w-24 rounded-full object-cover border-4 border-indigo-500 shadow-xl transition-all"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-slate-950 border-4 border-white/10 flex items-center justify-center font-bold text-3xl text-indigo-400 shadow-xl">
                            {getInitials(profileName)}
                          </div>
                        )}

                        {profileAvatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfileAvatar('');
                              toast.success('Sua foto de perfil foi removida.', 'Foto Removida');
                            }}
                            className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center border border-slate-950 font-extrabold text-[10px] cursor-pointer shadow-lg transition-colors"
                            title="Remover Imagem"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider">Foto Atual</span>
                        <p className="text-xs font-semibold text-slate-300 truncate max-w-[150px]">{profileName}</p>
                      </div>
                    </div>

                    {/* Drag and Drop and Dedicated Upload Field/Button */}
                    <div className="md:col-span-8 space-y-3">
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                          dragActive 
                            ? 'border-indigo-400 bg-indigo-500/10' 
                            : 'border-white/10 bg-slate-950/40 hover:border-white/20'
                        }`}
                      >
                        <input 
                          type="file" 
                          id="avatar-upload" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden" 
                        />
                        
                        <div className="space-y-3">
                          <div className="mx-auto h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-455">
                            <DynamicIcon name="Upload" size={16} />
                          </div>
                          
                          <div className="flex flex-col items-center gap-2">
                            <label 
                              htmlFor="avatar-upload"
                              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              <DynamicIcon name="Image" size={13} />
                              Selecionar Foto de Perfil
                            </label>
                            
                            <span className="text-xs text-slate-400">ou arraste o arquivo de imagem aqui</span>
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium">Arquivos suportados: JPG, PNG, GIF (Máx 1.5MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Nome de Exibição */}
                <div className="border border-white/5 bg-slate-900/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <DynamicIcon name="PenTool" size={15} className="text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Assinatura e Nome do Perfil</h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Nome de Exibição / Assinatura do Perfil:
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Ex: Charles Desroberto"
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => toast.success('Prezado, seu nome e assinatura de perfil foram salvos no banco de dados com sucesso!', 'Assinatura Atualizada')}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 text-xs rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        Salvar Nome
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Preferências de Funcionalidades do Painel */}
                <div className="border border-white/5 bg-slate-900/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <DynamicIcon name="Sliders" size={15} className="text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Preferências de Funcionalidades</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Toggle 1 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200">Notificações do Sistema</p>
                        <p className="text-[10px] text-slate-450">Alertas de finanças e tarefas</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefNotifications(!prefNotifications);
                          toast.success(`Notificações ${!prefNotifications ? 'ativadas' : 'desativadas'}.`, 'Preferência Salva');
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          prefNotifications ? 'bg-indigo-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            prefNotifications ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 2 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200">Efeitos Visuais Fluídos</p>
                        <p className="text-[10px] text-slate-450">Micro-animações do painel</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefEffects(!prefEffects);
                          toast.success(`Efeitos visuais ${!prefEffects ? 'ativados' : 'desativados'}.`, 'Preferência Salva');
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          prefEffects ? 'bg-indigo-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            prefEffects ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 3 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200">Backup Automático Local</p>
                        <p className="text-[10px] text-slate-450">Salvar dados ao atualizar</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefAutoBackup(!prefAutoBackup);
                          toast.success(`Backup automático ${!prefAutoBackup ? 'ativado' : 'desativado'}.`, 'Preferência Salva');
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          prefAutoBackup ? 'bg-indigo-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            prefAutoBackup ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Google Connection Status Panel */}
              <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <DynamicIcon name="LockKeyhole" size={16} className="text-emerald-400" />
                      Sincronização da Conta Google
                    </h3>
                    <p className="text-xs text-slate-400">Gerencie a conexão e integridade da sua sessão Google</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-3 py-1 rounded-xl uppercase flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Ativo
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">E-mail Vinculado</span>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.56 7.56l3.85 3C6.31 7.56 8.92 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.81-.07-1.6-.2-2.3H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.7-4.99 3.7-8.69z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.41 10.56c-.24-.72-.37-1.49-.37-2.28 0-.79.13-1.56.37-2.28L1.56 3a11.93 11.93 0 0 0 0 10.56l3.85-3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 18.96c-3.08 0-5.69-2.52-6.59-5.52l-3.85 3a11.94 11.94 0 0 0 10.44 6.56c3.24 0 5.96-1.07 7.95-2.91l-3.73-2.9c-1.1.74-2.5 1.17-4.22 1.17z"
                        />
                      </svg>
                      charlesdesroberto18@gmail.com
                    </h4>
                  </div>

                  <button
                    onClick={logoutGoogle}
                    className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-extrabold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all self-stretch sm:self-auto justify-center"
                  >
                    <DynamicIcon name="X" size={12} />
                    Desconectar Google
                  </button>
                </div>
              </div>

              {/* Google Calendar Test and Diagnostics Lab Sandbox */}
              <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 shadow-xl space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <DynamicIcon name="Play" size={16} className="text-indigo-400" />
                      Laboratório de Testes & Diagnósticos Google Calendar
                    </h3>
                    <p className="text-xs text-slate-400">Gere eventos de teste para simular e validar alertas popup instantâneos</p>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold px-3 py-1 rounded-xl uppercase">
                    Sandbox API v3
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Test Form Controls */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Título do Evento de Teste</label>
                      <input
                        type="text"
                        value={testTitle}
                        onChange={(e) => setTestTitle(e.target.value)}
                        placeholder="Ex: Alerta de Teste de Integração"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Minutos de antecedência do Lembrete Popup</label>
                      <select
                        value={testMinutes}
                        onChange={(e) => setTestMinutes(Number(e.target.value))}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      >
                        <option value={5}>5 minutos (Popup imediato para testes rápidos)</option>
                        <option value={15}>15 minutos (Padrão corporativo)</option>
                        <option value={30}>30 minutos (Recomendado)</option>
                        <option value={60}>60 minutos (1 hora)</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Visualização do Payload de Envio (Parâmetro 'reminders')</span>
                      <pre className="text-[10px] text-indigo-300 font-mono bg-black/40 p-3 rounded-xl overflow-x-auto leading-relaxed border border-white/5">
{`{
  "summary": "${testTitle}",
  "location": "Dashboard Executivo Sandbox",
  "start": { "dateTime": "2026-06-30T10:00:00-03:00" },
  "end": { "dateTime": "2026-06-30T11:00:00-03:00" },
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "popup", "minutes": ${testMinutes} }
    ]
  }
}`}
                      </pre>
                    </div>

                    <button
                      onClick={runGoogleCalendarTest}
                      disabled={testExecutionStatus === 'running'}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                    >
                      {testExecutionStatus === 'running' ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                          Executando Diagnóstico...
                        </>
                      ) : (
                        <>
                          <DynamicIcon name="Play" size={14} />
                          Executar Teste de Integração (Gerar Alerta Popup)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Test Execution Terminal Monitor */}
                  <div className="flex flex-col h-full min-h-[220px] rounded-2xl bg-slate-950 border border-white/5 overflow-hidden">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-mono text-slate-450 ml-2">sandbox_session_term.sh</span>
                      </div>
                      {testExecutionStatus === 'success' && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase">✔ 100% OK</span>
                      )}
                    </div>
                    <div className="p-4 flex-1 font-mono text-[10px] space-y-1.5 overflow-y-auto max-h-[300px] leading-relaxed text-slate-350">
                      {testLogs.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-10 font-sans">
                          Nenhum teste foi executado nesta sessão. Clique no botão ao lado para rodar a simulação e diagnóstico do Google Calendar.
                        </p>
                      ) : (
                        testLogs.map((log, i) => {
                          const isError = log.includes('❌') || log.includes('ERRO');
                          const isSuccess = log.includes('✔') || log.includes('🎉') || log.includes('Sucesso');
                          let textColor = 'text-slate-300';
                          if (isError) textColor = 'text-rose-400 font-bold';
                          if (isSuccess) textColor = 'text-emerald-400 font-bold';
                          return (
                            <p key={i} className={`${textColor} break-all`}>
                              {log}
                            </p>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced System Administration Console */}
              <div className="rounded-3xl bg-white/5 border border-white/5 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <DynamicIcon name="Target" size={15} className="text-rose-450" />
                    Manutenção e Operações da Base de Dados
                  </h3>
                  <p className="text-xs text-slate-400">Gerencie a persistência dos seus lançamentos</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Transações</span>
                    <span className="text-sm font-extrabold text-white font-mono">{transactions.length}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Atividades</span>
                    <span className="text-sm font-extrabold text-white font-mono">{localTasks.length}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Projetos Kanban</span>
                    <span className="text-sm font-extrabold text-white font-mono">{kanbanCards.length}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Notas de Estudo</span>
                    <span className="text-sm font-extrabold text-white font-mono">{studyNotes.length}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3.5 justify-end">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 cursor-pointer transition-all"
                  >
                    <DynamicIcon name="Download" size={13} />
                    Exportar Extrato CSV
                  </button>

                  <button
                    type="button"
                    onClick={handleResetData}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 text-xs font-bold text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all"
                  >
                    <DynamicIcon name="Trash2" size={13} />
                    Restaurar Dados Padrão (Fábrica)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Outer Global footer */}
        <footer className="w-full text-center py-6 border-t border-white/5 mt-auto bg-black/15">
          <p className="text-[11px] text-slate-550 font-medium">
            Dashboard Executivo de Organização Pessoal — Produtividade e Planejamento.
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar (Pages and Categories Below) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-white/10 px-4 py-2.5 flex items-center justify-around pb-safe-bottom shadow-2xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center p-1.5 transition-all ${
            activeTab === 'overview' ? 'text-indigo-400' : 'text-slate-450'
          }`}
        >
          <DynamicIcon name="Layers" size={16} />
          <span className="text-[9px] font-bold mt-1">Geral</span>
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center justify-center p-1.5 transition-all ${
            activeTab === 'finance' ? 'text-indigo-400' : 'text-slate-450'
          }`}
        >
          <DynamicIcon name="DollarSign" size={16} />
          <span className="text-[9px] font-bold mt-1">Finanças</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center p-1.5 transition-all ${
            activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-450'
          }`}
        >
          <DynamicIcon name="CheckSquare" size={16} />
          <span className="text-[9px] font-bold mt-1">Tarefas</span>
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`flex flex-col items-center justify-center p-1.5 transition-all ${
            activeTab === 'health' ? 'text-indigo-400' : 'text-slate-450'
          }`}
        >
          <DynamicIcon name="HeartPulse" size={16} />
          <span className="text-[9px] font-bold mt-1">Saúde</span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center p-1.5 transition-all text-slate-450 hover:text-slate-200`}
        >
          <DynamicIcon name="Menu" size={16} />
          <span className="text-[9px] font-bold mt-1">Mais</span>
        </button>
      </div>

    </div>
  );
}
