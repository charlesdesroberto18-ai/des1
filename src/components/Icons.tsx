import { 
  Utensils, 
  Home, 
  Car, 
  Compass, 
  HeartPulse, 
  GraduationCap, 
  Sparkles, 
  Briefcase, 
  TrendingUp, 
  Cpu, 
  DollarSign, 
  Plus, 
  Minus,
  TrendingDown,
  Calendar,
  Layers,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Lightbulb,
  PiggyBank,
  Download,
  X,
  Check,
  ChevronRight,
  MessageSquare,
  Sparkle
} from 'lucide-react';

const icons: Record<string, any> = {
  Utensils,
  Home,
  Car,
  Compass,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Briefcase,
  TrendingUp,
  Cpu,
  DollarSign,
  Plus,
  Minus,
  TrendingDown,
  Calendar,
  Layers,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Lightbulb,
  PiggyBank,
  Download,
  X,
  Check,
  ChevronRight,
  MessageSquare,
  Sparkle
};

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className = '', size = 20 }: DynamicIconProps) {
  const IconComponent = icons[name] || Sparkles;
  return <IconComponent className={className} size={size} />;
}
