import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (supabaseConfigured) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/sign-in`, { status: 303 });
}
