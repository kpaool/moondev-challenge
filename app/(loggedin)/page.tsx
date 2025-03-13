import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  console.log(data)
  if (error || !data?.user) {
    redirect('/login')
  }

  if(data.user.user_metadata.role=='evaluator'){
    redirect('/evaluate')
  }else{
    redirect('/submit')
  }
  
  return (
    
    <div className="flex w-full h-screen justify-center items-center">
      Hello
    </div>
  );
}
