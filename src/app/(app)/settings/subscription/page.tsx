"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CreditCard, ExternalLink, Info, Zap, Coins, Loader2, AlertTriangle, Ticket, Crown, Sparkles, TrendingUp, Gift } from "lucide-react";
import { account, databases, APPWRITE_DATABASE_ID, AppwriteException } from "@/lib/appwrite";
import type { Models } from "appwrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";


interface UserProfileDocument extends Models.Document {
  email: string;
  username: string;
  token_balance?: number;
  subscription_status?: "trial" | "active" | "cancelled" | "past_due";
  subscription_end_date?: string; 
}

const FREE_TOKEN_ALLOWANCE = 60000;
const VOUCHER_TOKEN_GRANT = 60000;
const USERS_COLLECTION_ID= "683e10f50000d93a4d9a";
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_aFabJ15XegELgrT3CV8og00";


export default function SubscriptionPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isProSubscribed, setIsProSubscribed] = useState<boolean>(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [voucherCode, setVoucherCode] = useState("");
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);
  const [isProcessingStripeRedirect, setIsProcessingStripeRedirect] = useState(false);


 const fetchUserData = async () => {
  setIsLoading(true);
  setError(null);
  try {
    // Get current authenticated user
    const currentUser = await account.get();
    if (!currentUser?.$id) {
      throw new AppwriteException("User not authenticated.", 401, "user_unauthorized");
    }
    setUserId(currentUser.$id);
    console.log("SubscriptionPage: Fetched Appwrite User ID:", currentUser.$id);

    // Check configuration
    if (!APPWRITE_DATABASE_ID || !USERS_COLLECTION_ID) {
      throw new Error("Appwrite Database ID or Users Collection ID is not configured.");
    }

    console.log("Using Database ID:", APPWRITE_DATABASE_ID);
    console.log("Using Users Collection ID:", USERS_COLLECTION_ID);

    // Try to get or create user document
    let userProfileDoc: UserProfileDocument;
    try {
      // First, try to get existing document
      userProfileDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        USERS_COLLECTION_ID,
        currentUser.$id
      ) as UserProfileDocument;
      console.log("Found existing user document:", userProfileDoc);
    } catch (error: any) {
      console.error("Error getting user document:", error);
      
      if (error.code === 404) {
        // Document doesn't exist, create it
        console.log("User document not found, creating new one...");
        try {
          userProfileDoc = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            USERS_COLLECTION_ID,
            currentUser.$id, // Use auth user ID as document ID
            {
              email: currentUser.email,
              username: currentUser.name || currentUser.email.split('@')[0],
              token_balance: FREE_TOKEN_ALLOWANCE,
              subscription_status: 'trial',
              subscription_end_date: null
            }
          ) as UserProfileDocument;
          console.log("Created new user document:", userProfileDoc);
          
          // Show success message for new user
          toast({
            title: "Welcome to EduVoice AI! 🎉",
            description: `Your account has been set up with ${FREE_TOKEN_ALLOWANCE.toLocaleString()} free tokens.`,
            duration: 5000,
          });
        } catch (createError: any) {
          console.error("Failed to create user document:", createError);
          if (createError.message.includes("Collection")) {
            throw new Error("Users collection not found. Please contact support to set up your account.");
          }
          throw new Error(`Failed to create user profile: ${createError.message}`);
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    // Update state with user data
    setTokenBalance(userProfileDoc.token_balance ?? FREE_TOKEN_ALLOWANCE);
    setIsProSubscribed(userProfileDoc.subscription_status === 'active');
    setSubscriptionEndDate(userProfileDoc.subscription_end_date ?? null);

  } catch (err: any) {
    console.error("Failed to fetch user subscription data:", err);
    
    let specificError = "Failed to load your subscription information.";
    let toastTitle = "Error Loading Subscription";

    if (err instanceof AppwriteException) {
      if (err.code === 401 || err.type === 'user_unauthorized') {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "default" });
        router.push('/login');
        return;
      } else if (err.code === 404 && err.message.includes("Collection")) {
        specificError = "Database setup incomplete. The users collection could not be found. Please contact support.";
        toastTitle = "Database Configuration Error";
      } else {
        specificError = `Database error: ${err.message}`;
      }
    } else if (err instanceof Error) {
      specificError = err.message;
    }
    
    setError(specificError);
    toast({
      title: toastTitle,
      description: specificError,
      variant: "destructive",
      duration: 10000,
    });
  } finally {
    setIsLoading(false);
  }
};
  useEffect(() => {
    fetchUserData();
  }, []);


  const handleSubscribeWithStripe = () => {
    if (!userId) {
      toast({ title: "User Not Identified", description: "Please ensure you are logged in and user data is loaded. Refresh if needed.", variant: "destructive" });
      return;
    }
    if (!STRIPE_PAYMENT_LINK) {
      toast({ title: "Configuration Error", description: "Stripe payment link is not configured.", variant: "destructive" });
      return;
    }
    setIsProcessingStripeRedirect(true);
    toast({ title: "Redirecting to Stripe...", description: "You will be redirected to our secure payment page." });
    
    console.log(`SubscriptionPage: Redirecting to Stripe with client_reference_id: "${userId}"`);
    const stripeLinkWithParams = `${STRIPE_PAYMENT_LINK}?client_reference_id=${encodeURIComponent(userId)}`;
    
    window.location.href = stripeLinkWithParams;
  };


  const handleManageSubscription = () => {
     toast({
      title: "Manage Subscription (Conceptual)",
      description: "For a live Stripe integration, this would redirect to a Stripe customer portal. This button is conceptual for now as payment processing is handled via Payment Links and webhooks.",
      duration: 7000,
    });
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      toast({ title: "Voucher Code Required", description: "Please enter a voucher code.", variant: "destructive" });
      return;
    }
    if (!userId) {
      toast({ title: "Error", description: "User not identified. Please refresh.", variant: "destructive" });
      return;
    }
    setIsRedeemingVoucher(true);
    try {
      const response = await fetch('/api/user/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, voucherCode: voucherCode.trim().toUpperCase() }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to redeem voucher.");
      }

      toast({
        title: "🎉 Voucher Redeemed!",
        description: result.message || `Successfully added ${VOUCHER_TOKEN_GRANT.toLocaleString()} tokens.`,
        className: "bg-green-100 border-green-300 text-green-800"
      });
      setTokenBalance(result.newTokenBalance);
      setVoucherCode("");

    } catch (err: any) {
      toast({
        title: "Voucher Redemption Failed",
        description: err.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  const displayTokensUsed = tokenBalance !== null ? (FREE_TOKEN_ALLOWANCE - tokenBalance > 0 ? FREE_TOKEN_ALLOWANCE - tokenBalance : 0) : 0;
  const displayTokensRemaining = tokenBalance !== null ? tokenBalance : 0;


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading Subscription Info...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

   if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden border-red-200 dark:border-red-800">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center justify-center text-xl">
                  <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
                <Button onClick={fetchUserData} variant="outline" className="rounded-xl">
                  Retry Loading
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Subscription & Usage
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">
                💎 Manage your EduVoice AI plan, track token usage, and unlock premium features
              </p>
            </div>
          </div>
        </div>

        {/* Token Usage Dashboard */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-b border-yellow-200/50 dark:border-yellow-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
                  Your Token Dashboard
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Track your AI usage and manage your token balance effectively
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Token Balance Display */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Current Balance</h3>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {displayTokensRemaining.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tokens Available</p>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Usage Stats</h3>
                </div>
                {!isProSubscribed && tokenBalance !== null && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Used</span>
                      <span className="font-medium">{displayTokensUsed.toLocaleString()} / {FREE_TOKEN_ALLOWANCE.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ease-out ${displayTokensRemaining > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-orange-600'}`}
                        style={{ width: `${displayTokensRemaining > 0 ? Math.min(100, (displayTokensRemaining / FREE_TOKEN_ALLOWANCE) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      {displayTokensRemaining > 0 ? `${Math.min(100, (displayTokensRemaining / FREE_TOKEN_ALLOWANCE) * 100).toFixed(1)}% remaining` : "No tokens remaining"}
                    </p>
                  </div>
                )}
                {isProSubscribed && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <Crown className="h-5 w-5" />
                      <span className="font-semibold">Unlimited Usage</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pro Plan Active</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Alerts */}
            <div className="mt-6">
              {displayTokensRemaining <= 0 && !isProSubscribed && (
                <Alert className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800 rounded-2xl">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-700 dark:text-red-300 font-semibold">Tokens Depleted</AlertTitle>
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    You've used all your free tokens. Redeem a voucher or upgrade to Pro to continue using AI features.
                  </AlertDescription>
                </Alert>
              )}
              {isProSubscribed && (
                <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 rounded-2xl">
                  <Crown className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700 dark:text-green-300 font-semibold">Pro Plan Active!</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    Your Pro subscription is active. Enjoy unlimited AI features!
                    {subscriptionEndDate && ` Your current period ends on ${new Date(subscriptionEndDate).toLocaleDateString()}.`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voucher Redemption */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                  Redeem Voucher
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Have a voucher code? Redeem it for {VOUCHER_TOKEN_GRANT.toLocaleString()} bonus tokens
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleRedeemVoucher} className="space-y-4">
              <div>
                <Label htmlFor="voucherCode" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Voucher Code
                </Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    id="voucherCode"
                    name="voucherCode"
                    placeholder="Enter your voucher code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    disabled={isRedeemingVoucher || isLoading}
                    className="flex-grow h-12 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400"
                  />
                  <Button 
                    type="submit" 
                    disabled={isRedeemingVoucher || isLoading || !voucherCode.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl px-6 h-12"
                  >
                    {isRedeemingVoucher ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                    Redeem
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Pro Plan Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
                  EduVoice AI Pro Plan
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Unlock unlimited AI features and premium capabilities
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$10</span>
                <span className="text-xl text-slate-500 dark:text-slate-400">/month</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Billed monthly • Cancel anytime</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">60,000 token bonus on signup</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Unlimited AI feature usage</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Priority access to new features</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Premium AI models & tools</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              {isProSubscribed ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <Crown className="h-6 w-6" />
                    <span className="text-lg font-semibold">You are subscribed to Pro!</span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription} 
                    disabled={isProcessingStripeRedirect}
                    className="rounded-xl border-2"
                  >
                    Manage Subscription <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  {subscriptionEndDate && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Current period ends: {new Date(subscriptionEndDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    size="lg"
                    onClick={handleSubscribeWithStripe}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl shadow-lg px-8 py-3 text-lg"
                    disabled={isProcessingStripeRedirect || isLoading}
                  >
                    {isProcessingStripeRedirect ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirecting to Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Upgrade to Pro
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Secure payment processing powered by Stripe
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Info className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                How It Works
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🪙 Tokens</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your initial {FREE_TOKEN_ALLOWANCE.toLocaleString()} tokens allow exploration of AI features. Vouchers add more tokens to your balance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">👑 Pro Plan</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  While Pro is active, token deductions are skipped. Subscribing also grants a one-time bonus of 60,000 tokens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}