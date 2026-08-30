import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useForm,
} from "react-hook-form";

import {
    AuthShell,
} from "../components/AuthShell";

import {
    AuthHeader,
} from "../components/AuthHeader";

import {
    AuthInput,
} from "../components/AuthInput";

import {
    PasswordField,
} from "../components/PasswordField";
import { isStrongPassword, PasswordRequirements } from "../components/PasswordRequirements";

import {
    GoogleIcon,
} from "../components/GoogleIcon";

import {
    useAuthLanguage,
} from "../i18n/auth-language";

import {
    useAuth,
} from "../hooks/useAuth";
import {
    dashboardRouteFor,
} from "../utils/dashboard-route";
import {
    useAuthStore,
} from "../store/auth.store";


interface RegisterForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}


export function RegisterPage() {
    const navigate = useNavigate();

    const {
        t,
    } = useAuthLanguage();

    const {
        register: registerField,
        handleSubmit,
        watch,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<RegisterForm>({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            passwordConfirmation: "",
        },
    });

    const {
        register: registerUser,
        error,
    } = useAuth();

    const password = watch("password");


    const onSubmit = async (
        values: RegisterForm,
    ) => {
        try {
            await registerUser({
                first_name: values.firstName,
                last_name: values.lastName,
                email: values.email,
                password: values.password,
                password_confirmation:
                    values.passwordConfirmation,
            });

            sessionStorage.removeItem("hbt:auth-return-to");
            navigate(dashboardRouteFor(useAuthStore.getState().user), { replace: true });
        } catch {
            // The authentication store handles
            // and exposes the error.
        }
    };


    const handleGoogleAuth = () => {
        const apiUrl =
            import.meta.env.VITE_API_URL;

        if (!apiUrl) {
            return;
        }

        window.location.href =
            `${apiUrl}/v1/auth/google/redirect`;
    };


    return (
        <AuthShell>
            <div className="flex w-full flex-col">
                <AuthHeader
                    eyebrow={
                        t.register.eyebrow
                    }
                    title={
                        t.register.title
                    }
                    description={
                        t.register.description
                    }
                />

                <form
                    onSubmit={handleSubmit(
                        onSubmit,
                    )}
                    className="space-y-4"
                    noValidate
                >
                    {/* First name + Last name */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AuthInput
                            id="register-first-name"
                            label={
                                t.common.firstName
                            }
                            type="text"
                            autoComplete="given-name"
                            placeholder={
                                t.common
                                    .firstNamePlaceholder
                            }
                            {...registerField(
                                "firstName",
                                {
                                    required:
                                        t.common
                                            .required,
                                },
                            )}
                            error={
                                errors.firstName
                                    ?.message
                            }
                        />

                        <AuthInput
                            id="register-last-name"
                            label={
                                t.common.lastName
                            }
                            type="text"
                            autoComplete="family-name"
                            placeholder={
                                t.common
                                    .lastNamePlaceholder
                            }
                            {...registerField(
                                "lastName",
                                {
                                    required:
                                        t.common
                                            .required,
                                },
                            )}
                            error={
                                errors.lastName
                                    ?.message
                            }
                        />
                    </div>


                    {/* Email */}
                    <AuthInput
                        id="register-email"
                        label={
                            t.common.email
                        }
                        type="email"
                        autoComplete="email"
                        placeholder={
                            t.common
                                .emailPlaceholder
                        }
                        {...registerField(
                            "email",
                            {
                                required:
                                    t.common
                                        .required,
                            },
                        )}
                        error={
                            errors.email
                                ?.message
                        }
                    />


                    {/* Password */}
                    <PasswordField
                        id="register-password"
                        label={
                            t.common.password
                        }
                        autoComplete="new-password"
                        placeholder={
                            t.common
                                .passwordPlaceholder
                        }
                        showLabel={
                            t.common.showPassword
                        }
                        hideLabel={
                            t.common.hidePassword
                        }
                        {...registerField(
                            "password",
                            {
                                required:
                                    t.common
                                        .required,
                                minLength: {
                                    value: 8,
                                    message:
                                        t.common
                                            .passwordMinLength,
                                },
                                validate: (value) =>
                                    isStrongPassword(value) ||
                                    "Use 8+ characters with an uppercase letter, number, and symbol.",
                            },
                        )}
                        error={
                            errors.password
                                ?.message
                        }
                    />
                    <PasswordRequirements password={password} />


                    {/* Password confirmation */}
                    <PasswordField
                        id="register-password-confirmation"
                        label={
                            t.common
                                .confirmPassword
                        }
                        autoComplete="new-password"
                        placeholder={
                            t.common
                                .confirmPasswordPlaceholder
                        }
                        showLabel={
                            t.common.showPassword
                        }
                        hideLabel={
                            t.common.hidePassword
                        }
                        {...registerField(
                            "passwordConfirmation",
                            {
                                required:
                                    t.common
                                        .required,

                                validate: (
                                    value,
                                ) =>
                                    value ===
                                        password ||
                                    t.common
                                        .passwordsDoNotMatch,
                            },
                        )}
                        error={
                            errors
                                .passwordConfirmation
                                ?.message
                        }
                    />


                    {/* Backend error */}
                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                        >
                            {error}
                        </div>
                    )}


                    {/* Terms */}
                    <p className="pt-1 text-center text-[11px] leading-5 text-[#3A3A3A]/50">
                        {t.register.terms}
                    </p>


                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="
                            flex
                            h-12
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            bg-[#F47822]
                            px-5
                            text-sm
                            font-semibold
                            text-white
                            shadow-[0_8px_20px_rgba(244,120,34,0.22)]
                            transition-all
                            hover:bg-[#e96d18]
                            hover:shadow-[0_10px_25px_rgba(244,120,34,0.28)]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {isSubmitting
                            ? t.common.loading
                            : t.register.submit}
                    </button>
                </form>


                {/* Secure authentication */}
                <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#3A3A3A]/50">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 3L19 6V11C19 15.5 16.1 19.3 12 21C7.9 19.3 5 15.5 5 11V6L12 3Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        <path
                            d="M9.5 12L11.2 13.7L14.8 10.1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <span>
                        {
                            t.register
                                .secureAuthentication
                        }
                    </span>
                </div>


                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#3A3A3A]/10" />

                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#3A3A3A]/35">
                        {t.common.or}
                    </span>

                    <div className="h-px flex-1 bg-[#3A3A3A]/10" />
                </div>


                {/* Google */}
                <button
                    type="button"
                    onClick={
                        handleGoogleAuth
                    }
                    className="
                        flex
                        h-11
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-xl
                        border
                        border-[#3A3A3A]/10
                        bg-white
                        text-sm
                        font-medium
                        text-[#3A3A3A]
                        transition
                        hover:bg-[#F3F3F3]
                        focus:outline-none
                        focus:ring-4
                        focus:ring-[#F47822]/10
                    "
                >
                    <GoogleIcon />

                    <span>
                        {
                            t.common
                                .continueWithGoogle
                        }
                    </span>
                </button>


                {/* Login */}
                <div className="mt-5 pb-2 text-center text-sm text-[#3A3A3A]/60">
                    {
                        t.common
                            .alreadyAccount
                    }{" "}

                    <Link
                        to="/login"
                        className="font-semibold text-[#F47822] hover:underline"
                    >
                        {
                            t.common
                                .signIn
                        }
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
