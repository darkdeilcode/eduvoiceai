"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Users, MoreHorizontal, Search, Filter, Download, ShieldCheck, Ban, TrendingUp, Loader2, AlertTriangle, Edit, Coins, CalendarDays, UserPlus, Eye, Crown, Activity, Mail, Calendar, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { account, AppwriteException, databases, APPWRITE_DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite"; 
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { Models } from 'appwrite';
import { useToast } from "@/hooks/use-toast";

interface CustomUserDocument extends Models.Document {
  username: string; 
  email: string;
  role?: "admin" | "user"; 
  subscription_status?: "trial" | "active" | "cancelled" | "past_due";
  token_balance?: number;
  subscription_end_date?: string; 
}

const subscriptionStatuses: CustomUserDocument['subscription_status'][] = ["trial", "active", "cancelled", "past_due"];

const getStatusConfig = (status: string) => {
  const configs = {
    "Active": { 
      variant: "default" as const, 
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: "🟢"
    },
    "Trial": { 
      variant: "secondary" as const, 
      className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      icon: "🟡"
    },
    "Cancelled": { 
      variant: "destructive" as const, 
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      icon: "🔴"
    },
    "Past Due": { 
      variant: "destructive" as const, 
      className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
      icon: "🟠"
    },
    "Unknown": { 
      variant: "outline" as const, 
      className: "bg-gray-50 text-gray-600 border-gray-200",
      icon: "⚪"
    }
  };
  return configs[status as keyof typeof configs] || configs.Unknown;
};

