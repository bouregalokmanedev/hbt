import {
    useEffect,
    useState,
} from "react";

import {
    Check,
    X,
} from "lucide-react";

import {
    useAuth,
} from "@/features/auth/hooks/useAuth";

import {
    useAuthStore,
} from "@/features/auth";

import {
    ProfileHeader,
} from "../components/ProfileHeader";

import {
    ProfileInformation,
} from "../components/ProfileInformation";

import {
    LearningOverview,
} from "../components/LearningOverview";

import {
    MessagesCard,
} from "../components/MessagesCard";

import {
    FeedbackCard,
} from "../components/FeedbackCard";


export interface ProfileFormData {
    avatar: string | null;

    first_name: string;
    last_name: string;
    username: string;

    phone: string;
    phone_country_code: string;

    country: string;

    bio: string;

    language: string;
    timezone: string;
}


/*
|--------------------------------------------------------------------------
| Create profile form
|--------------------------------------------------------------------------
*/

function createFormData(
    user: NonNullable<
        ReturnType<typeof useAuth>["user"]
    >,
): ProfileFormData {

    const rawPhone =
        user.phone ?? "";

    let phoneCountryCode =
        "+213";

    let phoneNumber =
        "";

    const normalizedPhone =
        rawPhone
            .replace(/\s/g, "")
            .replace(/\+/g, "+");


    const countryCodes = [
        "+213",
        "+33",
        "+39",
        "+44",
        "+49",
        "+34",
        "+1",
        "+971",
        "+966",
        "+90",
        "+20",
        "+212",
        "+216",
        "+218",
        "+222",
        "+221",
        "+225",
        "+234",
        "+27",
        "+91",
        "+86",
        "+81",
        "+82",
        "+61",
        "+55",
        "+52",
        "+7",
    ];


    const matchedCode =
        countryCodes
            .sort(
                (a, b) =>
                    b.length - a.length,
            )
            .find(
                (code) =>
                    normalizedPhone.startsWith(
                        code,
                    ),
            );


    if (matchedCode) {

        phoneCountryCode =
            matchedCode;

        phoneNumber =
            normalizedPhone
                .slice(
                    matchedCode.length,
                )
                .replace(
                    /^\+/,
                    "",
                );

    } else {

        phoneNumber =
            normalizedPhone.replace(
                /\D/g,
                "",
            );
    }


    return {

        avatar:
            user.avatar ?? null,

        first_name:
            user.first_name ?? "",

        last_name:
            user.last_name ?? "",

        username:
            user.username ?? "",

        phone:
            phoneNumber,

        phone_country_code:
            phoneCountryCode,

        country:
            user.country ?? "",

        bio:
            user.bio ?? "",

        language:
            user.language ?? "en",

        timezone:
            user.timezone ?? "UTC",
    };
}


/*
|--------------------------------------------------------------------------
| Profile Page
|--------------------------------------------------------------------------
*/

