import { z } from "zod";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  confirmEmail: z.string().email(),
});

export async function DELETE(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return jsonError(500, "SUPABASE_NOT_CONFIGURED", "Supabase 환경 변수가 필요합니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user?.email) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success || body.data.confirmEmail !== user.email) {
    return jsonError(400, "INVALID_CONFIRM_EMAIL", "현재 이메일을 정확히 입력해 주세요.");
  }

  const supabase = createSupabaseAdmin();
  await supabase.from("profiles").delete().eq("id", user.id);
  const { error } = await supabase.auth.admin.deleteUser(user.id);

  if (error) {
    return jsonError(500, "ACCOUNT_DELETE_FAILED", "회원탈퇴를 처리하지 못했습니다.");
  }

  return Response.json({ ok: true });
}
