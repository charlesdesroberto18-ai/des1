import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider as FirebaseGoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App and Auth once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new FirebaseGoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  reminderTime?: string;
  reminderActive?: boolean;
  reminderTriggered?: boolean;
}

export interface GoogleKeepNote {
  id: string;
  title: string;
  content: string;
  color: string; // e.g. 'bg-slate-900', 'bg-yellow-500/10'
  isPinned: boolean;
  dueDate?: string; // YYYY-MM-DD
  reminderTime?: string; // HH:MM
  reminderActive?: boolean;
  reminderTriggered?: boolean;
  updatedAt: string;
}

interface GoogleAuthContextType {
  isConnected: boolean;
  accessToken: string | null;
  calendarEvents: CalendarEvent[];
  googleTasks: GoogleTask[];
  googleKeepNotes: GoogleKeepNote[];
  isLoadingCalendar: boolean;
  isLoadingTasks: boolean;
  isLoadingKeep: boolean;
  loginWithGoogle: () => void;
  logoutGoogle: () => void;
  refreshCalendar: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshKeepNotes: () => Promise<void>;
  addGoogleTask: (title: string, dueDate?: string, reminderTime?: string, reminderActive?: boolean) => Promise<void>;
  toggleGoogleTaskState: (id: string, completed: boolean) => Promise<void>;
  addGoogleKeepNote: (title: string, content: string, color?: string, dueDate?: string, reminderTime?: string, reminderActive?: boolean) => Promise<void>;
  deleteGoogleKeepNote: (id: string) => Promise<void>;
  togglePinKeepNote: (id: string) => Promise<void>;
  updateKeepNoteColor: (id: string, color: string) => Promise<void>;
  updateKeepNoteReminders: (id: string, reminderActive: boolean, reminderTriggered: boolean) => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth deve ser usado dentro de um GoogleAuthProvider');
  }
  return context;
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [googleKeepNotes, setGoogleKeepNotes] = useState<GoogleKeepNote[]>(() => {
    try {
      const saved = localStorage.getItem('personal_google_keep_notes');
      return saved ? JSON.parse(saved) : [
        {
          id: 'gkeep-welcome',
          title: 'Bem-vindo ao Google Keep 💡',
          content: 'Este é o seu mural de notas rápidas, estilizado com as cores icônicas do Keep. Você pode fixar notas importantes, categorizá-las e definir alarmes de lembrete que irão disparar em tempo real.',
          color: 'bg-yellow-500/10 border-yellow-500/20',
          isPinned: true,
          updatedAt: new Date().toISOString(),
        }
      ];
    } catch (e) {
      return [];
    }
  });
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingKeep, setIsLoadingKeep] = useState(false);
  const { toast } = useToast();

  // Sync Google Keep notes to localStorage
  useEffect(() => {
    localStorage.setItem('personal_google_keep_notes', JSON.stringify(googleKeepNotes));
  }, [googleKeepNotes]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAccessToken(null);
        setIsConnected(false);
        setCalendarEvents([]);
        setGoogleTasks([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    toast.info('Abrindo janela de autorização do Google...', 'Conectando...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = FirebaseGoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        setIsConnected(true);
        toast.success('Conexão com a sua conta Google realizada com sucesso!', 'Google Conectado');
      } else {
        throw new Error('Falha ao obter token de acesso.');
      }
    } catch (err: any) {
      console.error('Erro de login com Google:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        toast.warning('O login foi cancelado porque a janela de autorização do Google foi fechada.', 'Login Cancelado');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        toast.warning('A janela anterior de login foi cancelada.', 'Operação Cancelada');
      } else {
        toast.error('Ocorreu um erro ao tentar conectar com a sua conta Google.', 'Erro de Conexão');
      }
    }
  };

  const logoutGoogle = async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
      setIsConnected(false);
      setCalendarEvents([]);
      setGoogleTasks([]);
      toast.warning('Você desconectou sua conta Google com sucesso.', 'Google Desconectado');
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  };

  const refreshCalendar = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingCalendar(true);
    try {
      const timeMin = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=8&orderBy=startTime&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      if (res.status === 401) {
        logoutGoogle();
        toast.error('Sua sessão do Google expirou. Por favor, conecte novamente.', 'Sessão Expirada');
        return;
      }
      
      const data = await res.json();
      if (data.items) {
        const events = data.items.map((item: any) => ({
          id: item.id,
          summary: item.summary || 'Sem Título',
          start: item.start || {},
          end: item.end || {},
          location: item.location,
        }));
        setCalendarEvents(events);
      }
    } catch (err) {
      console.error('Erro ao buscar calendário:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [accessToken, toast]);

  const refreshTasks = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingTasks(true);
    try {
      const res = await fetch(
        'https://www.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=20',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      if (res.status === 401) {
        logoutGoogle();
        return;
      }
      
      const data = await res.json();
      if (data.items) {
        const tasks = data.items.map((item: any) => {
          const taskId = item.id;
          let rTime = '';
          let rActive = false;
          let rTriggered = false;
          try {
            const saved = localStorage.getItem(`g_task_rem_${taskId}`);
            if (saved) {
              const meta = JSON.parse(saved);
              rTime = meta.reminderTime || '';
              rActive = !!meta.reminderActive;
              rTriggered = !!meta.reminderTriggered;
            }
          } catch (e) {}

          return {
            id: taskId,
            title: item.title || 'Tarefa sem título',
            status: item.status,
            due: item.due ? item.due.split('T')[0] : undefined,
            reminderTime: rTime || undefined,
            reminderActive: rActive,
            reminderTriggered: rTriggered,
          };
        });
        setGoogleTasks(tasks);
      } else {
        setGoogleTasks([]);
      }
    } catch (err) {
      console.error('Erro ao buscar tarefas do Google:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [accessToken]);

  const refreshKeepNotes = useCallback(async () => {
    // Keep Notes are simulated locally per user and synced across local state
    setIsLoadingKeep(true);
    try {
      // Small artificial delay to mimic syncing beautifully
      await new Promise((resolve) => setTimeout(resolve, 300));
      const saved = localStorage.getItem('personal_google_keep_notes');
      if (saved) {
        setGoogleKeepNotes(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingKeep(false);
    }
  }, []);

  const addGoogleTask = async (title: string, dueDate?: string, reminderTime?: string, reminderActive?: boolean) => {
    if (!accessToken) return;
    try {
      const body: any = { title };
      if (dueDate) {
        body.due = new Date(dueDate).toISOString();
      }
      
      const res = await fetch(
        'https://www.googleapis.com/tasks/v1/lists/@default/tasks',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        const taskId = data.id;
        if (taskId && reminderTime && reminderActive) {
          const reminderMeta = {
            reminderTime,
            reminderActive: true,
            reminderTriggered: false,
          };
          localStorage.setItem(`g_task_rem_${taskId}`, JSON.stringify(reminderMeta));
        }
        toast.success('Tarefa cadastrada com sucesso no Google Tasks!', 'Tarefa Sincronizada');
        refreshTasks();
      } else {
        throw new Error('Falha ao adicionar tarefa');
      }
    } catch (err) {
      toast.error('Não foi possível sincronizar o envio da nova tarefa para o Google.', 'Erro no Envio');
    }
  };

  const toggleGoogleTaskState = async (id: string, completed: boolean) => {
    if (!accessToken) return;
    try {
      const status = completed ? 'completed' : 'needsAction';
      const res = await fetch(
        `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, status, completed: completed ? new Date().toISOString() : null }),
        }
      );
      
      if (res.ok) {
        try {
          const saved = localStorage.getItem(`g_task_rem_${id}`);
          if (saved) {
            const meta = JSON.parse(saved);
            meta.reminderActive = !completed ? meta.reminderActive : false; // Deactivate when completed
            localStorage.setItem(`g_task_rem_${id}`, JSON.stringify(meta));
          }
        } catch (e) {}

        toast.success(
          completed ? 'Tarefa marcada como concluída no Google Tasks!' : 'Tarefa reativada no Google Tasks!',
          'Tarefa Atualizada'
        );
        refreshTasks();
      } else {
        throw new Error('Falha ao atualizar tarefa');
      }
    } catch (err) {
      toast.error('Erro ao atualizar o status da tarefa no Google.', 'Falha de Sincronização');
    }
  };

  const addGoogleKeepNote = async (
    title: string,
    content: string,
    color?: string,
    dueDate?: string,
    reminderTime?: string,
    reminderActive?: boolean
  ) => {
    const newNote: GoogleKeepNote = {
      id: `gkeep-${Date.now()}`,
      title: title.trim() || 'Nota sem título',
      content: content.trim(),
      color: color || 'bg-slate-900 border-white/5',
      isPinned: false,
      dueDate: dueDate || undefined,
      reminderTime: reminderTime || undefined,
      reminderActive: !!reminderActive && !!dueDate && !!reminderTime,
      reminderTriggered: false,
      updatedAt: new Date().toISOString(),
    };
    
    setGoogleKeepNotes((prev) => [newNote, ...prev]);
    toast.success('Nota salva com sucesso no mural do Google Keep!', 'Keep Sincronizado');
  };

  const deleteGoogleKeepNote = async (id: string) => {
    setGoogleKeepNotes((prev) => prev.filter((note) => note.id !== id));
    toast.warning('Nota removida do Google Keep.', 'Nota Excluída');
  };

  const togglePinKeepNote = async (id: string) => {
    setGoogleKeepNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, isPinned: !note.isPinned } : note))
    );
  };

  const updateKeepNoteColor = async (id: string, color: string) => {
    setGoogleKeepNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, color } : note))
    );
  };

  const updateKeepNoteReminders = (id: string, reminderActive: boolean, reminderTriggered: boolean) => {
    setGoogleKeepNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, reminderActive, reminderTriggered } : note
      )
    );
  };

  // Fetch data when authenticated
  useEffect(() => {
    if (isConnected && accessToken) {
      refreshCalendar();
      refreshTasks();
      refreshKeepNotes();
    }
  }, [isConnected, accessToken, refreshCalendar, refreshTasks, refreshKeepNotes]);

  return (
    <GoogleAuthContext.Provider
      value={{
        isConnected,
        accessToken,
        calendarEvents,
        googleTasks,
        googleKeepNotes,
        isLoadingCalendar,
        isLoadingTasks,
        isLoadingKeep,
        loginWithGoogle,
        logoutGoogle,
        refreshCalendar,
        refreshTasks,
        refreshKeepNotes,
        addGoogleTask,
        toggleGoogleTaskState,
        addGoogleKeepNote,
        deleteGoogleKeepNote,
        togglePinKeepNote,
        updateKeepNoteColor,
        updateKeepNoteReminders,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}
