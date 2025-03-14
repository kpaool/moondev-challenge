"use client"
// pages/submissions/evaluate/[id].tsx
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
// import { createClient } from '@supabase/supabase-js';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Github, 
  Check, 
  X,
  Loader2,
  Clock
} from 'lucide-react';



// Status badge color mapping
const statusColorMap = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'reviewing': 'bg-blue-100 text-blue-800',
};

type _application = {
  "id": string,
  "user_id":string,
  "full_name": string,
  "phone_number": string,
  "location": string,
  "email": string,
  "hobbies": string,
  "profile_picture_url": string,
  "source_code_url": string,
  "submission_date": string,
  "status": "pending" | "approved" | 'rejected' |"reviewing",
  "evaluator_notes": string,
  "created_at": string,
  "updated_at": string
};

export default function EvaluateSubmission() {
  const router = useRouter();
  const supabase = createClient() 
  
  const [submission, setSubmission] = useState<_application | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const  {id}  = useParams()
  useEffect(() => {
    if (id) {
      fetchSubmission(id as string);
    }
  }, [id]);

  const handleUpdates = (payload:any) => {
    if(submission?.id==payload.new.id){
      setSubmission(payload.new)
    }
  }
  
  supabase
    .channel('developer_submissions')
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'developer_submissions',
    }, handleUpdates)
    .subscribe()


  useEffect(()=>{
    getSupabaseImage(submission?.profile_picture_url??'')
    getSupabaseAsset(submission?.source_code_url??'')
    checkUser()
  },[submission])

  const checkUser = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      router.push('/login')
    }
    const user=data?.user

    if (!user) {
      toast.error("There is no logged in user")
      router.push('/login');
      return;
    }

    // Check if user is a developer
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profileData?.role !== 'evaluator') {
      // Not authorized as developer, redirect
      toast.error("Only evaluators can access this resource")        
      router.push('/login');
      return;
    }

    setLoading(false);
  };
  

  const getSupabaseAsset = async (assetId:string)=>{
    const data=  await supabase.storage.from(process.env.NEXT_PUBLIC_SUPABASE_CODE_STORAGE as string).getPublicUrl(assetId).data
    const url = await data.publicUrl
    setCode(url)
  }
  const getSupabaseImage = async (imgId:string)=>{
    const data=  await supabase.storage.from(process.env.NEXT_PUBLIC_SUPABASE_PP_STORAGE as string).getPublicUrl(imgId).data
    const url = await data.publicUrl
    setProfilePic(url)
  }

  const sendDecisionEmail = async (email:string, name:string, status:string, notes:string) => {
    try {
      const response = await fetch('/api/email-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          status,
          notes
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { error: true, message: error.message };
    }
  };
  
  const fetchSubmission = async (submissionId:string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('developer_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    
    if (error) {
      console.error('Error fetching submission:', error);
      toast.error("Failed to load the submission. Please try again");
    } else {
      setSubmission(data);
      setEvaluatorNotes(data.evaluator_notes || '');
    }
    
    setLoading(false);
  };
  
  const handleSaveFeedback = async () => {
    if (!submission) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('developer_submissions')
      .update({ evaluator_notes: evaluatorNotes, updated_at: new Date().toISOString() })
      .eq('id', submission.id);
    
    if (error) {
      console.error('Error saving feedback:', error);
      toast.error("Failed to save feedback. Please try again");
    } else {
      toast.success("Feedback saved successfully.");
    }
    
    setSaving(false);
  };
  
  const handleUpdateStatus = async (newStatus:string) => {
    if (!submission) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('developer_submissions')
      .update({ 
        status: newStatus, 
        evaluator_notes: evaluatorNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission.id);
    
    if (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to ${newStatus === 'approved' ? 'approve' : 'reject'} the submission. Please try again.`);
    } else {
      setSubmission({
        ...submission,
        status: newStatus,
        evaluator_notes: evaluatorNotes
      });
      
      toast(`Submission ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`);
      await sendDecisionEmail(submission.email,submission.full_name,newStatus,evaluatorNotes)
      // Close dialog
      setDialogOpen(false);
    }
    
    setSaving(false);
  };
  
  const formatDate = (dateString:string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getInitials = (name:string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleDownloadCode = () => {
    if (submission?.source_code_url) {
      window.open(code, '_blank');
    } else {
      toast.error("Source code URL is not available.");
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading submission details...</p>
        </div>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Submission Not Found</CardTitle>
            <CardDescription>
              The submission you are looking for does not exist or you do not have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/evaluate')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Submissions
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/evaluate')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Developer Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Developer Profile</CardTitle>
            <CardDescription>
              Submission ID: {submission.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profilePic} className='object-cover' />
                <AvatarFallback className="text-2xl">
                  {getInitials(submission.full_name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">{submission.full_name}</h3>
              <Badge className={statusColorMap[submission.status] || 'bg-gray-100 text-gray-800'}>
                {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Unknown'}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{submission.email}</span>
              </div>
              
              {submission.phone_number && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{submission.phone_number}</span>
                </div>
              )}
              
              {submission.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{submission.location}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Submitted: {formatDate(submission.submission_date)}</span>
              </div>
              
              {submission.source_code_url && (
                <div className="flex items-center">
                  <Github className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm truncate">Has code submission</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleDownloadCode}
              disabled={!submission.source_code_url}
            >
              <Download className="h-4 w-4 mr-2" />
              <Link href={code} target="_blank">
                Download Source Code
              </Link>              
            </Button>
          </CardFooter>
        </Card>
        
        {/* Evaluation Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evaluation</CardTitle>
            <CardDescription>
              Review the submission and provide feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Submission Details</TabsTrigger>
                <TabsTrigger value="feedback">Evaluation & Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Developer Hobbies</h4>
                  <p className="text-sm text-gray-700">
                    {submission.hobbies || 'No hobbies specified'}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Submission Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">Created: {formatDate(submission.created_at)}</span>
                    </div>
                    {submission.updated_at && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Last Updated: {formatDate(submission.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Profile Resources</h4>
                  <div className="flex flex-col gap-2">
                    {submission.profile_picture_url && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={profilePic} target="_blank">
                          View Profile Picture
                        </Link>
                      </Button>
                    )}
                    {submission.source_code_url && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={code} target="_blank">
                          View Source Code Repository
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Evaluator Notes</h4>
                  <Textarea 
                    placeholder="Enter your evaluation notes and feedback for this developer..."
                    className="min-h-32"
                    value={evaluatorNotes}
                    onChange={(e) => setEvaluatorNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveFeedback} 
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Feedback'}
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Decision</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Make a final decision on this developer submission. This action will update the submission status and notify the developer.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Dialog open={dialogOpen && decision === 'approve'} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            setDecision('approve');
                            setDialogOpen(true);
                          }}
                          disabled={submission.status === 'approved'}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Welcome to the Team
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Approval</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to approve this developer submission? This will update their status to "approved" and notify them of your decision.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                          <Button 
                            onClick={() => handleUpdateStatus('approved')}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Confirm Approval
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={dialogOpen && decision === 'reject'} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setDecision('reject');
                            setDialogOpen(true);
                          }}
                          disabled={submission.status === 'rejected'}
                        >
                          <X className="h-4 w-4 mr-2" />
                          We Are Sorry
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Rejection</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to reject this developer submission? This will update their status to "rejected" and notify them of your decision.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleUpdateStatus('rejected')}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Confirm Rejection
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}