import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '@/lib/server/prisma'
import { createServerSupabaseClient } from '@/lib/utils/supabase/server'

export async function syncUserProfile(
  user: SupabaseUser,
  displayName?: string | null
) {
  const resolvedName = displayName ?? (user.user_metadata?.full_name as string | undefined)

  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? undefined,
      displayName: resolvedName ?? undefined,
    },
    update: {
      email: user.email ?? undefined,
      ...(resolvedName ? { displayName: resolvedName } : {}),
    },
  })
}

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    if (error.name === 'AuthSessionMissingError') {
      return { supabase, user: null, profile: null }
    }
    throw error
  }

  if (!user) {
    return { supabase, user: null, profile: null }
  }

  const profile = await syncUserProfile(user)
  return { supabase, user, profile }
}

export async function requireAuthenticatedUser() {
  const { supabase, user, profile } = await getAuthenticatedUser()

  if (!user || !profile) {
    throw new Error('Unauthorized')
  }

  return { supabase, user, profile }
}
