"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Shield, 
  Edit3, 
  Camera, 
  Loader2, 
  Save, 
  Crown, 
  Coins, 
  Calendar, 
  Settings, 
  CreditCard, 
  Star 
} from "lucide-react";
import { account, storage, ID, AppwriteException, PROFILE_IMAGES_BUCKET_ID } from "@/lib/appwrite";
import type { Models } from "appwrite";

interface UserPrefs extends Models.Preferences {
  firstName?: string;
  lastName?: string;
  token_balance?: number;
  subscription_status?: string;
  voucher_code?: string;
  voucher_usage_count?: number;
  profileImageStorageId?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<Models.User<UserPrefs> | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageUrlPreview, setProfileImageUrlPreview] = useState<string | null>(null);
  const [currentProfileImageStorageId, setCurrentProfileImageStorageId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await account.get<UserPrefs>();
        setUser(currentUser);
        setEmail(currentUser.email);
        
        const prefs = currentUser.prefs;
        setFirstName(prefs.firstName || "");
        setLastName(prefs.lastName || "");

        setTokenBalance(prefs.token_balance ?? 0);
        setSubscriptionStatus(prefs.subscription_status ?? null);
        setVoucherCode(prefs.voucher_code ?? null);
        
        if (prefs.profileImageStorageId && PROFILE_IMAGES_BUCKET_ID) {
          setCurrentProfileImageStorageId(prefs.profileImageStorageId);
          const imageUrl = storage.getFilePreview(PROFILE_IMAGES_BUCKET_ID, prefs.profileImageStorageId);
          setProfileImageUrlPreview(imageUrl.href);
        } else {
           setProfileImageUrlPreview(`https://placehold.co/128x128.png?text=${(prefs.firstName || currentUser.name || 'U').substring(0,1).toUpperCase()}`);
        }

      } catch (error) {
        toast({
          title: "Error Fetching Profile",
          description: "Could not load your profile data. Please try logging in again.",
          variant: "destructive",
        });
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [router, toast]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Image Too Large", description: "Please select an image smaller than 5MB.", variant: "destructive"});
          return;
      }
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
          toast({ title: "Invalid File Type", description: "Please select a PNG, JPG, or GIF image.", variant: "destructive"});
          return;
      }
      setProfileImageFile(file);
      setProfileImageUrlPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    if (!user) {
      toast({ title: "Error", description: "User data not loaded.", variant: "destructive" });
      setIsUpdating(false);
      return;
    }

    try {
      let newProfileImageStorageId = currentProfileImageStorageId;

      if (profileImageFile && PROFILE_IMAGES_BUCKET_ID) {
        if (currentProfileImageStorageId) {
          try {
            await storage.deleteFile(PROFILE_IMAGES_BUCKET_ID, currentProfileImageStorageId);
          } catch (deleteError) {
            console.warn("Could not delete old profile image:", deleteError);
          }
        }
        const uploadedFile = await storage.createFile(PROFILE_IMAGES_BUCKET_ID, ID.unique(), profileImageFile);
        newProfileImageStorageId = uploadedFile.$id;
      }

      const newName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (newName && newName !== user.name) {
        await account.updateName(newName);
      } else if (!newName && user.name) {
        await account.updateName(""); 
      }
      
      const currentPrefs = user.prefs || {};
      const updatedPrefs: UserPrefs = {
        ...currentPrefs,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (newProfileImageStorageId) {
        updatedPrefs.profileImageStorageId = newProfileImageStorageId;
      } else if (updatedPrefs.hasOwnProperty('profileImageStorageId') && !newProfileImageStorageId) {
        delete updatedPrefs.profileImageStorageId;
      }

      await account.updatePrefs(updatedPrefs);

      setUser(prevUser => prevUser ? {
         ...prevUser, 
         name: newName, 
         prefs: updatedPrefs 
        } : null);
      if (newProfileImageStorageId && PROFILE_IMAGES_BUCKET_ID) {
          setCurrentProfileImageStorageId(newProfileImageStorageId);
          setProfileImageUrlPreview(storage.getFilePreview(PROFILE_IMAGES_BUCKET_ID, newProfileImageStorageId).href);
      } else if (!newProfileImageStorageId) {
          setCurrentProfileImageStorageId(null);
          setProfileImageUrlPreview(`https://placehold.co/128x128.png?text=${(firstName || newName || 'U').substring(0,1).toUpperCase()}`);
      }
      setProfileImageFile(null);

      toast({
        title: "🎉 Profile Updated",
        description: "Your profile information has been successfully updated.",
      });

    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error instanceof AppwriteException) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!email) {
      toast({ title: "Error", description: "Email address not found.", variant: "destructive" });
      return;
    }
    try {
      await account.createRecovery(email, `${window.location.origin}/(auth)/reset-password`);
      toast({
        title: "Password Recovery Email Sent",
        description: "Check your email for a link to reset your password.",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Recovery Email",
        description: "Could not send password recovery email. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading Profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center">
            <h1 className="font-headline text-3xl font-semibold mb-4">User not found</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Please log in to view your profile.</p>
            <Button onClick={() => router.push("/login")} className="rounded-xl">Go to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  const avatarFallbackName = firstName || user.name || email;
  const isProUser = subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">
                👤 Manage your account settings and personal information
              </p>
            </div>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
                    Profile Overview
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    Your account summary and status
                  </CardDescription>
                </div>
              </div>
              {isProUser && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 px-3 py-2 rounded-full">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Pro User</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Profile Image & Basic Info */}
              <div className="md:col-span-1 flex flex-col items-center">
                <div className="relative group">
                  <Avatar className="h-32 w-32 cursor-pointer border-4 border-white dark:border-slate-700 shadow-xl" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage 
                        src={profileImageUrlPreview || `https://placehold.co/128x128.png?text=${avatarFallbackName.substring(0,1).toUpperCase()}`} 
                        alt={user.name || "User"}
                        className="object-cover" />
                    <AvatarFallback className="text-4xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                        {avatarFallbackName ? avatarFallbackName.substring(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity">
                      <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Avatar>
                  {isProUser && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full p-2">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">
                  {firstName && lastName ? `${firstName} ${lastName}` : user.name || "User"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{email}</p>
              </div>

              {/* Account Stats */}
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-800/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                      <Coins className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Token Balance</h4>
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {tokenBalance !== null ? tokenBalance.toLocaleString() : '---'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Available tokens</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-green-200/50 dark:border-green-800/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Plan Status</h4>
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {isProUser ? 'Pro' : 'Free'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Current plan</p>
                </div>

                {voucherCode && (
                  <div className="sm:col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Active Voucher</h4>
                    </div>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{voucherCode}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-600/30 border-b border-slate-200/50 dark:border-slate-600/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                  Personal Information
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Update your personal details and profile picture
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="p-6 space-y-6">
              <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUpdating}
                className="rounded-xl border-2"
              >
                <Camera className="mr-2 h-4 w-4" /> Change Profile Photo
              </Button>
              {!PROFILE_IMAGES_BUCKET_ID && (
                <p className="text-xs text-red-600 dark:text-red-400">Profile image bucket is not configured. Image uploads will not work.</p>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="Your First Name" 
                    disabled={isUpdating}
                    className="h-12 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="Your Last Name" 
                    disabled={isUpdating}
                    className="h-12 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  placeholder="your@email.com" 
                  disabled
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-600 border-2 border-slate-200 dark:border-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Email address cannot be changed here.</p>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl shadow-lg px-6 py-3" 
                disabled={isUpdating || isLoading}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-b border-red-200/50 dark:border-red-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                  Account Security
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Manage your password and security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleChangePassword} 
                disabled={isUpdating}
                className="rounded-xl border-2 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Shield className="mr-2 h-4 w-4" /> 
                Change Password
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                An email will be sent to you with instructions to reset your password.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}