import {
    Badge,
    Button,
    Card,
    Container,
    Input,
    Separator,
    Skeleton,
    Spinner,
} from "@/components/ui";

import {
    ArrowRight,
    Check,
    Mail,
} from "lucide-react";

export function UiShowcasePage() {
    return (
        <main className="min-h-screen bg-[var(--background)] py-12">
            <Container className="space-y-12">
                <header className="space-y-2">
                    <p className="text-sm font-medium text-[var(--primary)]">
                        HBTronics Design System
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                        UI Component Showcase
                    </h1>

                    <p className="max-w-2xl text-[var(--muted)]">
                        Internal development page for validating reusable
                        components before they are used throughout the
                        platform.
                    </p>
                </header>

                <Separator />

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Buttons
                    </h2>

                    <div className="flex flex-wrap gap-3">
                        <Button>
                            Primary
                        </Button>

                        <Button variant="secondary">
                            Secondary
                        </Button>

                        <Button variant="outline">
                            Outline
                        </Button>

                        <Button variant="ghost">
                            Ghost
                        </Button>

                        <Button variant="danger">
                            Danger
                        </Button>

                        <Button
                            leftIcon={<Check className="size-4" />}
                        >
                            Completed
                        </Button>

                        <Button
                            rightIcon={
                                <ArrowRight className="size-4" />
                            }
                        >
                            Continue
                        </Button>

                        <Button loading>
                            Saving
                        </Button>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Inputs
                    </h2>

                    <div className="grid max-w-2xl gap-5 md:grid-cols-2">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={
                                <Mail className="size-4" />
                            }
                        />

                        <Input
                            label="Username"
                            placeholder="Enter username"
                            helperText="This will be visible on your profile."
                        />

                        <Input
                            label="Invalid field"
                            defaultValue="incorrect"
                            error="Please enter a valid value."
                        />

                        <Input
                            label="Disabled"
                            placeholder="Unavailable"
                            disabled
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Badges
                    </h2>

                    <div className="flex flex-wrap gap-3">
                        <Badge>Default</Badge>

                        <Badge variant="success">
                            Published
                        </Badge>

                        <Badge variant="warning">
                            Pending
                        </Badge>

                        <Badge variant="danger">
                            Failed
                        </Badge>

                        <Badge variant="info">
                            In Progress
                        </Badge>

                        <Badge variant="outline">
                            Draft
                        </Badge>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Cards
                    </h2>

                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="p-6">
                            <h3 className="font-semibold">
                                Standard Card
                            </h3>

                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Used for general platform content.
                            </p>
                        </Card>

                        <Card
                            interactive
                            className="p-6"
                        >
                            <h3 className="font-semibold">
                                Interactive Card
                            </h3>

                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Useful for courses and clickable
                                dashboard items.
                            </p>
                        </Card>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Loading
                    </h2>

                    <div className="flex items-center gap-6">
                        <Spinner size="sm" />
                        <Spinner size="md" />
                        <Spinner size="lg" />
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full max-w-xl" />
                        <Skeleton className="h-32 w-full max-w-xl" />
                    </div>
                </section>
            </Container>
        </main>
    );
}