export function ProfilePage() {

    const {
        user,
    } = useAuth();


    const updateProfile =
        useAuthStore(
            (state) =>
                state.updateProfile,
        );


    const [
        isEditing,
        setIsEditing,
    ] = useState(false);


    const [
        isSaving,
        setIsSaving,
    ] = useState(false);


    const [
        saveError,
        setSaveError,
    ] = useState<string | null>(
        null,
    );


    const [
        saveSuccess,
        setSaveSuccess,
    ] = useState(false);


    const [
        form,
        setForm,
    ] = useState<
        ProfileFormData | null
    >(null);


    /*
    |--------------------------------------------------------------------------
    | Initialize form
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (user) {

            setForm(
                createFormData(
                    user,
                ),
            );

        }

    }, [user]);


    /*
    |--------------------------------------------------------------------------
    | No user
    |--------------------------------------------------------------------------
    */

    if (!user || !form) {

        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

    const handleEdit = () => {

        setForm(
            createFormData(
                user,
            ),
        );

        setSaveError(null);

        setSaveSuccess(false);

        setIsEditing(true);
    };


    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {

        setForm(
            createFormData(
                user,
            ),
        );

        setSaveError(null);

        setSaveSuccess(false);

        setIsEditing(false);
    };


    /*
    |--------------------------------------------------------------------------
    | Update field
    |--------------------------------------------------------------------------
    */

    const updateField = <
        K extends keyof ProfileFormData
    >(
        field: K,
        value: ProfileFormData[K],
    ) => {

        setForm(
            (current) => {

                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    [field]: value,
                };

            },
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const handleSave =
        async () => {

        if (isSaving) {
            return;
        }


        setIsSaving(true);

        setSaveError(null);

        setSaveSuccess(false);


        try {

            const cleanPhone =
                form.phone.replace(
                    /\D/g,
                    "",
                );


            const fullPhone =
                cleanPhone
                    ? `${form.phone_country_code}${cleanPhone}`
                    : null;


            console.log(
                "Saving profile...",
            );


            await updateProfile({

                first_name:
                    form.first_name.trim(),

                last_name:
                    form.last_name.trim(),

                username:
                    form.username.trim(),

                phone:
                    fullPhone,

                country:
                    form.country || null,

                bio:
                    form.bio.trim() || null,

                avatar:
                    form.avatar || null,

                language:
                    form.language,

                timezone:
                    form.timezone,
            });


            console.log(
                "Profile update API succeeded",
            );


            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            | Show toast BEFORE closing edit mode.
            */

            setSaveSuccess(true);

            setSaveError(null);

            setIsEditing(false);


            /*
            |--------------------------------------------------------------------------
            | Refresh form from the latest user
            |--------------------------------------------------------------------------
            */

            /*
             * We intentionally do not manually
             * rebuild the form here.
             *
             * Zustand updates `user`, and the
             * useEffect above will synchronize
             * the form with the new user.
             */


            window.setTimeout(
                () => {

                    setSaveSuccess(false);

                },
                3000,
            );


        } catch (error) {

            console.error(
                "Profile update failed:",
                error,
            );


            setSaveError(
                error instanceof Error
                    ? error.message
                    : "Unable to save your profile.",
            );


        } finally {

            setIsSaving(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (

        <main
            className="
                relative
                min-h-full
                bg-[#F3F3F3]
            "
        >

            {/* ------------------------------------------------------------
                SUCCESS TOAST
            ------------------------------------------------------------ */}

            {saveSuccess && (

                <div
                    className="
                        fixed
                        right-5
                        top-5
                        z-[99999]
                        w-[calc(100%-40px)]
                        max-w-[400px]
                        animate-[profileToastIn_0.3s_ease-out]
                    "
                >

                    <div
                        className="
                            overflow-hidden
                            rounded-2xl
                            border
                            border-emerald-500/20
                            bg-white
                            shadow-[0_20px_60px_rgba(0,0,0,0.16)]
                        "
                    >

                        <div
                            className="
                                flex
                                items-start
                                gap-3
                                px-5
                                py-4
                            "
                        >

                            <div
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-emerald-500/10
                                    text-emerald-600
                                "
                            >

                                <Check
                                    className="
                                        h-5
                                        w-5
                                    "
                                />

                            </div>


                            <div
                                className="
                                    min-w-0
                                    flex-1
                                "
                            >

                                <p
                                    className="
                                        text-sm
                                        font-semibold
                                        text-[#3A3A3A]
                                    "
                                >
                                    Profile updated
                                </p>


                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        leading-5
                                        text-[#3A3A3A]/55
                                    "
                                >
                                    Your profile changes
                                    have been saved
                                    successfully.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setSaveSuccess(
                                        false,
                                    )
                                }
                                className="
                                    flex
                                    h-7
                                    w-7
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-[#3A3A3A]/30
                                    transition
                                    hover:bg-[#3A3A3A]/5
                                    hover:text-[#3A3A3A]
                                "
                                aria-label="Close notification"
                            >

                                <X
                                    className="
                                        h-4
                                        w-4
                                    "
                                />

                            </button>

                        </div>


                        {/* Progress bar */}

                        <div
                            className="
                                h-1
                                w-full
                                bg-emerald-500/10
                            "
                        >

                            <div
                                className="
                                    h-full
                                    w-full
                                    origin-left
                                    bg-emerald-500
                                    animate-[profileToastProgress_3s_linear_forwards]
                                "
                            />

                        </div>

                    </div>

                </div>

            )}


            {/* ------------------------------------------------------------
                ERROR TOAST
            ------------------------------------------------------------ */}

            {saveError && (

                <div
                    className="
                        fixed
                        right-5
                        top-5
                        z-[99999]
                        w-[calc(100%-40px)]
                        max-w-[400px]
                        animate-[profileToastIn_0.3s_ease-out]
                    "
                >

                    <div
                        className="
                            overflow-hidden
                            rounded-2xl
                            border
                            border-red-500/20
                            bg-white
                            shadow-[0_20px_60px_rgba(0,0,0,0.16)]
                        "
                    >

                        <div
                            className="
                                flex
                                items-start
                                gap-3
                                px-5
                                py-4
                            "
                        >

                            <div
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-red-500/10
                                    text-red-500
                                "
                            >

                                <X
                                    className="
                                        h-5
                                        w-5
                                    "
                                />

                            </div>


                            <div
                                className="
                                    min-w-0
                                    flex-1
                                "
                            >

                                <p
                                    className="
                                        text-sm
                                        font-semibold
                                        text-[#3A3A3A]
                                    "
                                >
                                    Unable to save
                                </p>


                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        leading-5
                                        text-[#3A3A3A]/55
                                    "
                                >
                                    {saveError}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setSaveError(
                                        null,
                                    )
                                }
                                className="
                                    flex
                                    h-7
                                    w-7
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-[#3A3A3A]/30
                                    transition
                                    hover:bg-[#3A3A3A]/5
                                    hover:text-[#3A3A3A]
                                "
                                aria-label="Close notification"
                            >

                                <X
                                    className="
                                        h-4
                                        w-4
                                    "
                                />

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ------------------------------------------------------------
                PAGE CONTENT
            ------------------------------------------------------------ */}

            <div
                className="
                    mx-auto
                    w-full
                    max-w-[1280px]
                    px-4
                    py-5
                    sm:px-6
                    lg:px-8
                    lg:py-7
                "
            >

                <div
                    className="
                        space-y-5
                    "
                >

                    <ProfileHeader
                        user={user}
                        isEditing={isEditing}
                        onEdit={handleEdit}
                    />


                    <div
                        className="
                            grid
                            gap-5
                            lg:grid-cols-[1fr_360px]
                        "
                    >

                        <div
                            className="
                                space-y-5
                            "
                        >

                            <ProfileInformation
                                user={user}
                                form={form}
                                isEditing={isEditing}
                                isSaving={isSaving}
                                onEdit={handleEdit}
                                onCancel={handleCancel}
                                onSave={handleSave}
                                onFieldChange={updateField}
                            />


                            <MessagesCard
                                unreadCount={0}
                            />

                        </div>


                        <div
                            className="
                                space-y-5
                            "
                        >

                            <LearningOverview />

                            <FeedbackCard />

                        </div>

                    </div>

                </div>

            </div>


            {/* ------------------------------------------------------------
                Animations
            ------------------------------------------------------------ */}

            <style>
                {`
                    @keyframes profileToastIn {
                        from {
                            opacity: 0;
                            transform: translateX(30px);
                        }

                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    @keyframes profileToastProgress {
                        from {
                            transform: scaleX(1);
                        }

                        to {
                            transform: scaleX(0);
                        }
                    }
                `}
            </style>

        </main>
    );
}