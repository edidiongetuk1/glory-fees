import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Lock, Mail, User, Loader2 } from 'lucide-react';
import SplashScreen from '@/components/SplashScreen';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const isMobile = useIsMobile();

  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isMobile) {
      setShowSplash(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    if (isSignUp && !name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const result = await signup(email, password, name);
        if (result.success) {
          toast({
            title: 'Account Created!',
            description: 'You have successfully signed up.',
          });
          navigate('/dashboard');
        } else {
          toast({
            title: 'Sign Up Failed',
            description: result.error || 'Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        const success = await login(email, password);
        if (success) {
          toast({
            title: 'Welcome!',
            description: 'You have successfully logged in.',
          });
          navigate('/dashboard');
        } else {
          toast({
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 gradient-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          
          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
            <div className="mb-8 animate-fade-in">
              <div className="w-24 h-24 rounded-2xl gradient-gold flex items-center justify-center shadow-gold mb-6 mx-auto">
                <GraduationCap className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-primary-foreground mb-2">
                Soaring Glory
              </h1>
              <p className="text-xl text-primary-foreground/80">
                International Model Schools
              </p>
            </div>
            
            <div className="max-w-md animate-slide-up">
              <h2 className="text-2xl font-semibold text-primary-foreground mb-4">
                Enterprise Fee Management
              </h2>
              <p className="text-primary-foreground/70 leading-relaxed">
                A secure, session-based financial platform for managing student fees, 
                payments, and financial reporting across Nursery, Primary, and Secondary sections.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex-1 flex items-center justify-center p-4 sm:p-8 bg-card min-h-screen lg:min-h-0">
          <div className="w-full max-w-md animate-scale-in">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 rounded-xl gradient-gold flex items-center justify-center shadow-gold mb-4 mx-auto">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Soaring Glory</h1>
              <p className="text-muted-foreground">International Model Schools</p>
            </div>

            <Card className="border-0 shadow-elevated">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-center">
                  {isSignUp 
                    ? 'Enter your details to create an account' 
                    : 'Enter your credentials to access the system'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="Enter your full name" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          className="pl-10" 
                          disabled={isLoading} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="pl-10" 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="pl-10" 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {isSignUp ? 'Creating Account...' : 'Signing in...'}
                      </>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="ml-1 text-primary font-medium hover:underline"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              © 2025 Soaring Glory International Model Schools
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
