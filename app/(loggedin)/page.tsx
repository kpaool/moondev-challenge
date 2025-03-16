import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Code, ClipboardCheck } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    // redirect('/login')
  }

  if(data?.user){
    if(data.user.user_metadata.role=='evaluator'){
      redirect('/evaluate')
    }else{
      redirect('/submit')
    }
  }
  
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-background/80">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo and Title */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
              <Code className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Developer Evaluation Platform
            </p>
          </div>
          
          {/* Main description */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Streamlining the Developer Evaluation Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform connects talented developers with evaluators to build extraordinary teams through a structured and transparent assessment process.
            </p>
          </div>
          
          {/* Path selection cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {/* Developer Card */}
            <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
              <CardContent className="flex flex-col p-6 space-y-4 flex-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mx-auto">
                  <Code className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-center">For Developers</h3>
                <p className="text-muted-foreground text-center flex-1">
                  Submit your application, share your code, and showcase your skills to join our team of talented developers.
                </p>
                <Link href="/submit" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Apply as Developer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Evaluator Card */}
            <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
              <CardContent className="flex flex-col p-6 space-y-4 flex-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mx-auto">
                  <ClipboardCheck className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-center">For Evaluators</h3>
                <p className="text-muted-foreground text-center flex-1">
                  Review applications, evaluate code samples, and help build our team by identifying top talent.
                </p>
                <Link href="/evaluate" className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Login as Evaluator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 MoonDev. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              About
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
