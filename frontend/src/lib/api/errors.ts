export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly errors?: Record<
            string,
            string[]
        >,
        public readonly data?: unknown,
    ) {
        super(message);

        this.name = "ApiError";
    }

    get isUnauthorized() {
        return this.status === 401;
    }

    get isForbidden() {
        return this.status === 403;
    }

    get isValidationError() {
        return this.status === 422;
    }

    get code(): string | undefined {
        if (this.data && typeof this.data === "object" && "code" in this.data) {
            const value = (this.data as { code?: unknown }).code;
            if (typeof value === "string" && value.length > 0) {
                return value;
            }
        }
        return undefined;
    }
}