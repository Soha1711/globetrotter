const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @route   POST /api/trips
 * @desc    Create a new trip for authenticated user
 * @access  Private
 */
const createTrip = async (req, res, next) => {
  try {
    const {
      name,
      description,
      coverPhotoUrl,
      startDate,
      endDate,
      isPublic,
      initialCityId
    } = req.body;

    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Trip name is required.' });
    }

    // Default cover photo if none provided
    const defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828';

    // Build creation payload
    const tripData = {
      userId,
      name: name.trim(),
      description: description ? description.trim() : null,
      coverPhotoUrl: coverPhotoUrl && coverPhotoUrl.trim() ? coverPhotoUrl.trim() : defaultCover,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isPublic: isPublic || false,
      budget: {
        create: {
          transportCost: 0.0,
          stayCost: 0.0,
          activitiesCost: 0.0,
          mealsCost: 0.0
        }
      }
    };

    // If an initial city was selected, attach as first Stop
    if (initialCityId) {
      const city = await prisma.city.findUnique({ where: { id: initialCityId } });
      if (city) {
        tripData.stops = {
          create: [
            {
              cityId: initialCityId,
              orderIndex: 0,
              startDate: startDate ? new Date(startDate) : null,
              endDate: endDate ? new Date(endDate) : null
            }
          ]
        };
      }
    }

    const newTrip = await prisma.trip.create({
      data: tripData,
      include: {
        stops: {
          include: {
            city: true,
            stopActivities: {
              include: { activity: true }
            }
          }
        },
        budget: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Trip created successfully!',
      trip: newTrip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/trips
 * @desc    Get all trips belonging to current authenticated user
 * @access  Private
 */
const getUserTrips = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        stops: {
          orderBy: { orderIndex: 'asc' },
          include: {
            city: true,
            stopActivities: {
              include: { activity: true }
            }
          }
        },
        budget: true
      }
    });

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/trips/:id
 * @desc    Get detailed trip information by ID
 * @access  Private
 */
const getTripById = async (req, res, next) => {
  try {
    const id = req.params.tripId || req.params.id;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true }
        },
        stops: {
          orderBy: { orderIndex: 'asc' },
          include: {
            city: {
              include: { activities: true }
            },
            stopActivities: {
              include: { activity: true }
            }
          }
        },
        budget: true
      }
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/trips/:id/budget
 * @desc    Get computed budget breakdown for a trip
 * @access  Private
 */
