export interface User {
    id: string;
    first_name: string;
    last_name: string;
    username: string | null;
    email: string;
    email_verified_at: string | null;
    phone: string | null;
    avatar: string | null;
    bio: string | null;
    country: string | null;
    language: string | null;
    timezone: string | null;
    status: string;
    roles: string[];
    created_at: string;
    updated_at: string;
}

export interface AuthData {
    user: User;
    token: string;
    token_type: string;
    expires_at: string | null;
}
