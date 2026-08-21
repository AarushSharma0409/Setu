import { InsuranceProductsPage } from "../../../../components/insurance-products-page";

export const dynamic = "force-dynamic";

export default async function InsuranceProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <InsuranceProductsPage productId={productId} />;
}
