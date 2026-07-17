import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getDestinationForAdmin } from "@/actions/admin-destination";
import { DestinationEditClient } from "@/components/admin/destination-edit-client";

export const metadata = { title: "Редакция дестинация" };

type Props = { params: Promise<{ id: string }> };

export default async function DestinationEditPage({ params }: Props) {
  const { id } = await params;
  const destination = await getDestinationForAdmin(id);
  if (!destination) notFound();

  let published = true;
  const service = createServiceClient();
  if (service) {
    const { data } = await service
      .from("destinations")
      .select("published")
      .eq("id", id)
      .single();
    published = data?.published ?? true;
  }

  return <DestinationEditClient destination={destination} published={published} />;
}
