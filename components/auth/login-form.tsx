'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

function getAuthErrorMessage(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? '';

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('invalid credentials') ||
    normalizedMessage.includes('invalid grant') ||
    normalizedMessage.includes('email not found')
  ) {
    return 'The email or password is incorrect.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Your email address is not confirmed yet.';
  }

  if (
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('too many requests')
  ) {
    return 'Unable to sign in right now. Please try again in a moment.';
  }

  return 'Unable to sign in right now. Please try again in a moment.';
}

export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error.message));
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Unable to sign in right now. Please try again in a moment.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>Work email</span>
        <Input
          autoComplete="email"
          name="email"
          placeholder="founder@utanvetcontrol.hu"
          required
          type="email"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>Password</span>
        <Input
          autoComplete="current-password"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />
      </label>

      {errorMessage ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
