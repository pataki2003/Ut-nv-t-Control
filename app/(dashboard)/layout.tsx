import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { createClient } from '@/lib/supabase/server';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <AppShell>{children}</AppShell>;
}
