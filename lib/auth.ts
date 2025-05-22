"use client"

import { useSession as useNextAuthSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

export function useSession() {
  const { data: session, status } = useNextAuthSession()
  return { session, status }
}

export const signIn = () => nextAuthSignIn("azure-ad")
export const signOut = () => nextAuthSignOut()
