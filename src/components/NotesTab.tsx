import React, { useState, useEffect, useMemo } from 'react';
import { useGoogleAuth } from './GoogleIntegration';
import { useToast } from './Toast';
import { DynamicIcon } from './Icons';
import { LocalNote, LocalNoteCategory } from '../types';

export default function NotesTab() {
  const {
    isConnected,
    googleKeepNotes,
    isLoadingKeep,
    addGoogleKeepNote,
    deleteGoogleKeepNote,
    togglePinKeepNote,
    updateKeepNoteColor,
    loginWithGoogle,
  } = useGoogleAuth();

  const { toast } = useToast();

  // Active sub-tab inside notes: 'local' or 'keep'
  const [activeNotesSubTab, setActiveNotesSubTab] = useState<'local' | 'keep'>('local');

  // ==========================================
  // STATE FOR LOCAL NOTES & CATEGORIES
  // ==========================================
  const [localCategories, setLocalCategories] = useState<LocalNoteCategory[]>(() => {
    const saved = localStorage.getItem('personal_note_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat-geral', name: 'Geral', color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' },
      { id: 'cat-estudos', name: 'Estudos', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
      { id: 'cat-pessoal', name: 'Pessoal', color: 'bg-pink-500/10 border-pink-500/30 text-pink-300' },
      { id: 'cat-trabalho', name: 'Trabalho', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' }
    ];
  });

  const [localNotes, setLocalNotes] = useState<LocalNote[]>(() => {
    const saved = localStorage.getItem('personal_local_notes');
    return saved ? JSON.parse(saved) : [
      {
        id: 'ln-1',
        categoryId: 'cat-trabalho',
        title: 'Controle de Diárias - Garçom',
        content: 'Falar com o gerente para confirmar escala de Sábado e Domingo. A diária é R$ 150 e cada dia trabalhado deve ser marcado na aba "Controle de Trabalho" para acumular no saldo.',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ln-2',
        categoryId: 'cat-estudos',
        title: 'Revisão de Redes de Computadores',
        content: 'Focar na arquitetura TCP/IP, nas funções da camada de transporte e protocolos de roteamento de rede para a prova prática do semestre.',
        updatedAt: new Date().toISOString()
      }
    ];
  });

  // Persist Local Notes state
  useEffect(() => {
    localStorage.setItem('personal_note_categories', JSON.stringify(localCategories));
  }, [localCategories]);

  useEffect(() => {
    localStorage.setItem('personal_local_notes', JSON.stringify(localNotes));
  }, [localNotes]);

  // UI Form States for Local Notes
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategoryId, setNewNoteCategoryId] = useState('cat-geral');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Category creation form states
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-indigo-500/10 border-indigo-500/30 text-indigo-300');

  const CATEGORY_COLORS_PRESETS = [
    { label: 'Indigo', val: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' },
    { label: 'Esmeralda', val: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
    { label: 'Rosa', val: 'bg-pink-500/10 border-pink-500/30 text-pink-300' },
    { label: 'Amber/Laranja', val: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
    { label: 'Azul', val: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
    { label: 'Vermelho', val: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
    { label: 'Roxo', val: 'bg-purple-500/10 border-purple-500/30 text-purple-300' },
  ];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Informe um nome para a nova pasta de notas.', 'Campo Vazio');
      return;
    }

    const newCat: LocalNoteCategory = {
      id: 'cat_' + Math.random().toString(36).substring(2, 9),
      name: newCatName.trim(),
      color: newCatColor
    };

    setLocalCategories(prev => [...prev, newCat]);
    setNewNoteCategoryId(newCat.id);
    setNewCatName('');
    setShowCatModal(false);
    toast.success(`Categoria de notas "${newCat.name}" criada com sucesso!`, 'Categoria Criada');
  };

  const handleDeleteCategory = (categoryId: string, name: string) => {
    // Cannot delete the final remaining category
    if (localCategories.length <= 1) {
      toast.warning('Você precisa manter pelo menos uma categoria de notas ativa.', 'Ação Bloqueada');
      return;
    }

    // Delete category
    setLocalCategories(prev => prev.filter(c => c.id !== categoryId));
    
    // Move notes in deleted category to a remaining category or delete them
    const remainingCat = localCategories.find(c => c.id !== categoryId);
    const backupId = remainingCat ? remainingCat.id : 'cat-geral';

    setLocalNotes(prev => prev.map(n => n.categoryId === categoryId ? { ...n, categoryId: backupId } : n));
    
    if (activeCategoryFilter === categoryId) {
      setActiveCategoryFilter('all');
    }
    toast.info(`Categoria "${name}" excluída. Notas associadas foram movidas para a categoria "${remainingCat?.name || 'Geral'}".`, 'Categoria Excluída');
  };

  const handleCreateLocalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() && !newNoteTitle.trim()) {
      toast.error('Escreva um título ou conteúdo para criar sua nota.', 'Nota Vazia');
      return;
    }

    const newNote: LocalNote = {
      id: 'ln_' + Math.random().toString(36).substring(2, 9),
      categoryId: newNoteCategoryId,
      title: newNoteTitle.trim() || 'Nota sem Título',
      content: newNoteContent.trim(),
      updatedAt: new Date().toISOString()
    };

    setLocalNotes(prev => [newNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    toast.success('Sua nova nota foi guardada com sucesso no caderno!', 'Nota Criada');
  };

  const handleDeleteLocalNote = (noteId: string) => {
    setLocalNotes(prev => prev.filter(n => n.id !== noteId));
    toast.info('Nota excluída do caderno.', 'Nota Removida');
  };

  // Filter local notes by category and/or query
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  const filteredLocalNotes = useMemo(() => {
    return localNotes.filter(note => {
      const matchesCategory = activeCategoryFilter === 'all' || note.categoryId === activeCategoryFilter;
      const matchesSearch = note.title.toLowerCase().includes(localSearchQuery.toLowerCase()) || 
                            note.content.toLowerCase().includes(localSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [localNotes, activeCategoryFilter, localSearchQuery]);

  // ==========================================
  // KEEP SYNCED FORM STATES & HANDLERS
  // ==========================================
  const [keepTitle, setKeepTitle] = useState('');
  const [keepContent, setKeepContent] = useState('');
  const [keepColor, setKeepColor] = useState('bg-slate-900 border-white/5');
  const [keepDueDate, setKeepDueDate] = useState('');
  const [keepReminderTime, setKeepReminderTime] = useState('');
  const [keepReminderActive, setKeepReminderActive] = useState(false);
  const [keepSearch, setKeepSearch] = useState('');
  const [isKeepFormExpanded, setIsKeepFormExpanded] = useState(false);

  const handleAddKeepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keepContent.trim() && !keepTitle.trim()) {
      setIsKeepFormExpanded(false);
      return;
    }
    await addGoogleKeepNote(
      keepTitle,
      keepContent,
      keepColor,
      keepDueDate || undefined,
      keepReminderTime || undefined,
      keepReminderActive && !!keepDueDate && !!keepReminderTime
    );
    setKeepTitle('');
    setKeepContent('');
    setKeepColor('bg-slate-900 border-white/5');
    setKeepDueDate('');
    setKeepReminderTime('');
    setKeepReminderActive(false);
    setIsKeepFormExpanded(false);
  };

  const filteredKeepNotes = googleKeepNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(keepSearch.toLowerCase()) ||
      note.content.toLowerCase().includes(keepSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Segment Switcher at the Top */}
      <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 max-w-md">
        <button
          onClick={() => setActiveNotesSubTab('local')}
          className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeNotesSubTab === 'local'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DynamicIcon name="Layers" size={13} />
          Caderno de Notas
        </button>
        <button
          onClick={() => setActiveNotesSubTab('keep')}
          className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeNotesSubTab === 'keep'
              ? 'bg-yellow-400 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DynamicIcon name="Lightbulb" size={13} />
          Google Keep Sync
        </button>
      </div>

      {/* ==========================================
          TAB 1: LOCAL NOTEBOOKS & CATEGORIES
          ========================================== */}
      {activeNotesSubTab === 'local' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl space-y-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <DynamicIcon name="Layers" className="text-emerald-400" size={22} />
              Notas e Cadernos de Atividades
            </h2>
            <p className="text-xs text-slate-400">
              Crie pastas de categorização personalizadas (Estudos, Trabalho, Pessoal) e adicione anotações organizadas para uso offline imediato.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left sidebar: Note categories selection & creation */}
            <div className="lg:col-span-4 rounded-3xl border border-white/5 bg-slate-900/40 p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <DynamicIcon name="Folder" size={13} className="text-emerald-400" />
                  Pastas / Categorias
                </h3>
                <button
                  onClick={() => setShowCatModal(true)}
                  className="text-[10px] font-extrabold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer uppercase"
                >
                  <DynamicIcon name="Plus" size={11} /> Nova
                </button>
              </div>

              {/* Category Filter Buttons List */}
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveCategoryFilter('all')}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                    activeCategoryFilter === 'all'
                      ? 'bg-white/10 border-white/15 text-white shadow'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    📁 Mostrar Todas as Notas
                  </span>
                  <span className="text-[10px] bg-slate-950/40 px-2 py-0.5 rounded-md text-slate-400 font-mono">
                    {localNotes.length}
                  </span>
                </button>

                {localCategories.map((cat) => {
                  const count = localNotes.filter(n => n.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className={`group relative rounded-2xl border transition-all flex items-center justify-between ${
                        activeCategoryFilter === cat.id
                          ? 'bg-white/10 border-white/15 text-white shadow'
                          : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.02]'
                      }`}
                    >
                      <button
                        onClick={() => setActiveCategoryFilter(cat.id)}
                        className="flex-1 text-left px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${cat.color.split(' ')[0]}`} />
                        <span>{cat.name}</span>
                        <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded-md text-slate-500 font-mono ml-auto mr-4">
                          {count}
                        </span>
                      </button>

                      {/* Deletion cross (hidden by default, shown on hover) */}
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="absolute right-2 text-slate-500 hover:text-rose-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Excluir Pasta"
                      >
                        <DynamicIcon name="X" size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add category quick popup within card */}
              {showCatModal && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3 animate-fade-in">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Criar Pasta de Notas</span>
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Ex: Trabalho Extra, Pessoal, Metas"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-450 uppercase block">Escolha uma Cor</span>
                      <div className="flex flex-wrap gap-1">
                        {CATEGORY_COLORS_PRESETS.map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setNewCatColor(preset.val)}
                            className={`h-5 w-5 rounded-full cursor-pointer border transition-all ${preset.val.split(' ')[0]} ${
                              newCatColor === preset.val ? 'scale-115 border-white' : 'border-transparent'
                            }`}
                            title={preset.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowCatModal(false)}
                        className="text-[10px] font-bold text-slate-400 hover:underline px-2 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-500 text-slate-950 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                      >
                        Criar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right main area: note creator & listing */}
            <div className="lg:col-span-8 space-y-6">
              {/* Note Creator Form */}
              <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5 shadow-xl">
                <form onSubmit={handleCreateLocalNote} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <input
                      type="text"
                      placeholder="Título da anotação..."
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none w-full sm:flex-1"
                    />

                    {/* Category Selection dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                      <span className="text-[9px] font-extrabold text-slate-450 uppercase">Salvar em:</span>
                      <select
                        value={newNoteCategoryId}
                        onChange={(e) => setNewNoteCategoryId(e.target.value)}
                        className="bg-transparent text-[11px] font-extrabold text-indigo-400 focus:outline-none border-none cursor-pointer"
                      >
                        {localCategories.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                            📂 {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    placeholder="Comece a digitar sua nota importante aqui..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none border-t border-white/5 pt-3 leading-relaxed"
                  />

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <DynamicIcon name="Plus" size={13} /> Guardar Nota
                    </button>
                  </div>
                </form>
              </div>

              {/* Local Notes Display Grid */}
              <div className="space-y-4">
                {/* Search notes bar */}
                <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2 flex-1">
                    <DynamicIcon name="Search" size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar notas locais..."
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none flex-1 placeholder-slate-500"
                    />
                  </div>
                  {localSearchQuery && (
                    <button
                      onClick={() => setLocalSearchQuery('')}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {filteredLocalNotes.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/20 rounded-3xl border border-white/5 text-slate-500 text-xs space-y-1">
                    <p className="font-semibold text-slate-400">Nenhuma nota encontrada nesta pasta.</p>
                    <p className="text-[10px] text-slate-500">Escreva uma anotação no formulário acima para guardá-la.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLocalNotes.map((note) => {
                      const category = localCategories.find(c => c.id === note.categoryId);
                      return (
                        <div
                          key={note.id}
                          className="p-5 rounded-3xl border border-white/5 bg-slate-900/40 hover:border-white/10 transition-all flex flex-col justify-between relative group shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              {/* Category Badge */}
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                category ? category.color : 'bg-white/5 border-white/5 text-slate-400'
                              }`}>
                                {category ? category.name : 'Outro'}
                              </span>

                              <span className="text-[9px] text-slate-500 font-bold font-mono">
                                {new Date(note.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                                {new Date(note.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <h4 className="text-xs font-black text-white tracking-tight leading-snug">{note.title}</h4>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                            <button
                              onClick={() => handleDeleteLocalNote(note.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Excluir Nota"
                            >
                              <DynamicIcon name="Trash2" size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: KEEP SYNCHRONIZED NOTES
          ========================================== */}
      {activeNotesSubTab === 'keep' && (
        <div className="space-y-6 animate-fade-in">
          {/* Keep Header with details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 p-6 rounded-3xl">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <DynamicIcon name="Lightbulb" className="text-yellow-400" size={22} />
                Google Keep Notas & Ideias
              </h2>
              <p className="text-xs text-slate-400">
                Crie anotações coloridas e agende lembretes sonoros em tempo real sincronizados com sua conta Google.
              </p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2.5 self-start md:self-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-slate-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Conectado ao Keep
                </span>
              </div>
            )}
          </div>

          {!isConnected ? (
            <div className="rounded-3xl bg-slate-900/50 border border-white/10 p-12 text-center max-w-2xl mx-auto space-y-5 shadow-2xl">
              <div className="h-16 w-16 bg-yellow-400/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                <DynamicIcon name="Lightbulb" size={32} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">Notas e Lembretes Sincronizados</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Conecte sua conta do Google Keep para visualizar seu mural de notas rápidas, estilizar cartões com cores de categorização e configurar alertas sonoros personalizados.
                </p>
              </div>
              <button
                onClick={loginWithGoogle}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold h-11 px-6 rounded-xl flex items-center justify-center gap-2.5 mx-auto transition-all shadow-lg cursor-pointer"
              >
                <DynamicIcon name="Key" size={14} />
                Conectar com Google Keep
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Note Creator Widget */}
              <div className="max-w-xl mx-auto">
                <div
                  className={`rounded-2xl border transition-all shadow-lg ${
                    isKeepFormExpanded
                      ? `${keepColor} p-4 space-y-3`
                      : 'bg-slate-900/40 border-white/10 p-3 flex items-center justify-between cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isKeepFormExpanded) setIsKeepFormExpanded(true);
                  }}
                >
                  {!isKeepFormExpanded ? (
                    <>
                      <span className="text-xs text-slate-450 font-medium">Criar uma nota com lembrete no Keep...</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <button
                          type="button"
                          className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsKeepFormExpanded(true);
                            setKeepReminderActive(true);
                          }}
                        >
                          <DynamicIcon name="Bell" size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsKeepFormExpanded(true);
                          }}
                        >
                          <DynamicIcon name="Palette" size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleAddKeepSubmit} className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          placeholder="Título"
                          value={keepTitle}
                          onChange={(e) => setKeepTitle(e.target.value)}
                          className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-450 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setIsKeepFormExpanded(false)}
                          className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          <DynamicIcon name="X" size={14} />
                        </button>
                      </div>

                      <textarea
                        placeholder="Criar uma nota..."
                        value={keepContent}
                        onChange={(e) => setKeepContent(e.target.value)}
                        rows={3}
                        className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-450 focus:outline-none resize-none"
                      />

                      {/* Reminder config */}
                      <div className="grid grid-cols-2 gap-2 bg-black/10 p-2.5 rounded-xl border border-white/5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Data do Lembrete</label>
                          <input
                            type="date"
                            value={keepDueDate}
                            onChange={(e) => setKeepDueDate(e.target.value)}
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Horário</label>
                          <input
                            type="time"
                            value={keepReminderTime}
                            onChange={(e) => setKeepReminderTime(e.target.value)}
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id="keepReminderActive"
                            checked={keepReminderActive}
                            onChange={(e) => setKeepReminderActive(e.target.checked)}
                            className="h-3.5 w-3.5 text-indigo-500 rounded bg-slate-900 border-white/10 cursor-pointer"
                          />
                          <label htmlFor="keepReminderActive" className="text-[10px] text-slate-300 font-medium cursor-pointer">
                            Ativar Alerta Sonoro no Horário 🔔
                          </label>
                        </div>
                      </div>

                      {/* Options Toolbar: Palette, Reminders & Submit Button */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                            {[
                              { label: 'Padrão', val: 'bg-slate-900 border-white/5' },
                              { label: 'Vermelho', val: 'bg-red-500/10 border-red-500/30 text-red-300' },
                              { label: 'Laranja', val: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
                              { label: 'Amarelo', val: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' },
                              { label: 'Verde', val: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
                              { label: 'Azul', val: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
                              { label: 'Roxo', val: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' },
                              { label: 'Rosa', val: 'bg-pink-500/10 border-pink-500/30 text-pink-300' },
                            ].map((c) => (
                              <button
                                key={c.val}
                                type="button"
                                onClick={() => setKeepColor(c.val)}
                                className={`h-4.5 w-4.5 rounded-full border cursor-pointer transition-transform hover:scale-125 ${c.val.split(' ')[0]} ${
                                  keepColor === c.val ? 'border-white scale-110' : 'border-transparent'
                                }`}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="bg-white text-slate-950 px-3 py-1 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Salvar no Keep
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Notes listing */}
              <div className="space-y-4">
                {/* Search notes bar */}
                <div className="flex items-center justify-between gap-4 max-w-xl mx-auto bg-white/5 border border-white/5 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2 flex-1">
                    <DynamicIcon name="Search" size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar notas no Keep..."
                      value={keepSearch}
                      onChange={(e) => setKeepSearch(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none flex-1 placeholder-slate-500"
                    />
                  </div>
                  {keepSearch && (
                    <button
                      onClick={() => setKeepSearch('')}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Grid layout */}
                {filteredKeepNotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    {isLoadingKeep ? 'Carregando notas do Keep...' : 'Nenhuma nota encontrada no seu mural do Google Keep.'}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pinned section if any */}
                    {filteredKeepNotes.some((n) => n.isPinned) && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Fixadas</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredKeepNotes
                            .filter((n) => n.isPinned)
                            .map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                onDelete={deleteGoogleKeepNote}
                                onTogglePin={togglePinKeepNote}
                                onUpdateColor={updateKeepNoteColor}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Other section */}
                    <div className="space-y-2">
                      {filteredKeepNotes.some((n) => n.isPinned) && (
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-1">Outras</span>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredKeepNotes
                          .filter((n) => !n.isPinned)
                          .map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onDelete={deleteGoogleKeepNote}
                              onTogglePin={togglePinKeepNote}
                              onUpdateColor={updateKeepNoteColor}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NoteCardProps {
  key?: string | number;
  note: any;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
}

function NoteCard({ note, onDelete, onTogglePin, onUpdateColor }: NoteCardProps) {
  const [showColors, setShowColors] = useState(false);

  return (
    <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all relative group shadow-sm ${note.color}`}>
      <button
        onClick={() => onTogglePin(note.id)}
        className={`absolute top-3 right-3 p-1 rounded-lg bg-black/20 text-slate-400 hover:text-white transition-opacity cursor-pointer ${
          note.isPinned ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-100'
        }`}
        title={note.isPinned ? 'Desafixar nota' : 'Fixar nota'}
      >
        <DynamicIcon name="Pin" size={12} className={note.isPinned ? 'fill-yellow-400 text-yellow-400 animate-pulse' : ''} />
      </button>

      <div className="space-y-2 pr-4">
        {note.title && <h4 className="text-xs font-bold text-white tracking-tight">{note.title}</h4>}
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative">
        <div className="flex items-center gap-1.5">
          {note.reminderActive && (
            <span className="text-[9px] text-amber-400 font-bold font-mono bg-amber-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse border border-amber-500/20">
              <DynamicIcon name="Bell" size={9} />
              {note.reminderTime}
            </span>
          )}
          {note.reminderTriggered && (
            <span className="text-[9px] text-slate-450 font-bold font-mono bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <DynamicIcon name="Check" size={9} />
              Lembrete enviado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick Color Picker button */}
          <div className="relative">
            <button
              onClick={() => setShowColors(!showColors)}
              className="p-1 rounded bg-black/20 text-slate-400 hover:text-white hover:bg-black/40 cursor-pointer"
              title="Mudar cor"
            >
              <DynamicIcon name="Palette" size={11} />
            </button>
            {showColors && (
              <div className="absolute bottom-6 left-0 flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-lg shadow-xl z-20">
                {[
                  'bg-slate-900 border-white/5',
                  'bg-red-500/10 border-red-500/30 text-red-300',
                  'bg-amber-500/10 border-amber-500/30 text-amber-300',
                  'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                  'bg-blue-500/10 border-blue-500/30 text-blue-300',
                  'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
                  'bg-pink-500/10 border-pink-500/30 text-pink-300',
                ].map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      onUpdateColor(note.id, col);
                      setShowColors(false);
                    }}
                    className={`h-4 w-4 rounded-full border cursor-pointer ${col.split(' ')[0]} ${
                      note.color === col ? 'border-white' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onDelete(note.id)}
            className="p-1 rounded bg-black/20 text-slate-400 hover:text-rose-400 hover:bg-black/40 cursor-pointer"
            title="Excluir nota"
          >
            <DynamicIcon name="Trash" size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
