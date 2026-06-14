import { createAdminClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";
import { EnquiriesTable } from "@/components/admin/enquiries-table";

export const dynamic = "force-dynamic";

async function getEnquiries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Array<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    interest: string;
    partner_type: string | null;
    message: string | null;
    created_at: string;
  }>;
}

export default async function EnquiriesPage() {
  const enquiries = await getEnquiries();
  const partnerCount = enquiries.filter(e => e.interest === "partner").length;

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-charcoal">Get Involved Enquiries</h1>
          <p className="text-sm text-charcoal/45 mt-0.5">
            {enquiries.length} total
            {partnerCount > 0 && (
              <> · <span className="text-[#8a6a1a] font-medium">{partnerCount} partnership</span></>
            )}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-mist overflow-hidden flex flex-col">
        {enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16">
            <MessageSquare size={28} className="text-charcoal/15 mb-3" />
            <p className="text-sm text-charcoal/35">No enquiries yet</p>
            <p className="text-xs text-charcoal/25 mt-1">Submissions from the Get Involved form appear here</p>
          </div>
        ) : (
          <EnquiriesTable enquiries={enquiries} />
        )}
      </div>
    </div>
  );
}
