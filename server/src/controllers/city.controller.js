const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @route   GET /api/cities
 * @desc    Get cities with optional search, country filter and limit
 * @access  Public
 */
const getCities = async (req, res, next) => {
  try {
    const { search, country, limit } = req.query;

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { country: { contains: search } }
      ];
    }

    if (country) {
      whereClause.country = { contains: country };
    }

    const takeCount = limit ? parseInt(limit, 10) : undefined;

    const cities = await prisma.city.findMany({
      where: whereClause,
      take: takeCount,
      orderBy: { popularity: 'desc' },
      include: {
        _count: {
          select: { activities: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cities/:id
 * @desc    Get single city details with activities
 * @access  Public
 */
const getCityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        activities: true
      }
    });

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found.' });
    }

    res.status(200).json({
      success: true,
      city
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cities/:id/activities
 * @desc    Get all activities available in a given city
 * @access  Public
 */
const getCityActivities = async (req, res, next) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found.' });
    }

    res.status(200).json({
      success: true,
      count: city.activities.length,
      activities: city.activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCities,
  getCityById,
  getCityActivities
};
