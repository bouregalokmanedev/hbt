import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Enter a valid email address"),

    password: z
        .string()
        .min(1, "Password is required"),

    remember: z.boolean().default(false),
});

export type LoginFormValues = {
  email: string;
  password: string;
  remember?: boolean;
};


export const registerSchema = z
    .object({
        first_name: z
            .string()
            .min(2, "First name is required"),

        last_name: z
            .string()
            .min(2, "Last name is required"),

        username: z
            .string()
            .min(3, "Username must be at least 3 characters"),

        email: z
            .string()
            .email("Enter a valid email address"),

        password: z
            .string()
            .min(
                8,
                "Password must be at least 8 characters",
            ),

        password_confirmation: z
            .string()
            .min(
                8,
                "Please confirm your password",
            ),

        phone: z
            .string()
            .optional(),

        country: z
            .string()
            .optional(),

        language: z
            .string()
            .optional(),

        timezone: z
            .string()
            .optional(),
    })
    .refine(
        (data) =>
            data.password ===
            data.password_confirmation,
        {
            message:
                "Passwords do not match",
            path: [
                "password_confirmation",
            ],
        },
    );

export type RegisterFormValues =
    z.infer<typeof registerSchema>;


export const forgotPasswordSchema =
    z.object({
        email: z
            .string()
            .email("Enter a valid email address"),
    });

export type ForgotPasswordFormValues =
    z.infer<
        typeof forgotPasswordSchema
    >;


export const resetPasswordSchema =
    z.object({
        email: z
            .string()
            .email("Enter a valid email address"),

        token: z
            .string()
            .min(1, "Reset token is required"),

        password: z
            .string()
            .min(
                8,
                "Password must be at least 8 characters",
            ),

        password_confirmation: z
            .string()
            .min(
                8,
                "Please confirm your password",
            ),
    })
    .refine(
        (data) =>
            data.password ===
            data.password_confirmation,
        {
            message:
                "Passwords do not match",
            path: [
                "password_confirmation",
            ],
        },
    );

export type ResetPasswordFormValues =
    z.infer<
        typeof resetPasswordSchema
    >;

    