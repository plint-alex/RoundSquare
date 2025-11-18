-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SURVIVOR', 'NIKITA', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('COOLDOWN', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" UUID NOT NULL,
    "status" "RoundStatus" NOT NULL,
    "cooldown_start_at" TIMESTAMPTZ(6) NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_participants" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tap_count" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "last_tapped_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "round_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "rounds_status_idx" ON "rounds"("status");

-- CreateIndex
CREATE INDEX "rounds_start_at_idx" ON "rounds"("start_at");

-- CreateIndex
CREATE INDEX "rounds_end_at_idx" ON "rounds"("end_at");

-- CreateIndex
CREATE INDEX "round_participants_round_id_idx" ON "round_participants"("round_id");

-- CreateIndex
CREATE INDEX "round_participants_user_id_idx" ON "round_participants"("user_id");

-- CreateIndex
CREATE INDEX "round_participants_score_idx" ON "round_participants"("score");

-- CreateIndex
CREATE UNIQUE INDEX "round_participants_round_id_user_id_key" ON "round_participants"("round_id", "user_id");

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
