import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .regex(/^$|^[0-9+()\-\s]+$/, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
});

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string().min(8, "Please confirm your password").max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .regex(/^$|^[0-9+()\-\s]+$/, "Enter a valid phone number"),
  address: z.string().trim().max(250, "Address is too long"),
  panNumber: z
    .string()
    .trim()
    .max(20, "PAN is too long")
    .regex(/^$|^[A-Z0-9]+$/, "Use only uppercase letters and numbers for PAN"),
});
