import React, { useState, useMemo, useRef } from 'react';
import { 
  KanbanCard, 
  Project, 
  ProjectAlert, 
  ProjectJourneyLog, 
  KanbanCardLink, 
  KanbanCardAttachment, 
  KanbanCardSubtask, 
  KanbanCardJourney 
} from '../types';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  PlusCircle, 
  FolderPlus, 
  Folder, 
  Eye, 
  Image as ImageIcon, 
  Link2, 
  FileText, 
  History, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Briefcase, 
  Activity, 
  Save, 
  ExternalLink, 
  AlertTriangle,
  CheckSquare,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface ProjectsTabProps {
  cards: KanbanCard[];
  onAddCard: (card: Omit<KanbanCard, 'id'>) => void;
  onMoveCard: (id: string, nextCol: 'todo' | 'inprogress' | 'done') => void;
  onDeleteCard: (id: string) => void;
  onUpdateCard?: (card: KanbanCard) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function ProjectsTab({ 
  cards, 
  onAddCard, 
  onMoveCard, 
  onDeleteCard, 
  onUpdateCard,
  projects,
  setProjects
}: ProjectsTabProps) {
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'kanban' | 'projects'>('kanban');

  // Kanban State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Trabalho');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderActive, setReminderActive] = useState(false);
  const [filterProj, setFilterProj] = useState('all');

  // Detail / Editing Card Modal
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [newJourneyNote, setNewJourneyNote] = useState('');

  // Project Management State
  const [showAddProjForm, setShowAddProjForm] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCover, setProjCover] = useState('');
  const [projNotes, setProjNotes] = useState('');
  
  // Project detail modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDate, setNewAlertDate] = useState('');
  const [newAlertTime, setNewAlertTime] = useState('');
  const [newProjLogNote, setNewProjLogNote] = useState('');
  const [newProjLogProgress, setNewProjLogProgress] = useState(50);

  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const projFileInputRef = useRef<HTMLInputElement>(null);
  const projEditFileInputRef = useRef<HTMLInputElement>(null);

  // Categories lists (synced with both static categories and active projects)
  const allCategories = useMemo(() => {
    const staticCats = ['Pessoal', 'Trabalho', 'Finanças', 'Inovação'];
    const dynamicCats = projects.map(p => p.name);
    return Array.from(new Set([...staticCats, ...dynamicCats]));
  }, [projects]);

  // Sync category select with dynamic projects if possible
  React.useEffect(() => {
    if (allCategories.length > 0 && !allCategories.includes(category)) {
      setCategory(allCategories[0]);
    }
  }, [allCategories, category]);

  // Task creation
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('O título da atividade é obrigatório!', 'Nome Vazio');
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
      links: [],
      attachments: [],
      subtasks: [],
      journey: [
        {
          id: 'j_' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          note: 'Atividade criada e adicionada à lista A Fazer.',
          type: 'status'
        }
      ]
    });
    setTitle('');
    setDesc('');
    setDueDate('');
    setReminderTime('');
    setReminderActive(false);
    setShowAddForm(false);
    toast.success('Tarefa criada e integrada ao seu cronograma!', 'Sucesso');
  };

  // Quick state move
  const handleMove = (id: string, current: 'todo' | 'inprogress' | 'done', direction: 'left' | 'right') => {
    let nextCol: 'todo' | 'inprogress' | 'done';
    if (current === 'todo') {
      nextCol = 'inprogress';
    } else if (current === 'inprogress') {
      nextCol = direction === 'left' ? 'todo' : 'done';
    } else {
      nextCol = 'inprogress';
    }

    // Also update card journey log if onUpdateCard exists
    const card = cards.find(c => c.id === id);
    if (card && onUpdateCard) {
      const updatedJourney = [
        ...(card.journey || []),
        {
          id: 'j_' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          note: `Etapa alterada de ${current.toUpperCase()} para ${nextCol.toUpperCase()}`,
          type: 'status' as const
        }
      ];
      onUpdateCard({
        ...card,
        column: nextCol,
        journey: updatedJourney
      });
    } else {
      onMoveCard(id, nextCol);
    }

    toast.info(`Card movido para "${nextCol === 'todo' ? 'A Fazer' : nextCol === 'inprogress' ? 'Em Progresso' : 'Concluído'}"!`, 'Card Atualizado');
  };

  // Convert files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'card' | 'project_add' | 'project_edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo não pode exceder 5MB.', 'Arquivo Muito Grande');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === 'card' && selectedCard && onUpdateCard) {
        const newAttachment: KanbanCardAttachment = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          dataUrl: base64,
          type: file.type
        };
        const updated = {
          ...selectedCard,
          attachments: [...(selectedCard.attachments || []), newAttachment],
          journey: [
            ...(selectedCard.journey || []),
            {
              id: 'j_' + Math.random().toString(36).substring(2, 9),
              timestamp: new Date().toISOString(),
              note: `Anexou arquivo: ${file.name}`,
              type: 'attachment' as const
            }
          ]
        };
        setSelectedCard(updated);
        onUpdateCard(updated);
        toast.success(`Arquivo ${file.name} anexado com sucesso!`, 'Anexo Adicionado');
      } else if (target === 'project_add') {
        setProjCover(base64);
        toast.info('Imagem de capa carregada para o formulário.', 'Capa Pronta');
      } else if (target === 'project_edit' && selectedProject) {
        const updated = { ...selectedProject, coverImage: base64 };
        setSelectedProject(updated);
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success('Imagem de capa do projeto atualizada!', 'Sucesso');
      }
    };
    reader.readAsDataURL(file);
  };

  // Create project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      toast.error('O nome do projeto é obrigatório!', 'Erro');
      return;
    }
    const newProj: Project = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: projName.trim(),
      description: projDesc.trim(),
      coverImage: projCover || undefined,
      annotations: projNotes.trim() || undefined,
      progress: 0,
      alerts: [],
      journey: [
        {
          id: 'pj_' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          note: 'Projeto iniciado no sistema.',
          progress: 0
        }
      ],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setProjects(prev => [...prev, newProj]);
    setProjName('');
    setProjDesc('');
    setProjCover('');
    setProjNotes('');
    setShowAddProjForm(false);
    toast.success(`Projeto "${newProj.name}" criado com sucesso!`, 'Projeto Criado');
  };

  // Add Link to card
  const handleAddCardLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      toast.error('Preencha o nome e o link da URL!', 'Campos Vazios');
      return;
    }
    let formattedUrl = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    if (selectedCard && onUpdateCard) {
      const newLink: KanbanCardLink = {
        id: 'link_' + Math.random().toString(36).substring(2, 9),
        label: newLinkLabel.trim(),
        url: formattedUrl
      };
      const updated = {
        ...selectedCard,
        links: [...(selectedCard.links || []), newLink],
        journey: [
          ...(selectedCard.journey || []),
          {
            id: 'j_' + Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            note: `Adicionou link externo: ${newLink.label}`,
            type: 'link' as const
          }
        ]
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
      setNewLinkLabel('');
      setNewLinkUrl('');
      toast.success('Link adicionado com sucesso!', 'Link Salvo');
    }
  };

  // Remove card Link
  const handleRemoveCardLink = (id: string) => {
    if (selectedCard && onUpdateCard) {
      const filtered = (selectedCard.links || []).filter(l => l.id !== id);
      const updated = {
        ...selectedCard,
        links: filtered
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
      toast.info('Link removido.', 'Atualizado');
    }
  };

  // Add Checklist item to card
  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    if (selectedCard && onUpdateCard) {
      const newSub: KanbanCardSubtask = {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        text: newSubtaskText.trim(),
        completed: false
      };
      const updated = {
        ...selectedCard,
        subtasks: [...(selectedCard.subtasks || []), newSub]
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
      setNewSubtaskText('');
      toast.success('Subtarefa adicionada ao checklist.', 'Sucesso');
    }
  };

  // Toggle checklist subtask
  const handleToggleSubtask = (id: string) => {
    if (selectedCard && onUpdateCard) {
      const mapped = (selectedCard.subtasks || []).map(s => s.id === id ? { ...s, completed: !s.completed } : s);
      const updated = {
        ...selectedCard,
        subtasks: mapped
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
    }
  };

  // Remove checklist item
  const handleRemoveSubtask = (id: string) => {
    if (selectedCard && onUpdateCard) {
      const filtered = (selectedCard.subtasks || []).filter(s => s.id !== id);
      const updated = {
        ...selectedCard,
        subtasks: filtered
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
    }
  };

  // Add Annotation log to card journey
  const handleAddJourneyNote = () => {
    if (!newJourneyNote.trim()) return;
    if (selectedCard && onUpdateCard) {
      const updated = {
        ...selectedCard,
        journey: [
          ...(selectedCard.journey || []),
          {
            id: 'j_' + Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            note: newJourneyNote.trim(),
            type: 'annotation' as const
          }
        ]
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
      setNewJourneyNote('');
      toast.success('Anotação registrada na jornada desta atividade!', 'Jornada Sincronizada');
    }
  };

  // Save general modifications on selected card
  const handleSaveCardMetaChanges = (field: string, value: any) => {
    if (selectedCard && onUpdateCard) {
      const updated = {
        ...selectedCard,
        [field]: value,
        journey: [
          ...(selectedCard.journey || []),
          {
            id: 'j_' + Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            note: `Atributo alterado (${field}): ${value}`,
            type: 'edit' as const
          }
        ]
      };
      setSelectedCard(updated);
      onUpdateCard(updated);
    }
  };

  // Filter cards for Kanban Columns
  const filteredCards = cards.filter(c => filterProj === 'all' || c.category === filterProj);
  const todoCards = filteredCards.filter(c => c.column === 'todo');
  const inProgressCards = filteredCards.filter(c => c.column === 'inprogress');
  const doneCards = filteredCards.filter(c => c.column === 'done');

  // Calculates dynamic project progress based on its kanban tasks completion
  const getProjectProgress = (projectName: string, manualProgress?: number) => {
    const projectCards = cards.filter(c => c.category === projectName);
    if (projectCards.length === 0) return manualProgress || 0;
    const completed = projectCards.filter(c => c.column === 'done').length;
    return Math.round((completed / projectCards.length) * 100);
  };

  // Add alarm date to project
  const handleAddProjectAlert = () => {
    if (!newAlertTitle.trim() || !newAlertDate || !newAlertTime || !selectedProject) return;

    const newAlert: ProjectAlert = {
      id: 'al_' + Math.random().toString(36).substring(2, 9),
      title: newAlertTitle.trim(),
      date: newAlertDate,
      time: newAlertTime,
      reminderActive: true
    };

    const updated = {
      ...selectedProject,
      alerts: [...(selectedProject.alerts || []), newAlert]
    };

    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setNewAlertTitle('');
    setNewAlertDate('');
    setNewAlertTime('');
    toast.success('Alerta de projeto agendado e integrado à agenda global!', 'Alerta Criado');
  };

  // Delete project alarm
  const handleDeleteProjectAlert = (alertId: string) => {
    if (!selectedProject) return;
    const filtered = (selectedProject.alerts || []).filter(al => al.id !== alertId);
    const updated = {
      ...selectedProject,
      alerts: filtered
    };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    toast.info('Lembrete de alerta excluído.', 'Atualizado');
  };

  // Add log / journey entry for project process
  const handleAddProjectLog = () => {
    if (!newProjLogNote.trim() || !selectedProject) return;

    const newLog: ProjectJourneyLog = {
      id: 'pl_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      note: newProjLogNote.trim(),
      progress: newProjLogProgress
    };

    const updated = {
      ...selectedProject,
      progress: newProjLogProgress,
      journey: [newLog, ...(selectedProject.journey || [])]
    };

    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setNewProjLogNote('');
    toast.success('Diário de jornada do projeto atualizado!', 'Sucesso');
  };

  // Save general modifications on selected project annotations
  const handleSaveProjectAnnotations = (newAnnotations: string) => {
    if (!selectedProject) return;
    const updated = {
      ...selectedProject,
      annotations: newAnnotations
    };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    toast.success('Anotações do projeto salvas com sucesso!', 'Salvo');
  };

  // Delete overall project
  const handleDeleteProject = (projId: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir o projeto "${name}"? Todas as anotações e lembretes serão excluídos.`)) {
      setProjects(prev => prev.filter(p => p.id !== projId));
      if (selectedProject?.id === projId) {
        setSelectedProject(null);
      }
      toast.warning(`Projeto "${name}" e todos os seus recursos foram desativados.`, 'Excluído');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      
      {/* Dynamic Sub-header Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <ClipboardList className="text-indigo-400" size={18} />
            Gerenciador de Projetos e Quadro Kanban
          </h2>
          <p className="text-xs text-slate-400">Monitore sprints, faça anotações detalhadas, anexe arquivos e acompanhe lembretes integrados</p>
        </div>

        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 gap-1 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveSubTab('kanban')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'kanban' 
                ? 'bg-indigo-500 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare size={13} />
            Quadro Kanban
          </button>
          <button
            onClick={() => setActiveSubTab('projects')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'projects' 
                ? 'bg-indigo-500 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase size={13} />
            Meus Projetos ({projects.length})
          </button>
        </div>
      </div>

      {/* ======================= SUB-TAB 1: KANBAN WORKSPACE ======================= */}
      {activeSubTab === 'kanban' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Quadro Sprint de Atividades</h3>
              <p className="text-[10px] text-slate-400">Clique em qualquer tarefa para abri-la e anexar mídias, links, notas ou checklist.</p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select
                value={filterProj}
                onChange={(e) => setFilterProj(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 flex-1 md:flex-initial"
              >
                <option value="all">Filtrar por Projeto/Etiqueta</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow"
              >
                <Plus size={14} />
                <span>{showAddForm ? 'Cancelar' : 'Nova Tarefa'}</span>
              </button>
            </div>
          </div>

          {/* Add Kanban Card Form */}
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
                  className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4 max-w-3xl"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Título da Atividade</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Desenvolver fluxo de checkout..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Vincular a Projeto / Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Prioridade</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="low">🟢 Baixa</option>
                        <option value="medium">🟡 Média</option>
                        <option value="high">🔴 Alta</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Descrição & Notas Rápidas</label>
                    <textarea
                      placeholder="Anote detalhes de requisitos mínimos ou passos gerais..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Prazo de Entrega (Opcional)</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Horário Lembrete</label>
                      <input
                        type="time"
                        value={reminderTime}
                        disabled={!dueDate}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-45"
                      />
                    </div>

                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 cursor-pointer h-9 select-none pb-1 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={reminderActive}
                          disabled={!dueDate || !reminderTime}
                          onChange={(e) => setReminderActive(e.target.checked)}
                          className="h-4 w-4 bg-slate-950 border border-white/10 rounded text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                        />
                        <span>Ativar Notificação de Prioridade</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold h-10 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Plus size={14} />
                    Adicionar no Quadro Kanban
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* COLUMN: TODO */}
            <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-4 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 block" /> A Fazer
                </span>
                <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
                  {todoCards.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {todoCards.length === 0 ? (
                  <p className="text-center py-12 text-[10px] text-slate-500 font-medium">Nenhuma atividade agendada.</p>
                ) : (
                  todoCards.map((c) => renderKanbanCardItem(c, 'todo'))
                )}
              </div>
            </div>

            {/* COLUMN: IN PROGRESS */}
            <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-4 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 block" /> Em Progresso
                </span>
                <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
                  {inProgressCards.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {inProgressCards.length === 0 ? (
                  <p className="text-center py-12 text-[10px] text-slate-500 font-medium font-mono">Quadro livre.</p>
                ) : (
                  inProgressCards.map((c) => renderKanbanCardItem(c, 'inprogress'))
                )}
              </div>
            </div>

            {/* COLUMN: DONE */}
            <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-4 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 block" /> Concluído
                </span>
                <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full text-slate-400">
                  {doneCards.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {doneCards.length === 0 ? (
                  <p className="text-center py-12 text-[10px] text-slate-500 font-medium">Nenhum card finalizado.</p>
                ) : (
                  doneCards.map((c) => renderKanbanCardItem(c, 'done'))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 2: PROJECTS PORTFOLIO ======================= */}
      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Seus Projetos Estratégicos</h3>
              <p className="text-[10px] text-slate-400">Insira prazos, configure imagens de capa e registre o processo histórico do projeto de ponta a ponta.</p>
            </div>

            <button
              onClick={() => setShowAddProjForm(!showAddProjForm)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <FolderPlus size={14} />
              <span>{showAddProjForm ? 'Cancelar' : 'Criar Novo Projeto'}</span>
            </button>
          </div>

          {/* Add Project Form */}
          <AnimatePresence>
            {showAddProjForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleCreateProject}
                  className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4 max-w-3xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nome do Projeto</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Trabalho, Faculdade..."
                          value={projName}
                          onChange={(e) => setProjName(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Resumo do Escopo</label>
                        <input
                          type="text"
                          placeholder="Ex: Requisitos e sprints de desenvolvimento..."
                          value={projDesc}
                          onChange={(e) => setProjDesc(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Imagem de Capa (Opcional)</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => projFileInputRef.current?.click()}
                            className="bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <ImageIcon size={13} /> Upload Capa
                          </button>
                          <input
                            type="file"
                            ref={projFileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'project_add')}
                          />
                          {projCover && (
                            <div className="relative h-10 w-16 rounded-lg overflow-hidden border border-white/10">
                              <img src={projCover} alt="Preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setProjCover('')}
                                className="absolute top-0 right-0 p-0.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full"
                              >
                                <X size={8} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Anotações Iniciais</label>
                        <textarea
                          placeholder="Digite considerações iniciais sobre as metas deste projeto..."
                          value={projNotes}
                          onChange={(e) => setProjNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <PlusCircle size={14} /> Salvar Novo Projeto
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Projects Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const dynProgress = getProjectProgress(proj.name, proj.progress);
              return (
                <div 
                  key={proj.id}
                  className="group rounded-3xl border border-white/5 bg-slate-900/40 overflow-hidden shadow-xl hover:border-indigo-500/25 transition-all flex flex-col justify-between"
                >
                  {/* Cover */}
                  <div className="relative h-28 bg-gradient-to-r from-slate-950 to-indigo-950 flex items-center justify-center overflow-hidden">
                    {proj.coverImage ? (
                      <img src={proj.coverImage} alt={proj.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="text-center opacity-30 space-y-1.5">
                        <Folder className="mx-auto text-indigo-400" size={24} />
                        <span className="text-[9px] uppercase tracking-widest font-black">Pasta do Projeto</span>
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 bg-slate-950/75 border border-white/10 text-[9px] text-indigo-300 font-extrabold px-2 py-0.5 rounded-md">
                      Estágio: Ativo
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-white leading-tight">{proj.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">{proj.description || 'Sem descrição cadastrada.'}</p>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-semibold">Progresso Sincronizado</span>
                        <strong className="text-indigo-400 font-mono">{dynProgress}%</strong>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${dynProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick alert reminder indicator */}
                    <div className="text-[10px] space-y-1 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px]">Próximos Lembretes</span>
                      {proj.alerts && proj.alerts.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold truncate">
                          <Bell size={10} className="shrink-0" />
                          <span>{proj.alerts[0].title} ({new Date(proj.alerts[0].date + 'T00:00:00').toLocaleDateString('pt-BR')})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Nenhum lembrete pendente.</span>
                      )}
                    </div>

                    {/* Actions panel */}
                    <div className="flex justify-between items-center pt-2 gap-2">
                      <button
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        className="text-[10px] font-bold text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Desativar
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProject(proj);
                          setNewProjLogProgress(proj.progress || 0);
                        }}
                        className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/15 text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow"
                      >
                        <Eye size={11} /> Gerenciar Projeto
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= DETAILED MODAL: KANBAN CARD EDITING ======================= */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      {selectedCard.category}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                      selectedCard.priority === 'high' ? 'bg-rose-500/15 text-rose-400' : selectedCard.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      Prioridade: {selectedCard.priority}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">{selectedCard.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left block: General properties, checklist, attachments, external links */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* General editing properties */}
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Parâmetros Principais</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Título do Card</label>
                        <input
                          type="text"
                          value={selectedCard.title}
                          onChange={(e) => handleSaveCardMetaChanges('title', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Vincular Projeto</label>
                        <select
                          value={selectedCard.category}
                          onChange={(e) => handleSaveCardMetaChanges('category', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Prioridade</label>
                        <select
                          value={selectedCard.priority}
                          onChange={(e) => handleSaveCardMetaChanges('priority', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Prazo de Entrega</label>
                        <input
                          type="date"
                          value={selectedCard.dueDate || ''}
                          onChange={(e) => handleSaveCardMetaChanges('dueDate', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Lembrete Ativo?</label>
                        <select
                          value={selectedCard.reminderActive ? 'true' : 'false'}
                          onChange={(e) => handleSaveCardMetaChanges('reminderActive', e.target.value === 'true')}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Inativo</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Checklist (Subtasks) for progress tracking */}
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CheckSquare size={12} className="text-indigo-400" /> Checklist de Progresso
                      </h5>
                      <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                        {selectedCard.subtasks && selectedCard.subtasks.length > 0
                          ? Math.round((selectedCard.subtasks.filter(s => s.completed).length / selectedCard.subtasks.length) * 100)
                          : 0}% Concluído
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedCard.subtasks && selectedCard.subtasks.length > 0 ? (
                        selectedCard.subtasks.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                              <input
                                type="checkbox"
                                checked={sub.completed}
                                onChange={() => handleToggleSubtask(sub.id)}
                                className="h-4 w-4 rounded bg-slate-950 border border-white/10 text-indigo-500 focus:ring-0 cursor-pointer"
                              />
                              <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                                {sub.text}
                              </span>
                            </label>
                            <button
                              onClick={() => handleRemoveSubtask(sub.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500">Nenhuma etapa pendente criada para este checklist.</p>
                      )}
                    </div>

                    {/* Add Subtask form */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Adicionar nova etapa de progresso..."
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleAddSubtask}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow"
                      >
                        Inserir
                      </button>
                    </div>
                  </div>

                  {/* External Links Section */}
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Link2 size={12} className="text-indigo-400" /> Links de Referência / Arquivos da Nuvem
                    </h5>
                    
                    <div className="space-y-2">
                      {selectedCard.links && selectedCard.links.length > 0 ? (
                        selectedCard.links.map(l => (
                          <div key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 text-xs">
                            <a 
                              href={l.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 hover:underline"
                            >
                              <ExternalLink size={11} />
                              {l.label}
                            </a>
                            <button
                              onClick={() => handleRemoveCardLink(l.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500">Nenhum link externo vinculado a esta atividade.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nome (Ex: Documentação, Repositório)"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Link da URL..."
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCardLink()}
                          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={handleAddCardLink}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Media / Attachments / Covers */}
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ImageIcon size={12} className="text-indigo-400" /> Mídias & Arquivos de Capa
                      </h5>
                      <button
                        type="button"
                        onClick={() => cardFileInputRef.current?.click()}
                        className="bg-slate-900 hover:bg-slate-850 border border-white/10 text-slate-300 font-extrabold px-3 py-1 rounded-xl text-[9px] uppercase transition-all cursor-pointer"
                      >
                        Anexar Arquivo
                      </button>
                      <input
                        type="file"
                        ref={cardFileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'card')}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedCard.attachments && selectedCard.attachments.length > 0 ? (
                        selectedCard.attachments.map(att => {
                          const isImg = att.type.startsWith('image/');
                          return (
                            <div key={att.id} className="relative group rounded-xl overflow-hidden border border-white/5 bg-slate-900 aspect-video flex flex-col justify-between shadow-md">
                              {isImg ? (
                                <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
                                  <FileText className="text-indigo-400 mb-1" size={16} />
                                  <span className="text-[8px] font-bold text-slate-300 truncate max-w-full">{att.name}</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => {
                                  if (selectedCard && onUpdateCard) {
                                    const filtered = (selectedCard.attachments || []).filter(a => a.id !== att.id);
                                    setSelectedCard({ ...selectedCard, attachments: filtered });
                                    onUpdateCard({ ...selectedCard, attachments: filtered });
                                    toast.info('Anexo removido.', 'Atualizado');
                                  }
                                }}
                                className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={8} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-6 text-center text-[10px] text-slate-500 font-medium">Nenhum arquivo ou foto de capa cadastrada para esta atividade.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right block: Journey log progress, Timeline tracking */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Journey Input annotation log */}
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <History size={12} className="text-indigo-400" /> Diário de Jornada
                    </h5>
                    <div className="space-y-2">
                      <textarea
                        placeholder="Digite anotações de evolução ou atualizações do progresso..."
                        value={newJourneyNote}
                        onChange={(e) => setNewJourneyNote(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <button
                        onClick={handleAddJourneyNote}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-extrabold uppercase py-2 rounded-xl transition-all shadow"
                      >
                        Registrar na Linha do Tempo
                      </button>
                    </div>
                  </div>

                  {/* Vertical Progress Journey Timeline */}
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Histórico de Atividades</h5>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {selectedCard.journey && selectedCard.journey.length > 0 ? (
                        selectedCard.journey.map((j) => (
                          <div key={j.id} className="relative pl-4 border-l border-white/10 space-y-1">
                            <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-900 block" />
                            <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono">
                              <span>{new Date(j.timestamp).toLocaleDateString('pt-BR')}</span>
                              <span>{new Date(j.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{j.note}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Sem eventos de histórico adicionados.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir card "${selectedCard.title}" definitivamente?`)) {
                          onDeleteCard(selectedCard.id);
                          setSelectedCard(null);
                          toast.warning('Card excluído permanentemente do quadro.', 'Excluído');
                        }
                      }}
                      className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/15 font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={12} /> Excluir Atividade
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================= DETAILED MODAL: PROJECT MANAGEMENT & DIARY ======================= */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6"
            >
              
              {/* Header and banner image */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 to-indigo-950 border border-white/5 flex items-center justify-center">
                {selectedProject.coverImage ? (
                  <img src={selectedProject.coverImage} alt={selectedProject.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center opacity-30 space-y-1.5">
                    <Folder className="mx-auto text-indigo-400" size={32} />
                    <span className="text-[11px] uppercase tracking-widest font-black">Pasta do Projeto</span>
                  </div>
                )}
                
                {/* Float controls */}
                <div className="absolute inset-0 bg-slate-950/50 flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-black uppercase text-indigo-400 tracking-wider">
                      Projeto: {selectedProject.name}
                    </div>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <button
                      type="button"
                      onClick={() => projEditFileInputRef.current?.click()}
                      className="bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon size={11} /> Alterar Capa
                    </button>
                    <input
                      type="file"
                      ref={projEditFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'project_edit')}
                    />

                    <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-900/90 px-3 py-1 rounded-lg border border-white/5">
                      Criado em {selectedProject.createdAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main project configuration details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left col: Scope description, rich notes text, alarms reminders list */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Rich annotations textbox */}
                  <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileText size={12} className="text-indigo-400" /> Caderno de Requisitos & Escopo
                      </h5>
                      <span className="text-[8px] font-black bg-slate-800 text-slate-400 uppercase px-2 py-0.5 rounded">Autosave Ativo</span>
                    </div>
                    <textarea
                      placeholder="Anote aqui diretrizes do projeto, notas de reuniões ou escopo operacional detalhado..."
                      value={selectedProject.annotations || ''}
                      onChange={(e) => handleSaveProjectAnnotations(e.target.value)}
                      rows={6}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-y leading-relaxed font-sans"
                    />
                  </div>

                  {/* Alerts & Reminders checklist (Agenda syncing) */}
                  <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Bell size={12} className="text-indigo-400 animate-bounce" /> Lembretes de Cronograma & Alertas de Prioridade
                    </h5>

                    {/* Active alerts list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProject.alerts && selectedProject.alerts.length > 0 ? (
                        selectedProject.alerts.map(al => (
                          <div key={al.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between gap-2 shadow-inner">
                            <div className="space-y-1">
                              <h6 className="text-xs font-extrabold text-white leading-tight">{al.title}</h6>
                              <div className="flex items-center gap-1.5 text-[9px] text-indigo-300 font-semibold">
                                <Calendar size={10} />
                                <span>{new Date(al.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {al.time}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteProjectAlert(al.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-6 text-[10px] text-slate-500">Nenhum lembrete associado a este projeto.</div>
                      )}
                    </div>

                    {/* New alert form */}
                    <div className="pt-2 border-t border-dashed border-white/5 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Novo Lembrete para a Agenda</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Compromisso/Tarefa (Ex: Entrega)"
                          value={newAlertTitle}
                          onChange={(e) => setNewAlertTitle(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="date"
                          value={newAlertDate}
                          onChange={(e) => setNewAlertDate(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={newAlertTime}
                            onChange={(e) => setNewAlertTime(e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleAddProjectAlert}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow"
                          >
                            Agendar
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right col: Timeline log logging process */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Journal Logging */}
                  <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity size={12} className="text-indigo-400" /> Registrar Status de Evolução
                    </h5>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Mensagem de Atualização</label>
                        <textarea
                          placeholder="Descreva o que foi concluído nesta sprint de trabalho..."
                          value={newProjLogNote}
                          onChange={(e) => setNewProjLogNote(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>PROGRESÃO ESTIMADA</span>
                          <span className="text-indigo-400">{newProjLogProgress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newProjLogProgress}
                          onChange={(e) => setNewProjLogProgress(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 bg-slate-950 cursor-pointer h-1.5 rounded-lg"
                        />
                      </div>

                      <button
                        onClick={handleAddProjectLog}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-extrabold uppercase py-2 rounded-xl transition-all shadow"
                      >
                        Publicar Status do Projeto
                      </button>
                    </div>
                  </div>

                  {/* Project Timeline logs list */}
                  <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Linha de Processo (Evolução)</h5>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                      {selectedProject.journey && selectedProject.journey.length > 0 ? (
                        selectedProject.journey.map(log => (
                          <div key={log.id} className="relative pl-4 border-l border-white/10 space-y-1">
                            <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-emerald-500" />
                            <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono">
                              <span>{new Date(log.timestamp).toLocaleDateString('pt-BR')}</span>
                              <span className="text-emerald-400 font-bold">Progresso: {log.progress || 0}%</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{log.note}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500">Sem atualizações registradas.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper method: renders individual Kanban Cards inside respective columns
  function renderKanbanCardItem(card: KanbanCard, col: 'todo' | 'inprogress' | 'done') {
    const totalSub = card.subtasks?.length || 0;
    const completedSub = card.subtasks?.filter(s => s.completed).length || 0;
    const hasProgress = totalSub > 0;
    const progressPercent = hasProgress ? Math.round((completedSub / totalSub) * 100) : 0;

    return (
      <div
        key={card.id}
        onClick={() => setSelectedCard(card)}
        className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 space-y-3 hover:border-indigo-500/30 hover:scale-[1.01] transition-all shadow-md cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div className="space-y-1">
            <span className="text-[9px] bg-slate-950 border border-white/5 text-indigo-300 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
              {card.category}
            </span>
            <h5 className="text-xs font-extrabold text-white mt-1 leading-snug group-hover:text-indigo-300 transition-colors">{card.title}</h5>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Excluir card "${card.title}"?`)) {
                onDeleteCard(card.id);
                toast.warning(`Atividade "${card.title}" excluída.`, 'Removido');
              }
            }}
            className="h-6 w-6 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Excluir card"
          >
            <Trash2 size={11} />
          </button>
        </div>

        {card.description && (
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2">{card.description}</p>
        )}

        {/* Links and Attachments micro indicators */}
        <div className="flex flex-wrap gap-1.5 text-[9px] font-semibold text-slate-400">
          {card.links && card.links.length > 0 && (
            <span className="flex items-center gap-1 bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5">
              <Link2 size={10} /> {card.links.length} links
            </span>
          )}
          {card.attachments && card.attachments.length > 0 && (
            <span className="flex items-center gap-1 bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5">
              <ImageIcon size={10} /> {card.attachments.length} midia(s)
            </span>
          )}
          {card.subtasks && card.subtasks.length > 0 && (
            <span className="flex items-center gap-1 bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5">
              <CheckSquare size={10} /> {completedSub}/{totalSub} etapas
            </span>
          )}
        </div>

        {/* Due Date details */}
        {(card.dueDate || (card.reminderTime && card.reminderActive)) && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
            {card.dueDate && (
              <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold bg-slate-950/40 px-2 py-0.5 rounded border border-white/5">
                <Clock size={10} className="text-indigo-400" />
                Entrega: {new Date(card.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            )}
            {card.reminderTime && card.reminderActive && (
              <span className="text-[9px] text-indigo-400 flex items-center gap-1 font-bold animate-pulse bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                <Bell size={10} />
                Prioritário: {card.reminderTime}
              </span>
            )}
          </div>
        )}

        {/* Checklist progress bar if checklist exists */}
        {hasProgress && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 font-mono">
              <span>CHECKLIST PROGRESS</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        )}

        {/* Priority footer */}
        <div className="flex justify-between items-center pt-2.5 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
              card.priority === 'high'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10'
                : card.priority === 'medium'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-slate-500/15 text-slate-400'
            }`}
          >
            {card.priority === 'high' ? 'Alta' : card.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>

          {/* Columns navigations */}
          <div className="flex gap-1.5">
            {col !== 'todo' && (
              <button
                onClick={() => handleMove(card.id, col, 'left')}
                className="h-6 w-6 bg-slate-950/60 hover:bg-slate-900 border border-white/5 text-slate-300 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                title="Mover para esquerda"
              >
                <ChevronLeft size={12} />
              </button>
            )}
            {col !== 'done' && (
              <button
                onClick={() => handleMove(card.id, col, 'right')}
                className="h-6 w-6 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md flex items-center justify-center cursor-pointer transition-all"
                title="Mover para direita"
              >
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
