const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STOP_INCLUDE = {
  city: true,
  stopActivities: {
    orderBy: { scheduledDate: 'asc' },
    include: { activity: true }
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parses a date-ish value. Returns:
 *  - Date object when valid
 *  - null when empty/absent
 *  - undefined when present but invalid (signals a validation error)
 */
function parseDateOrNull(value) {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return null;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Validates that a stop's date range falls fully within the trip's overall
 * date range. Returns an error message string, or null when valid.
 * Stops/trips without dates skip the corresponding bound.
 */
function validateWithinTrip(stopStart, stopEnd, tripStart, tripEnd) {
  if (!stopStart && !stopEnd) return null;
  if ((stopStart && !stopEnd) || (!stopStart && stopEnd)) {
    return 'A section must have both a start and end date.';
  }
  if (stopStart > stopEnd) {
    return 'Section end date cannot be before its start date.';
  }
  if (tripStart && stopStart < tripStart) {
    return `Section dates must fall within the trip dates — start date is before the trip begins (${formatDate(tripStart)}).`;
  }
  if (tripEnd && stopEnd > tripEnd) {
    return `Section dates must fall within the trip dates — end date is after the trip ends (${formatDate(tripEnd)}).`;
  }
  return null;
}

/**
 * Two complete ranges overlap when each starts strictly before the other
 * ends. Back-to-back ranges (one ends the day the next starts) are allowed.
 */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Finds a conflicting overlapping sibling stop. Returns the conflict or null.
 */
function findOverlap(stopStart, stopEnd, otherStops) {
  for (const other of otherStops) {
    if (rangesOverlap(stopStart, stopEnd, other.startDate, other.endDate)) {
      const label = other.title || (other.city ? other.city.name : `Section ${other.orderIndex + 1}`);
      return { stopId: other.id, message: `Dates overlap with another section${label ? ` ("${label}")` : ''}. Sections cannot have overlapping date ranges.` };
    }
  }
  return null;
}

async function getOwnedTrip(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { stops: { include: { city: true } } }
  });
  if (!trip) {
    return { error: { status: 404, message: 'Trip not found.' } };
  }
  if (trip.userId !== userId) {
    return { error: { status: 403, message: 'You do not have permission to modify this trip.' } };
  }
  return { trip };
}

// Parses & validates budget input. Returns { value } | { error } | { value: null }.
function parseBudget(budget) {
  if (budget === undefined || budget === null || budget === '') return { value: null };
  const n = Number(budget);
  if (isNaN(n) || n < 0) {
    return { error: 'Budget must be a non-negative number.' };
  }
  return { value: n };
}

// ── Stop CRUD ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/trips/:tripId/stops
 * @desc    Create a stop (section) within a trip
 * @access  Private
 */
const createStop = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { cityId, title, startDate, endDate, budget, orderIndex } = req.body;

    if (!cityId || !cityId.trim()) {
      return res.status(400).json({ success: false, message: 'A city is required for each section.' });
    }

    const { trip, error: tripError } = await getOwnedTrip(tripId, req.user.id);
    if (tripError) {
      return res.status(tripError.status).json({ success: false, message: tripError.message });
    }

    const city = await prisma.city.findUnique({ where: { id: cityId.trim() } });
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found.' });
    }

    const start = parseDateOrNull(startDate);
    const end = parseDateOrNull(endDate);
    if (start === undefined || end === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid date format provided.' });
    }

    const boundsError = validateWithinTrip(start, end, trip.startDate, trip.endDate);
    if (boundsError) {
      return res.status(400).json({ success: false, message: boundsError });
    }

    const overlap = findOverlap(start, end, trip.stops);
    if (overlap) {
      return res.status(400).json({ success: false, message: overlap.message });
    }

    const budgetResult = parseBudget(budget);
    if (budgetResult.error) {
      return res.status(400).json({ success: false, message: budgetResult.error });
    }

    // Default to appending at the end of the itinerary
    let resolvedOrder = typeof orderIndex === 'number' && Number.isInteger(orderIndex) && orderIndex >= 0
      ? orderIndex
      : trip.stops.reduce((max, s) => Math.max(max, s.orderIndex), -1) + 1;

    const newStop = await prisma.stop.create({
      data: {
        tripId,
        cityId: city.id,
        title: title && title.trim() ? title.trim() : null,
        budget: budgetResult.value,
        startDate: start,
        endDate: end,
        orderIndex: resolvedOrder
      },
      include: STOP_INCLUDE
    });

    res.status(201).json({
      success: true,
      message: 'Section added successfully!',
      stop: newStop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/trips/:tripId/stops/:stopId
 * @desc    Update a stop (title, dates, budget, order, city)
 * @access  Private
 */
const updateStop = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;
    const updates = req.body;

    const { trip, error: tripError } = await getOwnedTrip(tripId, req.user.id);
    if (tripError) {
      return res.status(tripError.status).json({ success: false, message: tripError.message });
    }

    const existingStop = await prisma.stop.findUnique({
      where: { id: stopId },
      include: { city: true, stopActivities: true }
    });
    if (!existingStop || existingStop.tripId !== tripId) {
      return res.status(404).json({ success: false, message: 'Section not found on this trip.' });
    }

    // Resolve effective values (provided value falls back to current)
    let cityChanged = false;
    let effectiveCityId = existingStop.cityId;
    if (updates.cityId !== undefined) {
      if (!updates.cityId) {
        return res.status(400).json({ success: false, message: 'A section must always have a city. Delete the section instead.' });
      }
      const city = await prisma.city.findUnique({ where: { id: updates.cityId } });
      if (!city) {
        return res.status(404).json({ success: false, message: 'City not found.' });
      }
      cityChanged = city.id !== existingStop.cityId;
      effectiveCityId = city.id;
    }

    const start = parseDateOrNull(updates.startDate ?? existingStop.startDate);
    const end = parseDateOrNull(updates.endDate ?? existingStop.endDate);
    if (start === undefined || end === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid date format provided.' });
    }

    const boundsError = validateWithinTrip(start, end, trip.startDate, trip.endDate);
    if (boundsError) {
      return res.status(400).json({ success: false, message: boundsError });
    }

    const siblings = trip.stops.filter(s => s.id !== stopId);
    const overlap = findOverlap(start, end, siblings);
    if (overlap) {
      return res.status(400).json({ success: false, message: overlap.message });
    }

    const budgetResult = parseBudget(updates.budget ?? existingStop.budget);
    if (budgetResult.error) {
      return res.status(400).json({ success: false, message: budgetResult.error });
    }

    let resolvedOrder = existingStop.orderIndex;
    if (updates.orderIndex !== undefined) {
      if (!Number.isInteger(updates.orderIndex) || updates.orderIndex < 0) {
        return res.status(400).json({ success: false, message: 'orderIndex must be a non-negative integer.' });
      }
      resolvedOrder = updates.orderIndex;
    }

    const updatedStop = await prisma.stop.update({
      where: { id: stopId },
      data: {
        cityId: effectiveCityId,
        title: updates.title !== undefined
          ? (updates.title && updates.title.trim() ? updates.title.trim() : null)
          : existingStop.title,
        startDate: start,
        endDate: end,
        budget: budgetResult.value,
        orderIndex: resolvedOrder,
        // Changing a section's city invalidates its attached activities —
        // cascade-remove them so no orphaned join rows are left behind.
        ...(cityChanged ? { stopActivities: { deleteMany: {} } } : {})
      },
      include: STOP_INCLUDE
    });

    res.status(200).json({
      success: true,
      message: 'Section updated successfully!' + (cityChanged ? ' Previously attached activities were removed because the city changed.' : ''),
      stop: updatedStop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/trips/:tripId/stops/:stopId
 * @desc    Delete a stop; its StopActivity rows cascade automatically
 * @access  Private
 */
const deleteStop = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;

    const { error: tripError } = await getOwnedTrip(tripId, req.user.id);
    if (tripError) {
      return res.status(tripError.status).json({ success: false, message: tripError.message });
    }

    const existingStop = await prisma.stop.findUnique({ where: { id: stopId } });
    if (!existingStop || existingStop.tripId !== tripId) {
      return res.status(404).json({ success: false, message: 'Section not found on this trip.' });
    }

    // onDelete: Cascade on StopActivity.stop removes all attached activities too
    await prisma.stop.delete({ where: { id: stopId } });

    res.status(200).json({
      success: true,
      message: 'Section removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ── Stop Activities ────────────────────────────────────────────────────────

/**
 * @route   POST /api/stops/:stopId/activities
 * @desc    Attach an activity to a stop (optionally scheduled)
 * @access  Private
 */
const addStopActivity = async (req, res, next) => {
  try {
    const { stopId } = req.params;
    const { activityId, scheduledDate, scheduledTime } = req.body;

    if (!activityId || !activityId.trim()) {
      return res.status(400).json({ success: false, message: 'activityId is required.' });
    }

    const stop = await prisma.stop.findUnique({
      where: { id: stopId },
      include: { trip: true, city: true }
    });
    if (!stop) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    if (stop.trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this trip.' });
    }

    const activity = await prisma.activity.findUnique({ where: { id: activityId.trim() } });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }
    if (activity.cityId !== stop.cityId) {
      return res.status(400).json({
        success: false,
        message: `"${activity.name}" does not belong to ${stop.city.name} and cannot be added to this section.`
      });
    }

    const duplicate = await prisma.stopActivity.findUnique({
      where: { stopId_activityId: { stopId, activityId: activity.id } }
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `"${activity.name}" is already part of this section.`
      });
    }

    const parsedDate = parseDateOrNull(scheduledDate);
    if (parsedDate === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid scheduled date format.' });
    }

    const stopActivity = await prisma.stopActivity.create({
      data: {
        stopId,
        activityId: activity.id,
        scheduledDate: parsedDate,
        scheduledTime: scheduledTime && String(scheduledTime).trim() ? String(scheduledTime).trim() : null
      },
      include: { activity: true }
    });

    res.status(201).json({
      success: true,
      message: `"${activity.name}" added to the section.`,
      stopActivity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/stops/:stopId/activities/:activityId
 * @desc    Detach an activity from a stop
 * @access  Private
 */
const removeStopActivity = async (req, res, next) => {
  try {
    const { stopId, activityId } = req.params;

    const stop = await prisma.stop.findUnique({
      where: { id: stopId },
      include: { trip: true }
    });
    if (!stop) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    if (stop.trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this trip.' });
    }

    const deleted = await prisma.stopActivity.deleteMany({
      where: { stopId, activityId }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ success: false, message: 'This activity is not attached to the section.' });
    }

    res.status(200).json({
      success: true,
      message: 'Activity removed from the section.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStop,
  updateStop,
  deleteStop,
  addStopActivity,
  removeStopActivity
};
