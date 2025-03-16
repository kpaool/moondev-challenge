"use client"
// src/pages/developer-submit.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
// import { createClient } from '@supabase/supabase-js';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X, Check, AlertCircle, FileIcon } from "lucide-react";
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client'
import ApplicationStatusUI  from './status'

// Initialize Supabase client
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Form validation types
type FormData = {
  fullName: string;
  phoneNumber: string;
  location: string;
  email: string;
  hobbies: string;
  profilePicture: File | null;
  sourceCode: File | null;
};

type FormErrors = {
  [key in keyof FormData]?: string;
};

export default function DeveloperSubmit() {
  const supabase = createClient()
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const handleUpdates = (payload:any) => {
    if(submission.id==payload.new.id){
      setSubmission(payload.new)
    }
  }
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    location: '',
    email: '',
    hobbies: '',
    profilePicture: null,
    sourceCode: null,
  });
  
  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Check auth on load
  useEffect(() => {
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

      if (profileError || profileData?.role !== 'developer') {
        // Not authorized as developer, redirect
        toast.error("Only developers can access this resource")        
        router.push('/login');
        return;
      }

      setUser(user);
      // Pre-fill email from authenticated user
      setFormData(prev => ({ ...prev, email: user.email || '' }));

      const submission=  await supabase
        .from('developer_submissions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if(!submission.error){
        setSubmission(submission.data)
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);


  // run realtime updates when submission exists
  useEffect(()=>{
    if(submission){
      console.log("there is a submission")
      supabase
      .channel('developer_submissions')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'developer_submissions',
        filter: `id=eq.${submission.id}`
      }, handleUpdates)
      .subscribe()
    }
  },[submission])

  // Handle profile picture dropzone
  const onProfileDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      const file = acceptedFiles[0];
      
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setImagePreview(previewUrl);
      
      // Update form data
      setFormData(prev => ({ ...prev, profilePicture: compressedFile }));
      setErrors(prev => ({ ...prev, profilePicture: undefined }));
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        profilePicture: 'Error processing image. Please try another file.' 
      }));
    }
  }, []);
  
  const { 
    getRootProps: getProfileRootProps, 
    getInputProps: getProfileInputProps,
    isDragActive: isProfileDragActive
  } = useDropzone({ 
    onDrop: onProfileDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  // Handle source code dropzone
  const onSourceCodeDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!file.name.endsWith('.zip')) {
      setErrors(prev => ({ 
        ...prev, 
        sourceCode: 'Please upload a ZIP file.' 
      }));
      return;
    }
    
    setFormData(prev => ({ ...prev, sourceCode: file }));
    setErrors(prev => ({ ...prev, sourceCode: undefined }));
  }, []);
  
  const { 
    getRootProps: getSourceCodeRootProps, 
    getInputProps: getSourceCodeInputProps,
    isDragActive: isSourceCodeDragActive
  } = useDropzone({ 
    onDrop: onSourceCodeDrop,
    accept: {
      'application/zip': ['.zip']
    },
    maxFiles: 1
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Remove profile picture
  const removeProfilePicture = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, profilePicture: null }));
  };

  // Remove source code
  const removeSourceCode = () => {
    setFormData(prev => ({ ...prev, sourceCode: null }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9\s-()]{8,20}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.hobbies.trim()) {
      newErrors.hobbies = 'Please tell us about your hobbies';
    } else if (formData.hobbies.length < 20) {
      newErrors.hobbies = 'Please provide more details about your hobbies (min 20 characters)';
    }
    
    if (!formData.profilePicture) {
      newErrors.profilePicture = 'Profile picture is required';
    }
    
    if (!formData.sourceCode) {
      newErrors.sourceCode = 'Source code upload is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Upload profile picture
      let profilePictureUrl = '';
      if (formData.profilePicture) {
        const fileExt = formData.profilePicture.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, formData.profilePicture, { upsert: true });
          
        if (uploadError) throw uploadError;
        profilePictureUrl = uploadData.path;
      }
      
      // Upload source code
      let sourceCodeUrl = '';
      if (formData.sourceCode) {
        const fileName = `${user.id}-${Date.now()}-${formData.sourceCode.name}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('source-code')
          .upload(fileName, formData.sourceCode, { upsert: true });
          
        if (uploadError) throw uploadError;
        sourceCodeUrl = uploadData.path;
      }
      
      // Save submission data
      const { error: submissionError } = await supabase
        .from('developer_submissions')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          location: formData.location,
          email: formData.email,
          hobbies: formData.hobbies,
          profile_picture_url: profilePictureUrl,
          source_code_url: sourceCodeUrl,
          submission_date: new Date()
        });
        
      if (submissionError) throw submissionError;
      
      // Show success
      setSubmitSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (error: any) {
      setSubmitError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Submit Project | Developer Evaluation Platform</title>
        <meta name="description" content="Submit your developer profile and project" />
      </Head>
      
      
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {submission? (<ApplicationStatusUI application={submission}   />):(<>
      
          <h1 className="text-3xl font-bold mb-6">Developer Submission</h1>
          
          {submitSuccess ? (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your submission has been received successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    <Separator />
                    
                    <div className="space-y-2" data-error={!!errors.fullName}>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={errors.fullName ? "border-red-500" : ""}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500">{errors.fullName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2" data-error={!!errors.phoneNumber}>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input 
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+1 (123) 456-7890"
                        className={errors.phoneNumber ? "border-red-500" : ""}
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2" data-error={!!errors.location}>
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className={errors.location ? "border-red-500" : ""}
                      />
                      {errors.location && (
                        <p className="text-sm text-red-500">{errors.location}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2" data-error={!!errors.email}>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2" data-error={!!errors.hobbies}>
                      <Label htmlFor="hobbies">
                        What do you like to do in life (other than coding)?
                      </Label>
                      <Textarea 
                        id="hobbies"
                        name="hobbies"
                        value={formData.hobbies}
                        onChange={handleInputChange}
                        placeholder="Tell us about your real hobbies and interests..."
                        className={`min-h-32 ${errors.hobbies ? "border-red-500" : ""}`}
                      />
                      {errors.hobbies && (
                        <p className="text-sm text-red-500">{errors.hobbies}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Profile Picture Upload */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Profile Picture</h2>
                    <Separator />
                    
                    <div className="space-y-2" data-error={!!errors.profilePicture}>
                      {imagePreview ? (
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={imagePreview} alt="Profile preview" />
                            <AvatarFallback>
                              {formData.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 mb-2">
                              Image uploaded successfully
                            </p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={removeProfilePicture}
                            >
                              <X className="h-4 w-4 mr-2" /> Remove image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          {...getProfileRootProps()}
                          className={`border-2 border-dashed rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isProfileDragActive 
                              ? "border-blue-400 bg-blue-50" 
                              : errors.profilePicture 
                                ? "border-red-300" 
                                : "border-gray-300"
                          }`}
                        >
                          <input {...getProfileInputProps()} />
                          <div className="flex flex-col items-center justify-center space-y-2 text-center">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="text-sm font-medium">
                              {isProfileDragActive 
                                ? "Drop the image here..." 
                                : "Drag & drop your profile picture, or click to select"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Images will be compressed to max 1MB and resized to max 1080px
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {errors.profilePicture && (
                        <p className="text-sm text-red-500">{errors.profilePicture}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Source Code Upload */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Source Code</h2>
                    <Separator />
                    
                    <div className="space-y-2" data-error={!!errors.sourceCode}>
                      {formData.sourceCode ? (
                        <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
                          <FileIcon className="h-8 w-8 text-blue-500" />
                          
                          <div className="flex-1">
                            <p className="font-medium">{formData.sourceCode.name}</p>
                            <p className="text-sm text-gray-500">
                              {(formData.sourceCode.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={removeSourceCode}
                          >
                            <X className="h-4 w-4 mr-2" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <div 
                          {...getSourceCodeRootProps()}
                          className={`border-2 border-dashed rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isSourceCodeDragActive 
                              ? "border-blue-400 bg-blue-50" 
                              : errors.sourceCode 
                                ? "border-red-300" 
                                : "border-gray-300"
                          }`}
                        >
                          <input {...getSourceCodeInputProps()} />
                          <div className="flex flex-col items-center justify-center space-y-2 text-center">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="text-sm font-medium">
                              {isSourceCodeDragActive 
                                ? "Drop the ZIP file here..." 
                                : "Drag & drop your project ZIP file, or click to select"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Please upload a ZIP file containing your project's source code
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {errors.sourceCode && (
                        <p className="text-sm text-red-500">{errors.sourceCode}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Submit button & error message */}
                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          </>
        )
        }
      </div>
    </>
  );
}