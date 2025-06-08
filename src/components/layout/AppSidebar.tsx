"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS, SETTINGS_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BrainCircuit, Settings, ShieldAlert, Sparkles, Zap, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import type { Models } from "appwrite";

const useAppwriteUser = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        if (currentUser?.labels?.includes('admin')) { 
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setUser(null); 
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return { user, isLoading, isAdmin };
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isLoading } = useAppwriteUser();

  return (
    <div className="hidden md:block w-64 h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-r border-slate-200/50 dark:border-slate-700/50">
      <ScrollArea className="h-full">
        <div className="p-6">
          {/* Logo Section */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-8 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-headline font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                EduVoice AI
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                🚀 AI-Powered Learning
              </span>
            </div>
          </Link>
          
          {/* Main Navigation */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 px-3 mb-3">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Main Menu
                </h3>
              </div>
              <div className="space-y-1">
                {APP_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || (item.matchPaths && item.matchPaths.some(p => pathname.startsWith(p)));
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl opacity-10 animate-pulse"></div>
                      )}
                      <item.icon className={cn("h-5 w-5 relative", isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-purple-500")} />
                      <span className="relative">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <div className="flex items-center gap-2 px-3 mb-3">
                <Settings className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Settings
                </h3>
              </div>
              <div className="space-y-1">
                {SETTINGS_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || (item.matchPaths && item.matchPaths.some(p => pathname.startsWith(p)));
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl opacity-10 animate-pulse"></div>
                      )}
                      <item.icon className={cn("h-5 w-5 relative", isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-500")} />
                      <span className="relative">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Admin Section */}
            {!isLoading && isAdmin && (
              <div>
                <div className="flex items-center gap-2 px-3 mb-3">
                  <Crown className="h-3 w-3 text-orange-500" />
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Admin Zone
                  </h3>
                </div>
                <div className="space-y-1">
                  {/* Admin Dashboard Link */}
                  <Link
                    href="/admindashboard"
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname.startsWith('/admindashboard')
                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    )}
                  >
                    {pathname.startsWith('/admindashboard') && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl opacity-10 animate-pulse"></div>
                    )}
                    <ShieldAlert className={cn("h-5 w-5 relative", pathname.startsWith('/admindashboard') ? "text-white" : "text-orange-500 group-hover:text-orange-600")} />
                    <span className="relative">Admin Dashboard</span>
                    <Zap className="h-3 w-3 ml-auto text-yellow-400" />
                  </Link>

                  {/* Admin Sub-items */}
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.matchPaths && item.matchPaths.some(p => pathname.startsWith(p)));
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl pl-6 pr-3 py-2 text-sm transition-all duration-200",
                          isActive
                            ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-medium"
                            : "text-slate-500 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/10"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="absolute right-2 w-1 h-1 bg-orange-500 rounded-full"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Info Footer */}
          {user && (
            <div className="mt-8 p-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-750 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-full">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {isAdmin ? "🔑 Admin Access" : "🎓 Student"}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}