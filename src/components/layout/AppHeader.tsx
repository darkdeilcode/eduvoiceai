"use client";

import Link from "next/link";
import { BrainCircuit, Menu, UserCircle, LogOut, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAV_ITEMS, USER_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/constants";
import { usePathname, useRouter } from "next/navigation";
import { account } from "@/lib/appwrite"; 
import { useToast } from "@/hooks/use-toast"; 
import { useEffect, useState } from "react";
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

export function AppHeader() {
  const { user, isAdmin, isLoading } = useAppwriteUser(); 
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isAdminPathActive = ADMIN_NAV_ITEMS.some(item => 
    (item.matchPaths && item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) || pathname === item.href
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-900/5">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-headline text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              EduVoice AI
            </h1>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {APP_NAV_ITEMS.slice(0, 3).map((item) => { 
            const isActive = pathname === item.href || (item.matchPaths && item.matchPaths.some(p => pathname.startsWith(p)));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-200 group ${
                  isActive 
                    ? "text-white bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg" 
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl opacity-20 animate-pulse"></div>
                )}
                <span className="relative flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Button - Desktop */}
          {!isLoading && isAdmin && ( 
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className={`hidden md:flex rounded-xl border-2 transition-all duration-200 ${
                isAdminPathActive 
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white border-transparent shadow-lg" 
                  : "border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              }`}
            >
              <Link href="/admindashboard">
                <ShieldAlert className="mr-2 h-4 w-4" />
                Admin Area
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden rounded-xl border-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50">
              <div className="flex flex-col h-full">
                {/* Mobile Logo */}
                <div className="flex items-center gap-3 mb-8 mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-20 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
                      <BrainCircuit className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h1 className="font-headline text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    EduVoice AI
                  </h1>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-2 flex-1">
                  {APP_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.matchPaths && item.matchPaths.some(p => pathname.startsWith(p)));
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Mobile Admin Section */}
                  {!isLoading && isAdmin && (
                    <>
                      <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
                      <Link
                        href="/admindashboard" 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isAdminPathActive 
                            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg" 
                            : "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                        }`}
                      >
                        <ShieldAlert className="h-5 w-5" />
                        <span className="font-medium">Admin Area</span>
                      </Link>
                      {ADMIN_NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.matchPaths && item.matchPaths.some(p => pathname.startsWith(p)));
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 pl-8 pr-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                              isActive
                                ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
                                : "text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/10"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:scale-105 transition-transform">
                <UserCircle className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-2xl">
              {/* User Info Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-full">
                    <UserCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Menu Items */}
              <div className="p-2">
                {USER_NAV_ITEMS.map((item) => (
                  <DropdownMenuItem key={item.label} asChild className="rounded-xl mb-1">
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                {/* Admin Menu Item */}
                {!isLoading && isAdmin && (
                  <>
                    <div className="my-2 border-t border-slate-200 dark:border-slate-700"></div>
                    <DropdownMenuItem asChild className="rounded-xl mb-1">
                      <Link href="/admindashboard" className="flex items-center gap-3 px-3 py-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Admin Dashboard</span>
                        <Zap className="h-3 w-3 ml-auto" />
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                {/* Logout */}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700"></div>
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}