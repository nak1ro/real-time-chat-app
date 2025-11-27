'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, Waves } from 'lucide-react';

// Password validation rules
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
] as const;

// Form field error component
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-destructive mt-1">{error}</p>;
}

// Password rules component with live validation
function PasswordRules({ password }: { password: string }) {
  return (
    <div className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <div
            key={rule.id}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors',
              passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}
          >
            {passed ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Sign In Form
function SignInForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ name: username.trim(), password });
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.message || 'Invalid credentials';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-username">Username</Label>
        <Input
          id="signin-username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          disabled={isLoading}
          autoComplete="username"
        />
        <FieldError error={errors.username} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          disabled={isLoading}
          autoComplete="current-password"
        />
        <FieldError error={errors.password} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}

// Sign Up Form
function SignUpForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    repeatPassword?: string;
  }>({});

  const isPasswordValid = PASSWORD_RULES.every((rule) => rule.test(password));

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet all requirements';
    }

    if (!repeatPassword) {
      newErrors.repeatPassword = 'Please confirm your password';
    } else if (password !== repeatPassword) {
      newErrors.repeatPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, password, repeatPassword, isPasswordValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({ name: username.trim(), password });
      toast.success('Account created. Welcome to Wave!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.message || 'Could not create account';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-username">Username</Label>
        <Input
          id="signup-username"
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          disabled={isLoading}
          autoComplete="username"
        />
        <FieldError error={errors.username} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <PasswordRules password={password} />
        <FieldError error={errors.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-repeat-password">Confirm Password</Label>
        <Input
          id="signup-repeat-password"
          type="password"
          placeholder="Repeat your password"
          value={repeatPassword}
          onChange={(e) => {
            setRepeatPassword(e.target.value);
            if (errors.repeatPassword) setErrors((prev) => ({ ...prev, repeatPassword: undefined }));
          }}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <FieldError error={errors.repeatPassword} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Sign up'
        )}
      </Button>
    </form>
  );
}

// Main Auth Page
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Waves className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Wave</CardTitle>
          </div>
          <CardDescription className="text-sm">
            {activeTab === 'signin' ? 'Welcome back to Wave' : 'Create your Wave account'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <SignInForm />
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

