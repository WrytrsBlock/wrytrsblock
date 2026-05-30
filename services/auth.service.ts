import type { DB } from "./types";

export async function getCurrentUser(supabase: DB) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut(supabase: DB) {
  return supabase.auth.signOut();
}

export async function signInWithPassword(
  supabase: DB,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithMagicLink(
  supabase: DB,
  email: string,
  redirectTo: string
) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
}

export async function signUpWithPassword(
  supabase: DB,
  email: string,
  password: string,
  displayName: string,
  redirectTo: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: redirectTo,
    },
  });
}
