import { privacyIntro, privacySections } from '@/web/legal-content';
import { LegalPage } from '@/web/screens/phap-ly';

export default function PrivacyPolicyWeb() {
  return <LegalPage title="Chính sách quyền riêng tư" intro={privacyIntro} sections={privacySections} />;
}
