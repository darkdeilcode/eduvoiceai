"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Ticket, PlusCircle, MoreHorizontal, Edit, Trash2, Percent, CalendarDays, XCircle, CheckCircle, Loader2, AlertTriangle, ShieldAlert, Copy, Search, Filter, Download, Users, Clock, DollarSign, TrendingUp, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { account, databases, ID, Permission, Role, APPWRITE_DATABASE_ID, VOUCHERS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { Voucher } from "@/types/voucher";
import { Models } from "appwrite";

interface VoucherFormData {
  code: string;
  discountPercent: string;
  expiryDate: string;
  maxUses: string; 
}

const getVoucherStatus = (voucher: Voucher): "Active" | "Expired" | "Inactive" | "Used Up" => {
    if (voucher.status === "Inactive") return "Inactive"; 
    if (new Date(voucher.ExpiryDate) < new Date()) return "Expired";
    if (voucher.MaxUses !== null && (voucher.uses ?? 0) >= voucher.MaxUses) return "Used Up";
    return "Active";
};

const getStatusConfig = (status: string) => {
  const configs = {
    "Active": { 
      variant: "default" as const, 
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: CheckCircle
    },
    "Expired": { 
      variant: "destructive" as const, 
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      icon: XCircle
    },
    "Used Up": { 
      variant: "destructive" as const, 
      className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
      icon: XCircle
    },
    "Inactive": { 
      variant: "secondary" as const, 
      className: "bg-gray-50 text-gray-600 border-gray-200",
      icon: XCircle
    }
  };
  return configs[status as keyof typeof configs] || configs.Inactive;
};

