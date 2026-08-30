import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

export interface Assessment {
    id: string; title: string; description: string | null; course_title: string | null;
    minimum_score: number; max_attempts: number | null; questions_count: number;
    eligibility: { eligible: boolean; lessons: { required: number; completed: number }; quizzes: { required: number; completed: number; required_score: number }; scenarios: { required: number; completed: number } };
}

export async function getAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${env.apiUrl}/v1/assessments`, { headers: { Accept: "application/json", Authorization: `Bearer ${authStorage.getToken() ?? ""}` } });
    if (!response.ok) throw new Error("Unable to load assessments.");
    return (await response.json() as { data: Assessment[] }).data;
}
