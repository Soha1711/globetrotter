-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('SIGHTSEEING', 'FOOD', 'ADVENTURE', 'CULTURE', 'RELAXATION', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "city" TEXT,
    "country" TEXT,
    "additionalInfo" TEXT,
    "profilePhotoUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverPhotoUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "costIndex" INTEGER NOT NULL DEFAULT 3,
    "popularity" INTEGER NOT NULL DEFAULT 50,
    "imageUrl" TEXT,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ActivityCategory" NOT NULL DEFAULT 'OTHER',
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "durationHours" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "imageUrl" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_activities" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,

    CONSTRAINT "stop_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "transportCost" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "stayCost" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "activitiesCost" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "mealsCost" DECIMAL(10,2) NOT NULL DEFAULT 0.0,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trips_userId_idx" ON "trips"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_country_key" ON "cities"("name", "country");

-- CreateIndex
CREATE INDEX "stops_tripId_idx" ON "stops"("tripId");

-- CreateIndex
CREATE INDEX "stops_cityId_idx" ON "stops"("cityId");

-- CreateIndex
CREATE INDEX "activities_cityId_idx" ON "activities"("cityId");

-- CreateIndex
CREATE INDEX "stop_activities_stopId_idx" ON "stop_activities"("stopId");

-- CreateIndex
CREATE INDEX "stop_activities_activityId_idx" ON "stop_activities"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_tripId_key" ON "budgets"("tripId");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_activities" ADD CONSTRAINT "stop_activities_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_activities" ADD CONSTRAINT "stop_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
