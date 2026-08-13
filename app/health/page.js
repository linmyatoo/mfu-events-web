import ComingSoon from '../../components/common/ComingSoon';

export default function HealthPage() {
  return (
    <ComingSoon
      title="Account Health"
      icon="heart"
      message="Health score, booking restriction and transaction history — GET /api/user/me/health."
    />
  );
}
