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
    const { id } = req.params;

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
    const { id } = req.params;

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
    const { id } = req.params;
    const { transportCost, stayCost, mealsCost } = req.body;

    if (transportCost !== undefined && (isNaN(transportCost) || transportCost < 0)) {
      return res.status(400).json({ success: false, message: 'transportCost must be a non-negative number.' });
    }
    if (stayCost !== undefined && (isNaN(stayCost) || stayCost < 0)) {
      return res.status(400).json({ success: false, message: 'stayCost must be a non-negative number.' });
    }
    if (mealsCost !== undefined && (isNaN(mealsCost) || mealsCost < 0)) {
      return res.status(400).json({ success: false, message: 'mealsCost must be a non-negative number.' });
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        transportCost: transportCost !== undefined ? Number(transportCost) : undefined,
        stayCost: stayCost !== undefined ? Number(stayCost) : undefined,
        mealsCost: mealsCost !== undefined ? Number(mealsCost) : undefined,
      }
    });

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully!',
      budget: {
        transportCost: updated.transportCost,
        stayCost: updated.stayCost,
        activitiesCost: updated.budget?.activitiesCost || 0,
        mealsCost: updated.mealsCost,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  getTripBudget,
  updateTripBudget
};
