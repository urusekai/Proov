import { z } from "zod";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  nickname: z.string().trim().min(2).max(20).optional(),
  avatarUrl: z.string().max(1_500_000).nullable().optional().or(z.literal("").transform(() => null)),
});

export async function PATCH(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return jsonError(500, "SUPABASE_NOT_CONFIGURED", "Supabase 환경 변수가 필요합니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "INVALID_REQUEST", "프로필 입력값이 올바르지 않습니다.");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      nickname: body.data.nickname,
      avatar_url: body.data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .select("id,nickname,avatar_url")
    .single();

  if (error || !data) {
    return jsonError(500, "PROFILE_SAVE_FAILED", "프로필을 저장하지 못했습니다.");
  }

  return Response.json({ profile: { id: data.id, nickname: data.nickname, avatarUrl: data.avatar_url } });
}
