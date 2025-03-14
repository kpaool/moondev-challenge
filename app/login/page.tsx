"use client"
// src/pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { login, signup } from './actions'
import { toast } from "sonner"
import Head from 'next/head';
import Link from 'next/link';

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    

    try {
        const result = await login(formData);
        if(result.sucess){
          toast.success("Log in successful, redirecting you to platform")
          router.push("/")
        }else{
          toast.error(result.error?.message)
        }
    //   const { data, error } = await supabase.auth.signInWithPassword({
    //     email,
    //     password,
    //   });

    //   if (error) {
    //     throw error;
    //   }

    //   if (data.user) {
    //     // Fetch user profile to determine role
    //     const { data: profileData, error: profileError } = await supabase
    //       .from('profiles')
    //       .select('role')
    //       .eq('id', data.user.id)
    //       .single();

    //     if (profileError) {
    //       throw profileError;
    //     }

    //     const role = profileData?.role;
        
    //     toast.success("You are logged in successfully, you are going to be redirected")
    //     // Redirect based on role
    //     router.push('/');
    //   }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Developer Evaluation Platform</title>
        <meta name="description" content="Login to the Developer Evaluation Platform" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password"
                  type="password"
                  name='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?  {' '}
              <Link href={'/register'} className="text-blue-600 hover:text-blue-800 font-medium"> Sign up here</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}