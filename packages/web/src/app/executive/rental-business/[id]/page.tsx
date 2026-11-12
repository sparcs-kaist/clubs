import { ExecutiveRentalOrderFrame } from "@sparcs-clubs/web/features/rental-business/frames/ExecutiveRentalFrame";

const ExecutiveRentalOrderPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) => {
  const [{ id }, { action }] = await Promise.all([params, searchParams]);
  return (
    <ExecutiveRentalOrderFrame
      id={Number(id)}
      openExtension={action === "extend"}
    />
  );
};

export default ExecutiveRentalOrderPage;
