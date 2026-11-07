// Kiểm tra danh sách mời dùng thử bản web (GIA-69). Luật nằm trong gioi-han.ts (có test).
import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2';

import { INVITE_MESSAGES, inviteDecision, type InviteProblem } from './gioi-han.ts';

/** Trả null nếu được dùng; ngược lại trả phản hồi lỗi (403) cho người này. */
export async function inviteProblem(
  admin: SupabaseClient,
  user: User,
  browser: boolean,
): Promise<{ error: string; code: InviteProblem } | null> {
  const enforce = Deno.env.get('WEB_CHI_NGUOI_DUOC_MOI') === 'true';
  if (!enforce || !browser) return null;
  const email = user.email?.trim().toLowerCase();
  let invitedEmails: string[] = [];
  if (email && !user.is_anonymous) {
    const { data, error } = await admin.from('moi_dung_thu').select('email').eq('email', email).limit(1);
    if (error) {
      console.error('Lỗi đọc danh sách mời:', error);
      // Không đọc được danh sách thì từ chối cho an toàn.
      return { error: INVITE_MESSAGES['chua-duoc-moi'], code: 'chua-duoc-moi' };
    }
    invitedEmails = (data ?? []).map((row: { email: string }) => row.email);
  }
  const problem = inviteDecision({ enforce, browser, anonymous: !!user.is_anonymous, email, invitedEmails });
  return problem ? { error: INVITE_MESSAGES[problem], code: problem } : null;
}
