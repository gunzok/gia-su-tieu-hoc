// Hỏi RevenueCat xem tài khoản có gói Plus không (app đã gắn RevenueCat với id Supabase).
// Chưa đặt REVENUECAT_SECRET_KEY hoặc RevenueCat lỗi thì tính là gói Miễn phí.

// Entitlement gói Plus; phải trùng PRO_ENTITLEMENT trong src/lib/payments.tsx.
const proEntitlement = 'gia_sư_tiểu_học_pro';

export async function hasPlus(userId: string) {
  const secretKey = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!secretKey) return false;
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      console.error('RevenueCat trả lỗi', response.status, await response.text());
      return false;
    }
    const data = await response.json();
    const entitlement = data?.subscriber?.entitlements?.[proEntitlement];
    if (!entitlement) return false;
    // Gói trọn đời không có ngày hết hạn.
    return entitlement.expires_date == null || new Date(entitlement.expires_date).getTime() > Date.now();
  } catch (error) {
    console.error('Lỗi gọi RevenueCat:', error);
    return false;
  }
}
