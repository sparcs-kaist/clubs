import { redirect } from "next/navigation";

const ManageRentalDetail = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  redirect(`/my/rental-business/${encodeURIComponent(id)}`);
};

export default ManageRentalDetail;
