"use client"
// src/pages/register.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';
import Link from 'next/link';

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('developer'); // Default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Register the user with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role, // Store role in user metadata
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Manually create or update the profile with the selected role
        // (As a backup in case the trigger doesn't work)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            role,
            created_at: new Date(),
            updated_at: new Date(),
          });

        if (profileError) throw profileError;

        // Show success message
        setSuccess(true);
        
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register | Developer Evaluation Platform</title>
        <meta name="description" content="Register for the Developer Evaluation Platform" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to register for the platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {success ? (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  Registration successful! Please check your email to confirm your account. 
                  Redirecting to login page...
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select 
                    defaultValue="developer" 
                    onValueChange={(value) => setRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="evaluator">Evaluator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