const getUserInitials = (username: string, email: string) => {
  if (username && username !== "N/A") {
    return username.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

const getConceptualUserStatus = (user: CustomUserDocument): string => {
  if (user.subscription_status === "active") return "Active";
  if (user.subscription_status === "trial") return "Trial";
  if (user.subscription_status === "cancelled") return "Cancelled";
  if (user.subscription_status === "past_due") return "Past Due";
  return "Unknown"; 
};

export default function ManageUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [userList, setUserList] = useState<CustomUserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStatusForUser, setEditingStatusForUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchUsersAndCheckAdmin = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = await account.get(); 
        if (!currentUser.labels || !currentUser.labels.includes("admin")) {
          router.push("/dashboard"); 
          return;
        }

        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`);
        }
        const data = await response.json();
        setUserList(data as CustomUserDocument[]);

      } catch (err: any) {
        console.error("Error fetching users or admin check:", err);
        let specificError = "Failed to load user data. You may not have permissions or there was a server issue.";
        if (err instanceof AppwriteException) {
            specificError = `Appwrite Error (Admin Check): ${err.message}.`;
        } else if (err.message) {
            specificError = err.message;
        }
        setError(specificError);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsersAndCheckAdmin();
  }, [router]);

  const filteredUsers = userList.filter(user => {
    const matchesSearch = (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && user.subscription_status === "active";
    if (activeTab === "trial") return matchesSearch && user.subscription_status === "trial";
    if (activeTab === "inactive") return matchesSearch && (user.subscription_status === "cancelled" || user.subscription_status === "past_due");
    if (activeTab === "admins") return matchesSearch && user.role === "admin";
    
    return matchesSearch;
  });
  
  const handleMakeAdmin = (userId: string) => alert(`Conceptual: Make user ${userId} admin. Requires backend logic to update 'role' attribute in the custom user collection or Auth user labels.`);
  const handleBanUser = (userId: string) => alert(`Conceptual: Ban user ${userId}. Requires backend logic to update 'subscription_status' or a dedicated 'status' field in the custom user collection.`);

  const handleUpdateSubscriptionStatus = async (userId: string, newStatus: CustomUserDocument['subscription_status']) => {
    if (!newStatus) return;
    setEditingStatusForUser(userId);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription_status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to update status for user ${userId}`);
      }

      setUserList(prevList => 
        prevList.map(user => 
          user.$id === userId ? { ...user, subscription_status: newStatus } : user
        )
      );

      toast({
        title: "✅ Status Updated",
        description: `Subscription status updated to ${newStatus}`,
      });
    } catch (err: any) {
      console.error("Error updating subscription status:", err);
      toast({
        title: "❌ Update Failed",
        description: err.message || "Could not update user subscription status.",
        variant: "destructive",
      });
    } finally {
      setEditingStatusForUser(null);
    }
  };

  const getUserStats = () => {
    const total = userList.length;
    const active = userList.filter(u => u.subscription_status === "active").length;
    const trial = userList.filter(u => u.subscription_status === "trial").length;
    const inactive = userList.filter(u => u.subscription_status === "cancelled" || u.subscription_status === "past_due").length;
    const admins = userList.filter(u => u.role === "admin").length;
    
    return { total, active, trial, inactive, admins };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Loading User Management</h3>
          <p className="text-muted-foreground">Fetching user data and verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page or there was an error loading the data.</p>
        </div>
        
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="bg-destructive/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/admindashboard')} variant="outline">
                Back to Admin Dashboard
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getUserStats();

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">
                Manage user accounts, subscriptions, and permissions
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.active}</p>
              </div>
              <div className="text-2xl">🟢</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Trial</p>
                <p className="text-2xl font-bold text-amber-900">{stats.trial}</p>
              </div>
              <div className="text-2xl">🟡</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Inactive</p>
                <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
              </div>
              <div className="text-2xl">🔴</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Admins</p>
                <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Users Overview</CardTitle>
              <CardDescription>
                {filteredUsers.length} of {userList.length} users • Last updated {format(new Date(), 'PPp')}
              </CardDescription>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full lg:w-80"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
                <TabsTrigger value="all" className="text-xs lg:text-sm">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active" className="text-xs lg:text-sm">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="trial" className="text-xs lg:text-sm">Trial ({stats.trial})</TabsTrigger>
                <TabsTrigger value="inactive" className="text-xs lg:text-sm">Inactive ({stats.inactive})</TabsTrigger>
                <TabsTrigger value="admins" className="text-xs lg:text-sm">Admins ({stats.admins})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[200px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="h-4 w-4" />
                          Tokens
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          Subscription
                        </div>
                      </TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const statusConfig = getStatusConfig(getConceptualUserStatus(user));
                      return (
                        <TableRow key={user.$id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {getUserInitials(user.username, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{user.username || "Anonymous"}</p>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {user.role === "admin" ? (
                              <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200">
                                <Crown className="mr-1 h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">User</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              <span className="mr-1">{statusConfig.icon}</span>
                              {getConceptualUserStatus(user)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">
                                {user.token_balance?.toLocaleString() ?? '0'}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {user.subscription_end_date ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {format(parseISO(user.subscription_end_date), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {formatDistanceToNow(parseISO(user.subscription_end_date), { addSuffix: true })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No subscription</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {format(new Date(user.$createdAt), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatDistanceToNow(new Date(user.$createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                  disabled={editingStatusForUser === user.$id}
                                >
                                  {editingStatusForUser === user.$id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(user.username, user.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  Actions for {user.username || user.email}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => alert(`View profile for ${user.username}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => alert(`View activity for ${user.username}`)}>
                                  <Activity className="mr-2 h-4 w-4" />
                                  View Activity
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => alert(`Send email to ${user.email}`)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Change Status
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup 
                                      value={user.subscription_status}
                                      onValueChange={(newStatus) => handleUpdateSubscriptionStatus(user.$id, newStatus as CustomUserDocument['subscription_status'])}
                                    >
                                      {subscriptionStatuses.map((status) => (
                                        <DropdownMenuRadioItem key={status} value={status || ""}>
                                          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "None"}
                                        </DropdownMenuRadioItem>
                                      ))}
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                {user.role !== "admin" && (
                                  <DropdownMenuItem onClick={() => handleMakeAdmin(user.$id)}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Make Admin
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                                  onClick={() => handleBanUser(user.$id)}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-6">
                    {userList.length > 0 
                      ? "Try adjusting your search or filter criteria." 
                      : "No users have been registered yet."
                    }
                  </p>
                  {userList.length === 0 && (
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First User
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">Development Notice</p>
              <p className="text-amber-700">
                Some actions like "Make Admin" and "Ban User" are conceptual placeholders. 
                Subscription status updates are fully functional via the API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}