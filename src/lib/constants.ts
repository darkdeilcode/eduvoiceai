import type { LucideIcon } from 'lucide-react';
import { 
  Home, 
  BookOpen, 
  Mic, 
  HelpCircle, 
  Languages, 
  Settings, 
  CreditCard, 
  Key, 
  Users, 
  Ticket, 
  LayoutDashboard, 
  ShieldAlert,
  UserCircle,
  FileText
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPaths?: string[]; // For highlighting active link based on sub-paths
}

export const APP_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Topic Lecture', href: '/lectures', icon: BookOpen, matchPaths: ['/lectures', '/lectures/history', '/lectures/view'] },
  { label: 'Mock Interview', href: '/interviews', icon: Mic, matchPaths: ['/interviews', '/interviews/history', '/interviews/report'] },
  { label: 'Q&A Prep', href: '/qa-prep', icon: HelpCircle, matchPaths: ['/qa-prep', '/qa-prep/history', '/qa-prep/exam'] },
  { label: 'Learn Language', href: '/language', icon: Languages, matchPaths: ['/language'] },
   {
    label: "Documentation", // Add this new item
    href: "/documentation",
    icon: FileText,
    matchPaths: ["/documentation"]
  }
];

export const SETTINGS_NAV_ITEMS: NavItem[] = [
    { label: 'API Keys', href: '/settings/api-keys', icon: Key },
    { label: 'Subscription', href: '/settings/subscription', icon: CreditCard },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Admin Dashboard', href: '/admindashboard', icon: ShieldAlert, matchPaths: ['/admindashboard'] },
  { label: 'Manage Users', href: '/users', icon: Users, matchPaths: ['/users'] },
  { label: 'Manage Vouchers', href: '/vouchers', icon: Ticket, matchPaths: ['/vouchers'] },
];

export const USER_NAV_ITEMS: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: UserCircle }, 
  { label: 'Settings', href: '/settings/api-keys', icon: Settings },
  // Logout will be handled by a function in AppHeader
];