// In your layout component
import Navbar from '@/components/Navbar';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'


export default async function Layout({ children }: Readonly<{
    children: React.ReactNode;
  }>) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()
    const user  = data?.user // Or however you're managing auth state
  
    return (
        <>
        <Navbar user={user} />
        <main>
            {children}
        </main>
        </>
    );
}