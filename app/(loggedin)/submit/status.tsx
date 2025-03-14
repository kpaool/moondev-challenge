import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, LinkIcon, MapPinIcon, PhoneIcon, MailIcon } from 'lucide-react';

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
    "status": string,
    "evaluator_notes": string,
    "created_at": string,
    "updated_at": string
  };

const ApplicationStatusUI = (props:{application:_application}) => {
  // This would typically come from an API or props
  
  const application = props.application

  // Format date for display
  const formatDate = (dateString:string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Status badge color based on application status
  const getStatusColor = (status:string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500 hover:bg-green-600';
      case 'rejected':
        return 'bg-red-500 hover:bg-red-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto">
      {/* Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-6 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold">Application Status</h1>
          <p className="text-gray-500">Application ID: {application.id}</p>
        </div>
        <Badge className={`text-lg py-2 px-4 ${getStatusColor(application.status)}`}>
          {application.status.toUpperCase()}
        </Badge>
      </div>

      {/* Evaluator Notes */}
      {application.evaluator_notes && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>Evaluator Feedback</CardTitle>
            <CardDescription>Last updated on {formatDate(application.updated_at)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{application.evaluator_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage className='object-cover' src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_PP_STORAGE}/${application.profile_picture_url}`} alt={application.full_name} />
                <AvatarFallback>{application.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-grow space-y-4">
              <h3 className="text-xl font-bold">{application.full_name}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-gray-500" />
                  <span>{application.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-gray-500" />
                  <span>{application.phone_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                  <span>{application.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span>Submitted: {formatDate(application.submission_date)}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Hobbies</h4>
                <p>{application.hobbies}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-gray-500" />
            <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_CODE_STORAGE}/${application.source_code_url}`}  className="text-blue-600 hover:underline">
              View Source Code
            </a>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          <div className="flex justify-between w-full">
            <span>Created: {formatDate(application.created_at)}</span>
            <span>Last Updated: {formatDate(application.updated_at)}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ApplicationStatusUI;