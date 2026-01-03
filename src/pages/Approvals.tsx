import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentApprovals from '@/components/payments/PaymentApprovals';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function Approvals() {
  usePageMeta({
    title: 'Approvals | Soaring Glory',
    description: 'Review and approve payment transactions.',
    canonicalPath: '/approvals',
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Payment Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, or reject payment transactions submitted by staff
          </p>
        </div>

        <PaymentApprovals />
      </div>
    </DashboardLayout>
  );
}