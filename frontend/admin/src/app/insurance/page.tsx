import { InsurancePage } from "../../components/insurance-page";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function InsuranceDashboardPage() {
  return <InsurancePage view="dashboard" />;
}
