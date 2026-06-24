export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
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

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  column: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  reminderTime?: string;
  reminderActive?: boolean;
  reminderTriggered?: boolean;
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
