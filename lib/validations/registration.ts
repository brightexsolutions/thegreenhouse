import { z } from "zod";
import { normalisePhone } from "@/lib/phone";

export const registrationSchema = z
  .object({
    event_id:        z.string().uuid(),
    first_name:      z.string().min(1, "First name is required").max(60),
    last_name:       z.string().min(1, "Last name is required").max(60),
    email:           z.string().email("Invalid email").optional().or(z.literal("")),
    phone:           z.string().optional().or(z.literal("")),
    role:            z.enum(["guest", "vocalist", "instrumentalist", "vision_carrier", "curious"]),
    source:          z.enum(["friend", "whatsapp", "instagram", "church", "website", "other"]).optional(),
    notes:           z.string().max(500).optional(),
    whatsapp_opt_in: z.boolean().default(false),
    photo_consent:   z.boolean().default(false),
  })
  .transform((data) => ({
    ...data,
    email: data.email || undefined,
    phone: data.phone ? normalisePhone(data.phone) : undefined,
  }))
  .refine(
    (data) => !!data.email || !!data.phone,
    { message: "Please provide either an email address or phone number", path: ["email"] }
  );

export type RegistrationInput = z.infer<typeof registrationSchema>;
