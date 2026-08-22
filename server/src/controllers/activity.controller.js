const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @route   GET /api/activities
 * @desc    Get activities with optional search, category, and cost filtering
 * @access  Public
 */
const getActivities = async (req, res, next) => {
  try {
    const { search, category, minCost, maxCost } = req.query;

    const whereClause = {};

    if (search) {
      whereClause.name = { contains: search };
    }

    if (category) {
      whereClause.category = category;
    }

    if (minCost !== undefined || maxCost !== undefined) {
      whereClause.cost = {};
      if (minCost !== undefined) {
        whereClause.cost.gte = parseFloat(minCost);
      }
      if (maxCost !== undefined) {
        whereClause.cost.lte = parseFloat(maxCost);
      }
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: { city: true },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities
};