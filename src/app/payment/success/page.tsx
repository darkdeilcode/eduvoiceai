'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  Info, 
  Crown, 
  Sparkles, 
  Gift, 
  Star,
  Zap,
  BrainCircuit,
  Shield
} from 'lucide-react';
import { account } from '@/lib/appwrite';
import { AppwriteException } from 'appwrite';

const SuccessPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation on mount
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleActivateProPlan = async () => {
    setIsActivating(true);
    setActivationMessage(null);
    setActivationError(null);

    try {
      const currentUser = await account.get();
      if (!currentUser?.$id) {
        throw new Error("User not found. Please ensure you are logged in.");
      }
      const userId = currentUser.$id;

      const response = await fetch('/api/user/activate-pro-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to activate Pro plan.");
      }

      setActivationMessage(result.message || "Pro plan activated successfully! Your account has been updated.");
      toast({
        title: "🎉 Pro Plan Activated!",
        description: result.message || "Your subscription benefits are now active.",
      });

    } catch (error: any) {
      console.error("Error activating Pro plan:", error);
      let errorMessage = "An unexpected error occurred during activation.";
      if (error instanceof AppwriteException) {
        errorMessage = `Appwrite error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setActivationError(errorMessage);
      toast({
        title: "Activation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              <Star className="h-4 w-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-full mb-6">
              <CheckCircle className="h-16 w-16 text-white mx-auto" />
            </div>
          </div>
          <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            🎉 Payment Successful!
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Welcome to the EduVoice AI Pro experience
          </p>
        </div>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200/50 dark:border-green-800/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <CardTitle className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
                Pro Plan Activation
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
              Your payment has been processed successfully. Complete your Pro plan activation below.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Pro Benefits Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Unlimited AI Access</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">No token limits, unlimited learning</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                      <BrainCircuit className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Advanced AI Features</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Premium AI models & capabilities</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-4 border border-green-200/50 dark:border-green-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Priority Support</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">24/7 dedicated assistance</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl p-4 border border-orange-200/50 dark:border-orange-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Exclusive Content</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Pro-only features & materials</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activation Section */}
              {!activationMessage && !activationError && (
                <div className="text-center">
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Complete your Pro plan activation to unlock all premium features and start your enhanced AI learning experience.
                  </p>
                  <Button 
                    onClick={handleActivateProPlan} 
                    disabled={isActivating}
                    size="lg"
                    className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Activating Your Pro Plan...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-5 w-5" />
                        Activate My Pro Plan
                        <Sparkles className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Success Message */}
              {activationMessage && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                      Pro Plan Activated!
                    </h3>
                  </div>
                  <p className="text-green-600 dark:text-green-400">{activationMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {activationError && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Info className="h-6 w-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                      Activation Error
                    </h3>
                  </div>
                  <p className="text-red-600 dark:text-red-400">{activationError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <Button asChild size="lg" className="h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl">
                  <Link href="/dashboard">
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-2">
                  <Link href="/settings/subscription">
                    <Crown className="mr-2 h-5 w-5" />
                    View Subscription
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg">
              <Info className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Important Information</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>
              • Your payment has been processed successfully and you will receive a confirmation email shortly.
            </p>
            <p>
              • If manual activation fails, our automated system will activate your Pro plan within 5-10 minutes.
            </p>
            <p>
              • For any billing questions or support, please contact our team through the help center.
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-600/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Payment processed securely via encrypted connection
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default SuccessPage;