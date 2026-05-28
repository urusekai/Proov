import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return jsonError(500, "SUPABASE_NOT_CONFIGURED", "Supabase 환경 변수가 필요합니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user?.email) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "INVALID_REQUEST", "비밀번호 입력값이 올바르지 않습니다.");
  }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error: verifyError } = await anon.auth.signInWithPassword({
    email: user.email,
    password: body.data.currentPassword,
  });

  if (verifyError) {
    return jsonError(400, "INVALID_CURRENT_PASSWORD", "현재 비밀번호가 올바르지 않습니다.");
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: body.data.newPassword,
  });

  if (error) {
    return jsonError(500, "PASSWORD_CHANGE_FAILED", "비밀번호를 변경하지 못했습니다.");
  }

  return Response.json({ ok: true });
}
