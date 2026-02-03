import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be 3 characters"),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.coerce
    .number()
    .int()
    .min(1000000000, { message: "Number must be at least 10 digits" })
    .max(9999999999, { message: "Number cannot exceed 10 digits" }),
  role: z.enum(["jobseeker", "recruiter"], {
    message: "Role must be either jobseeker or recruiter",
  }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
