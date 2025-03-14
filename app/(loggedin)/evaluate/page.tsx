"use client"
// pages/index.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, Filter, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'


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

export default function DeveloperSubmissions() {
  const supabase = createClient()
  const router = useRouter();
  const [submissions, setSubmissions] = useState<_application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStatus, setCurrentStatus] = useState('all');

  useEffect(() => {
    fetchSubmissions();
    checkUser()
  }, [currentStatus]);

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


  const fetchSubmissions = async () => {
    setLoading(true);
    
    let query = supabase.from('developer_submissions').select('*');
    
    if (currentStatus !== 'all') {
      query = query.eq('status', currentStatus);
    }
    
    const { data, error } = await query.order('submission_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      setSubmissions(data || []);
    }
    
    setLoading(false);
  };

  const filteredSubmissions = submissions.filter(submission => {
    const fullName = submission.full_name?.toLowerCase() || '';
    const email = submission.email?.toLowerCase() || '';
    const location = submission.location?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query) || location.includes(query);
  });

  const formatDate = (dateString:string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Developer Submissions</CardTitle>
            <CardDescription>
              Manage and review developer applications
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSubmissions}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name, email or location..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs 
                defaultValue="all" 
                onValueChange={(value) => setCurrentStatus(value)}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-4 md:grid-cols-5 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected" className="hidden md:block">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Developer</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading submissions...
                      </TableCell>
                    </TableRow>
                  ) : filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No submissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage className='object-cover' src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_PP_STORAGE}/${submission.profile_picture_url}`} />
                              <AvatarFallback>
                                {getInitials(submission.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{submission.full_name}</span>
                              <span className="text-sm text-gray-500">{submission.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {submission.location || '-'}
                        </TableCell>
                        <TableCell>
                          {formatDate(submission.submission_date)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={statusColorMap[submission.status] || 'bg-gray-100 text-gray-800'}
                          >
                            {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem><Link href={`/evaluate/${submission.id}`}> View Details</Link></DropdownMenuItem>
                              {/* <DropdownMenuItem>View Code</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Change Status</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete Submission
                              </DropdownMenuItem> */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}