export default function ManageVouchersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const [formData, setFormData] = useState<VoucherFormData>({
    code: "",
    discountPercent: "",
    expiryDate: "",
    maxUses: "",
  });

  useEffect(() => {
    const fetchVouchersAndCheckAdmin = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = await account.get();
        if (!currentUser.labels || !currentUser.labels.includes("admin")) {
          router.push("/dashboard");
          return;
        }

        if (!APPWRITE_DATABASE_ID || !VOUCHERS_COLLECTION_ID) {
          throw new Error("Voucher collection configuration is missing.");
        }

        const response = await databases.listDocuments(APPWRITE_DATABASE_ID, VOUCHERS_COLLECTION_ID);
        setVouchers(response.documents as Voucher[]);
      } catch (err: any) {
        console.error("Error fetching vouchers or admin check:", err);
        let specificError = "Failed to load voucher data. You may not have permissions or there was a server issue.";
        if (err instanceof AppwriteException) {
            specificError = `Appwrite Error: ${err.message}.`;
        } else if (err instanceof Error) {
            specificError = err.message;
        }
        setError(specificError);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVouchersAndCheckAdmin();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "✅ Copied!", description: `Voucher code "${code}" copied to clipboard` });
  };
  
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountPercent || !formData.expiryDate) {
      toast({ title: "❌ Missing Fields", description: "Please fill in code, discount, and expiry date.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (!APPWRITE_DATABASE_ID || !VOUCHERS_COLLECTION_ID) {
        throw new Error("Voucher collection configuration is missing for creation.");
      }

      const newVoucherPayload = {
        key: formData.code.toUpperCase(),
        Discount: parseInt(formData.discountPercent),
        ExpiryDate: new Date(formData.expiryDate).toISOString(),
        MaxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      };

      const createdDocument = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        VOUCHERS_COLLECTION_ID,
        ID.unique(),
        newVoucherPayload,
        [
          Permission.read(Role.any()), 
          Permission.update(Role.label("admin")), 
          Permission.delete(Role.label("admin"))  
        ]
      );
      
      setVouchers(prev => [createdDocument as Voucher, ...prev]);
      toast({ title: "✅ Voucher Created", description: `Voucher ${createdDocument.key} has been created successfully!` });
      setFormData({ code: "", discountPercent: "", expiryDate: "", maxUses: "" }); 
    } catch (err: any) {
      console.error("Error creating voucher:", err);
      let specificError = "Failed to create voucher.";
       if (err instanceof AppwriteException) {
            specificError = `Appwrite Error: ${err.message}`;
        } else if (err instanceof Error) {
            specificError = err.message;
        }
      toast({ title: "❌ Creation Failed", description: specificError, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteVoucher = async (voucherId: string, voucherCode: string) => {
     if (!confirm(`Are you sure you want to delete voucher "${voucherCode}"? This action cannot be undone.`)) {
        return;
    }
    try {
        if (!APPWRITE_DATABASE_ID || !VOUCHERS_COLLECTION_ID) {
            throw new Error("Voucher collection configuration is missing for deletion.");
        }
        await databases.deleteDocument(APPWRITE_DATABASE_ID, VOUCHERS_COLLECTION_ID, voucherId);
        setVouchers(prev => prev.filter(v => v.$id !== voucherId));
        toast({ title: "✅ Voucher Deleted", description: `Voucher ${voucherCode} has been deleted successfully.` });
    } catch (err:any) {
        console.error("Error deleting voucher:", err);
        toast({ title: "❌ Deletion Failed", description: err.message || "Could not delete voucher.", variant: "destructive" });
    }
  };

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.key.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getVoucherStatus(voucher);
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && status === "Active";
    if (activeTab === "expired") return matchesSearch && (status === "Expired" || status === "Used Up");
    if (activeTab === "inactive") return matchesSearch && status === "Inactive";
    
    return matchesSearch;
  });

  const getVoucherStats = () => {
    const total = vouchers.length;
    const active = vouchers.filter(v => getVoucherStatus(v) === "Active").length;
    const expired = vouchers.filter(v => {
      const status = getVoucherStatus(v);
      return status === "Expired" || status === "Used Up";
    }).length;
    const totalUses = vouchers.reduce((sum, v) => sum + (v.uses ?? 0), 0);
    
    return { total, active, expired, totalUses };
  };

  if (isLoading && !error) { 
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Loading Voucher Management</h3>
          <p className="text-muted-foreground">Fetching voucher data and verifying permissions...</p>
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

  const stats = getVoucherStats();

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Voucher Management</h1>
              <p className="text-muted-foreground">
                Create and manage discount vouchers for your AI SaaS platform
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
            <PlusCircle className="mr-2 h-4 w-4" />
            Generate Bulk
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Vouchers</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
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
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Expired/Used</p>
                <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Uses</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalUses}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Voucher Form */}
      <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-primary" />
            Create New Voucher
          </CardTitle>
          <CardDescription>
            Generate discount vouchers with custom settings and expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleCreateVoucher} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">Voucher Code</Label>
                <Input 
                  id="code" 
                  name="code" 
                  placeholder="e.g., SAVE25" 
                  value={formData.code} 
                  onChange={handleInputChange} 
                  disabled={isSubmitting}
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercent" className="text-sm font-medium">Discount (%)</Label>
                <div className="relative">
                  <Input 
                    id="discountPercent" 
                    name="discountPercent" 
                    type="number" 
                    placeholder="25" 
                    value={formData.discountPercent} 
                    onChange={handleInputChange} 
                    disabled={isSubmitting}
                    min="1"
                    max="100"
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</Label>
                <Input 
                  id="expiryDate" 
                  name="expiryDate" 
                  type="date" 
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-sm font-medium">Max Uses (Optional)</Label>
                <Input 
                  id="maxUses" 
                  name="maxUses" 
                  type="number" 
                  placeholder="100" 
                  value={formData.maxUses} 
                  onChange={handleInputChange} 
                  disabled={isSubmitting}
                  min="1"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Voucher...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Voucher
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Vouchers Overview</CardTitle>
              <CardDescription>
                {filteredVouchers.length} of {vouchers.length} vouchers • Last updated {format(new Date(), 'PPp')}
              </CardDescription>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search vouchers..."
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
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                <TabsTrigger value="all" className="text-xs lg:text-sm">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active" className="text-xs lg:text-sm">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="expired" className="text-xs lg:text-sm">Expired ({stats.expired})</TabsTrigger>
                <TabsTrigger value="inactive" className="text-xs lg:text-sm">Inactive (0)</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[180px]">Voucher Code</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Percent className="h-4 w-4" />
                          Discount
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          Usage
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          Expiry Date
                        </div>
                      </TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.map((voucher) => {
                      const status = getVoucherStatus(voucher);
                      const statusConfig = getStatusConfig(status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <TableRow key={voucher.$id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-semibold text-sm bg-muted/50 px-2 py-1 rounded">
                                {voucher.key}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopyCode(voucher.key)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-bold text-lg">{voucher.Discount}</span>
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="text-sm">
                              <div className="font-medium">
                                {voucher.uses ?? 0} / {voucher.MaxUses || "∞"}
                              </div>
                              {voucher.MaxUses && (
                                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full transition-all" 
                                    style={{ 
                                      width: `${Math.min(((voucher.uses ?? 0) / voucher.MaxUses) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {format(parseISO(voucher.ExpiryDate), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatDistanceToNow(parseISO(voucher.ExpiryDate), { addSuffix: true })}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {format(new Date(voucher.$createdAt), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatDistanceToNow(new Date(voucher.$createdAt), { addSuffix: true })}
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
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="flex items-center gap-2">
                                  <Ticket className="h-4 w-4" />
                                  Voucher Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => handleCopyCode(voucher.key)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Code
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => alert(`View details for voucher ${voucher.key}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => alert("Edit functionality to be implemented")}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Voucher
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                                  onClick={() => handleDeleteVoucher(voucher.$id, voucher.key)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Voucher
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

              {filteredVouchers.length === 0 && (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No vouchers found</h3>
                  <p className="text-muted-foreground mb-6">
                    {vouchers.length > 0 
                      ? "Try adjusting your search or filter criteria." 
                      : "Create your first voucher to get started."
                    }
                  </p>
                  {vouchers.length === 0 && (
                    <Button onClick={() => document.getElementById('code')?.focus()}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create First Voucher
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
                Voucher creation and deletion are fully functional. Edit functionality is planned for future implementation.
                Ensure your Appwrite collection schema matches the expected attributes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}