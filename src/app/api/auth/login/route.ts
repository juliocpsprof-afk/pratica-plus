import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LoginRequestBody = {
  username?: string;
  password?: string;
};

type LoginResult = {
  profile_id: string;
  full_name: string;
  username: string;
  role: "professor" | "aluno";
  is_active: boolean;
  must_reset_password: boolean;
};

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variáveis do Supabase não foram configuradas.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;

    const username = body.username?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Informe usuário e senha." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.rpc("login_with_username", {
      p_username: username,
      p_plain_password: password,
    });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const user = (data?.[0] ?? null) as LoginResult | null;

    if (!user) {
      return NextResponse.json(
        { message: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      profileId: user.profile_id,
      fullName: user.full_name,
      username: user.username,
      role: user.role,
      mustResetPassword: user.must_reset_password,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível realizar o login.",
      },
      { status: 500 }
    );
  }
}
