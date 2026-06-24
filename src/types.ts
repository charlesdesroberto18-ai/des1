export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'additional';
  category: string;
  date: string;
  notes?: string;
  location?: { name: string; lat: number; lng: number };
}

export interface Budget {
  category: string;
  limitAmount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  textColor: string;
  bgLight: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  reminderTime?: string;
  reminderActive?: boolean;
  reminderTriggered?: boolean;
  source: 'local' | 'google';
  googleListId?: string;
  location?: { name: string; lat: number; lng: number };
}

export interface LifeGoal {
  id: string;
  name: string;
  targetDate: string;
  category: string;
  completedSteps: number;
  totalSteps: number;
  notes?: string;
}

export interface HealthLog {
  waterIntake: number; // in ml
  stepsCount: number;
  caloriesBurned: number;
  sleepHours: number;
  sleepQuality: number; // 1-5 stars
}

export interface KanbanCardAttachment {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  type: string;
}

export interface KanbanCardLink {
  id: string;
  label: string;
  url: string;
}

export interface KanbanCardSubtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface KanbanCardJourney {
  id: string;
  timestamp: string;
  note: string;
  type: 'status' | 'annotation' | 'link' | 'attachment' | 'edit';
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  column: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  projectId?: string; // dynamic project reference
  dueDate?: string;
  reminderTime?: string;
  reminderActive?: boolean;
  reminderTriggered?: boolean;
  location?: { name: string; lat: number; lng: number };
  
  // New extended features for dynamic detail tracking
  links?: KanbanCardLink[];
  annotations?: string;
  attachments?: KanbanCardAttachment[];
  journey?: KanbanCardJourney[];
  subtasks?: KanbanCardSubtask[];
}

export interface ProjectAlert {
  id: string;
  title: string;
  date: string;
  time: string;
  reminderActive: boolean;
  reminderTriggered?: boolean;
}

export interface ProjectJourneyLog {
  id: string;
  timestamp: string;
  note: string;
  progress?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coverImage?: string; // base64 representation
  annotations?: string;
  progress?: number; // 0 - 100
  alerts?: ProjectAlert[];
  journey?: ProjectJourneyLog[];
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  description?: string; // added description
  time: string;
  startDate?: string; // added date for calendar integration
  timesPerDay: number;
  remainingDoses: number;
  totalDoses: number;
  reminderActive?: boolean; // added reminder active
  reminderTriggered?: boolean; // added reminder triggered
}

export interface Consultation {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  notes?: string;
  isPast: boolean;
  reminderActive?: boolean; // added reminder active
  reminderTriggered?: boolean; // added reminder triggered
}

export interface Habit {
  id: string;
  name: string;
  type: 'outdoor' | 'water' | 'exercise' | 'weekly_walk' | 'health';
  completedDays: boolean[]; // Mon (0) to Sun (6)
  targetWeeks: number;
  streakWeeks: number;
}

export interface Course {
  id: string;
  name: string;
  semester: string;
  grade?: number;
  credits: number;
  notes?: string;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface WorkJob {
  id: string;
  name: string;
  type: 'freelance' | 'monthly';
  rate: number; // e.g. 150
  scheduleDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  workedDates: string[]; // YYYY-MM-DD
  monthlyPaidMonths: string[]; // YYYY-MM
  createdAt: string;
}

export interface LocalNoteCategory {
  id: string;
  name: string;
  color: string; // Tailwind class
}

export interface LocalNote {
  id: string;
  categoryId: string; // links to LocalNoteCategory
  title: string;
  content: string;
  updatedAt: string;
}

