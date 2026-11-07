import { termsIntro, termsSections } from '@/web/legal-content';
import { LegalPage } from '@/web/screens/phap-ly';

export default function TermsWeb() {
  return <LegalPage title="Điều khoản sử dụng" intro={termsIntro} sections={termsSections} />;
}
