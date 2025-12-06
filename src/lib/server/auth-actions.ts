'use server'

import { revalidatePath } from 'next/cache'
import { syncUserProfile } from '@/lib/server/auth'
import { createServerSupabaseClient } from '@/lib/utils/supabase/server'
import { createAdminSupabaseClient } from '@/lib/utils/supabase/admin'

export type AuthActionState = {
  success: boolean
  error?: string
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return value?.toString().trim().toLowerCase()
}

function normalizeString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim()
  return parsed?.length ? parsed : undefined
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get('email'))
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    const normalizedMessage = error?.message?.toLowerCase() ?? ''
    let message = error?.message ?? 'Unable to sign in. Check your credentials.'

    if (normalizedMessage.includes('email not confirmed')) {
      message = 'Please confirm your email from the verification link before signing in.'
    }

    return { success: false, error: message }
  }

  await syncUserProfile(data.user)
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signupAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get('email'))
  const password = formData.get('password')?.toString() ?? ''
  const displayName = normalizeString(formData.get('name'))

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { full_name: displayName } : undefined,
    },
  })

  if (error || !data.user) {
    return { success: false, error: error?.message ?? 'Unable to sign up.' }
  }

  const adminClient = createAdminSupabaseClient()
  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      })
    } catch (adminError) {
      console.warn('Failed to auto confirm user', adminError)
    }
  }

  const { error: postSignupError } = await supabase.auth.signInWithPassword({ email, password })
  if (postSignupError) {
    console.warn('Auto-login after signup failed', postSignupError)
  }

  await syncUserProfile(data.user, displayName)
  revalidatePath('/', 'layout')
  return { success: true }
}
