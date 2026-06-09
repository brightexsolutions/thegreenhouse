import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-charcoal">New Event</h1>
        <p className="text-sm text-charcoal/40 mt-0.5">Create a new Green House session</p>
      </div>
      <EventForm />
    </div>
  );
}
