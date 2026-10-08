import PermissionNotice from '../../../components/admin/PermissionNotice';
import SettingsForm from '../../../components/admin/SettingsForm';
import PageContainer from '../../../components/layout/PageContainer';
import { apiGetAllowed } from '../../../lib/api';

export const metadata = { title: 'Settings · Admin · MFU-Events' };

/**
 * GET /api/admin/settings — platform-wide thresholds (health flags, review
 * edit window, check-in grace period, recognition tiers). Seeded once from
 * `DEFAULT_SETTINGS` in MFU-Events/backend/lib/constants.js and edited here
 * from then on — there is no create/delete, only PATCH.
 */
export default async function AdminSettingsPage() {
  const settings = await apiGetAllowed('/api/admin/settings');
  if (settings === null) return <PermissionNotice area="settings" />;

  return (
    <PageContainer
      title="Settings"
      subtitle="Platform-wide thresholds for health flags, reviews, check-in, and recognition tiers."
    >
      <SettingsForm settings={settings} />
    </PageContainer>
  );
}
