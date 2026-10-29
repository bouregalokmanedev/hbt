<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('assignment_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('content')
                ->nullable();

            $table->string('link_url', 2048)
                ->nullable();

            $table->string('status')
                ->default('submitted');

            $table->decimal('grade', 5, 2)
                ->nullable();

            $table->text('feedback')
                ->nullable();

            $table->timestamp('submitted_at');

            $table->timestamp('graded_at')
                ->nullable();

            $table->foreignId('graded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique([
                'assignment_id',
                'user_id',
            ]);

            $table->index([
                'user_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};
