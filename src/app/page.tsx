'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-300">
      <div className="flex items-center gap-3 text-sm font-medium">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Redirecionando...</span>
      </div>
    </div>
  );
}