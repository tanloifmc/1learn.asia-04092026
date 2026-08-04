import { InquiryForm } from "@/components/inquiries/inquiry-form";

export default async function NewInquiryPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  return <main className="stack"><p className="eyebrow">Yeu cau lien he</p><h1>Gui yeu cau den nha cung cap</h1><InquiryForm organizationId={organizationId} /></main>;
}
