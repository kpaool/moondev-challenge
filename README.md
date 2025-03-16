# Developer Evaluation Platform

A comprehensive platform built with Next.js for evaluating developer applications and managing the recruitment process. This platform, which is for the moondev nextjs challenge, allows candidates to submit their applications, code samples, and profiles, while evaluators can review, provide feedback, and manage the application status.

## Features

- **Application Submission**: Developers can submit their applications with personal details and code samples
- **Profile Management**: Candidates can create and manage their profiles
- **Evaluators Dashboard**: Evaluators can review applications, provide feedback, and change application status
- **Automated Notifications**: Email notifications for status changes and important updates
- **Secure File Storage**: Secure storage for profile pictures and code submissions
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js with React
- **UI Components**: shadcn/ui
- **Database & Storage**: Supabase
- **Email Service**: Mailjet
- **Styling**: Tailwind CSS
- **Authentication**: Supabase

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v22 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kpaool/moondev-challenge
   cd moondev-challenge
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_PP_STORAGE=your_profile_pictures_storage_bucket
   NEXT_PUBLIC_SUPABASE_CODE_STORAGE=your_code_submissions_storage_bucket
   MAILJET_API_KEY=your_mailjet_api_key
   MAILJET_SECRET_KEY=your_mailjet_secret_key
   MAILJET_APPROVED_TEMPLATE_ID=your_approved_email_template_id
   MAILJET_REJECTED_TEMPLATE_ID=your_rejected_email_template_id
   EMAIL_FROM=your_sender_email_address
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

This project uses Supabase as the database and storage provider. Follow these steps to set up your Supabase project:

1. Create a new project on [Supabase](https://supabase.com/)
2. Create the necessary tables in the Supabase SQL editor:

```sql
-- User profiles table
create table public.profiles (
  id uuid not null,
  email text not null,
  role text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (
      role = any (array['developer'::text, 'evaluator'::text])
    )
  )
) TABLESPACE pg_default;

-- Applications table
create table public.developer_submissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  full_name text not null,
  phone_number text not null,
  location text not null,
  email text not null,
  hobbies text not null,
  profile_picture_url text not null,
  source_code_url text not null,
  submission_date timestamp with time zone null default now(),
  status text null default 'pending'::text,
  evaluator_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint developer_submissions_pkey primary key (id),
  constraint developer_submissions_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint developer_submissions_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
```

3. Create storage buckets for `profile_pictures` and `code` submissions in the Supabase storage section

## Email Setup with Mailjet

1. Create an account on [Mailjet](https://www.mailjet.com/)
2. Create email templates for application approval and rejection notifications
3. Note the template IDs and API keys for environment variables

## Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com) from the creators of Next.js.

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project to Vercel
3. Add environment variables in the Vercel project settings
4. Deploy

```bash
npm run build
# or
yarn build
```

### Manual Deployment

For manual deployment:

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   yarn start
   ```


## User Roles and Permissions

- **Candidate**: Can create an account, submit applications, view application status
- **Evaluator**: Can review applications, provide feedback, approve/reject applications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Support

For support, email paul@katumbapaul.com or open an issue in the repository.