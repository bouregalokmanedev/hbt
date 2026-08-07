export const ROUTES = {
    home: "/",
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",

    courses: "/courses",
    course: (slug: string) => `/courses/${slug}`,

    dashboard: "/dashboard",
    myCourses: "/dashboard/courses",
    profile: "/dashboard/profile",
    certificates: "/dashboard/certificates",
    settings: "/dashboard/settings",

    admin: "/admin",
    adminUsers: "/admin/users",
    adminCourses: "/admin/courses",
} as const;