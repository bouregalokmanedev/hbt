# AI Mentor

The AI Mentor is course-aware by design: a conversation can be attached to an enrolled course and, optionally, to a lesson in that course. The service builds the learner, progress, assessment, conversation-history, and retrieved lesson-content context before asking the configured provider for an answer.

## Local configuration

Add these values to `backend/.env` to enable live OpenAI responses:

```dotenv
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
AI_MENTOR_DAILY_REQUEST_LIMIT=100
AI_MENTOR_MONTHLY_REQUEST_LIMIT=2000
AI_MENTOR_DAILY_TOKEN_LIMIT=100000
AI_MENTOR_MONTHLY_TOKEN_LIMIT=1000000
```

Then run the migrations and start the API:

```bash
php artisan migrate
php artisan serve
```

Use the **AI Mentor** dashboard page or the lesson-player mentor button. The lesson-player button creates a conversation bound to the open course and lesson. Without `OPENAI_API_KEY`, requests fail safely with the provider's configuration error; diagnostic utilities still work locally.

## Current architecture

- `MentorAIProvider` keeps provider integration replaceable. OpenAI is the active adapter.
- `MentorContextService` supplies student, course, lesson, quiz, progress, history, and keyword-retrieved published lesson content.
- `MentorContentRetriever` is the stable RAG boundary. It currently uses the database fallback; vector retrieval/embeddings can be added behind the same contract when pgvector or an external vector store is introduced.
- Input and non-streaming output guardrails run before content is shown. Streaming also applies the input guardrail and usage limits before a provider call.
- Usage, response time, feedback, and per-conversation analytics are persisted for later student, instructor, and admin reporting.

## Provider extension point

Add another implementation of `App\Domains\AI\Contracts\MentorAIProvider` (for example Anthropic or Gemini), then change the container binding in `AppServiceProvider`. The rest of the mentor pipeline does not need to change.