const getTripBudget = async (req, res, next) => {
  try {
    const id = req.params.tripId || req.params.id;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        budget: true,
        stops: {
          include: {
            stopActivities: {
              include: { activity: true }
            }
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Sum activity costs from all stops
    let totalActivitiesCost = 0;
    if (trip.stops) {
      trip.stops.forEach(stop => {
        stop.stopActivities?.forEach(sa => {
          totalActivitiesCost += sa.activity?.cost || 0;
        });
      });
    }

    const budgetData = {
      transportCost: trip.budget?.transportCost || 0,
      stayCost: trip.budget?.stayCost || 0,
      activitiesCost: totalActivitiesCost,
      mealsCost: trip.budget?.mealsCost || 0,
    };

    const grandTotal = budgetData.transportCost + budgetData.stayCost + budgetData.activitiesCost + budgetData.mealsCost;

    res.status(200).json({
      success: true,
      tripId: trip.id,
      budget: budgetData,
      grandTotal
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/trips/:id/budget
 * @desc    Update budget estimates (transport/stay/meals)
 * @access  Private
 */
const updateTripBudget = async (req, res, next) => {
  try {
    const id = req.params.tripId || req.params.id;
    const { transportCost, stayCost, mealsCost } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    if (trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this trip.' });
    }

    if (transportCost !== undefined && (isNaN(transportCost) || transportCost < 0)) {
      return res.status(400).json({ success: false, message: 'transportCost must be a non-negative number.' });
    }
    if (stayCost !== undefined && (isNaN(stayCost) || stayCost < 0)) {
      return res.status(400).json({ success: false, message: 'stayCost must be a non-negative number.' });
    }
    if (mealsCost !== undefined && (isNaN(mealsCost) || mealsCost < 0)) {
      return res.status(400).json({ success: false, message: 'mealsCost must be a non-negative number.' });
    }

    const updateFields = {};
    if (transportCost !== undefined) updateFields.transportCost = Number(transportCost);
    if (stayCost !== undefined) updateFields.stayCost = Number(stayCost);
    if (mealsCost !== undefined) updateFields.mealsCost = Number(mealsCost);

    const updatedBudget = await prisma.budget.upsert({
      where: { tripId: id },
      update: updateFields,
      create: {
        tripId: id,
        transportCost: transportCost !== undefined ? Number(transportCost) : 0.0,
        stayCost: stayCost !== undefined ? Number(stayCost) : 0.0,
        mealsCost: mealsCost !== undefined ? Number(mealsCost) : 0.0,
        activitiesCost: 0.0,
      }
    });

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully!',
      budget: {
        transportCost: updatedBudget.transportCost,
        stayCost: updatedBudget.stayCost,
        activitiesCost: updatedBudget.activitiesCost,
        mealsCost: updatedBudget.mealsCost,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/trips/calendar
 * @desc    Get trips calendar view
 * @access  Private
 */
const getTripsCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year query parameters are required.' });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const nextMonth = monthNum + 1;
    const nextYear = yearNum;

    // Build date range for the requested month
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1));
    const startOfNextMonth = new Date(Date.UTC(nextYear, nextMonth, 1));

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          // Trip starts within this month
          { startDate: { gte: startOfMonth, lt: startOfNextMonth } },
          // Trip ends within this month
          { endDate: { gt: startOfMonth, lte: startOfNextMonth } },
          // Trip encompasses the entire month
          { startDate: { lte: startOfMonth }, endDate: { gte: startOfNextMonth } }
        ],
        include: {
          stops: {
            include: {
              stopActivities: {
                include: { activity: true }
              }
            }
          }
        }
      });

    res.status(200).json({
      success: true,
      month: monthNum,
      year: yearNum,
      trips
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/trips/:tripId/copy
 * @desc    Copy a trip (and its stops/activities) to the current user's account
 * @access  Private
 */
const copyTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const sourceTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: {
          include: {
            stopActivities: {
              include: { activity: true }
            }
          }
        }
      }
    });

    if (!sourceTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (sourceTrip.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to copy this trip.' });
    }

    // Create new trip with same data
    const newTrip = await prisma.trip.create({
      data: {
        userId: req.user.id,
        name: sourceTrip.name,
        description: sourceTrip.description,
        coverPhotoUrl: sourceTrip.coverPhotoUrl,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        isPublic: sourceTrip.isPublic,
        budget: sourceTrip.budget ? {
          create: {
            transportCost: sourceTrip.budget.transportCost,
            stayCost: sourceTrip.budget.stayCost,
            activitiesCost: sourceTrip.budget.activitiesCost,
            mealsCost: sourceTrip.budget.mealsCost
          }
        } : undefined,
        stops: {
          create: sourceTrip.stops.map(stop => ({
            cityId: stop.cityId,
            orderIndex: stop.orderIndex,
            startDate: stop.startDate,
            endDate: stop.endDate,
            stopActivities: {
              create: stop.stopActivities.map(sa => ({
                activityId: sa.activityId,
                scheduledDate: sa.scheduledDate,
                scheduledTime: sa.scheduledTime
              }))
            }
          }))
        }
      },
      include {
        stops: {
          include {
            city: true,
            stopActivities: {
              include: { activity: true }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Trip copied successfully!',
      trip: newTrip
    });
  } catch (error) {
    next(error);
  }
};

const makeTripPublic = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this trip.' });
    }

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { isPublic: true }
    });

    res.status(200).json({
      success: true,
      message: 'Trip made public successfully!',
      trip: {
        id: updated.id,
        name: updated.name,
        isPublic: updated.isPublic
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        city: true,
        country: true,
        profilePhotoUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const getPopularCities = async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        _count: {
          select: { stops: true }
        }
      },
      orderBy: { _count: { stops: 'desc' } },
      take: 10
    });
    res.status(200).json({ success: true, cities });
  } catch (error) {
    next(error);
  }
};

const getPopularActivities = async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: { stopActivities: true }
        }
      },
      orderBy: { _count: { stopActivities: 'desc' } },
      take: 10
    });
    res.status(200).json({ success: true, activities });
  } catch (error) {
    next(error);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const trends = await prisma.trip.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'asc' }
    });
    // Format into months
    const monthlyData = {};
    trends.forEach(item => {
      const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = 0;
      monthlyData[month] += item._count.id;
    });
    // Sort by month and convert to arrays
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => new Date(m).toLocaleString('default', { month: 'short' } + ' ' + new Date(m).getDate()));
    const data = sortedMonths.map(m => monthlyData[m]);
    res.status(200).json({ success: true, labels, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  getTripBudget,
  updateTripBudget,
  getTripsCalendar,
  copyTrip,
  makeTripPublic,
  getAdminUsers,
  getPopularCities,
  getPopularActivities,
  getTrends
};
