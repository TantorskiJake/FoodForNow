const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/achievement');
const achievements = require('../config/achievements');

/**
 * GET /achievements - Get user's achievements
 * 
 * Returns all achievements for the authenticated user,
 * including progress and completion status.
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get user's achievements
    const userAchievements = await Achievement.find({ userId: req.userId })
      .sort({ category: 1, name: 1 });

    // Create a map of user achievements by ID for easy lookup
    const userAchievementsMap = {};
    userAchievements.forEach(achievement => {
      userAchievementsMap[achievement.achievementId] = achievement;
    });

    // Get all available achievements and merge with user progress
    const allAchievements = Object.keys(achievements).map(achievementId => {
      const config = achievements[achievementId];
      const userAchievement = userAchievementsMap[achievementId];
      
      return {
        id: achievementId,
        name: config.name,
        description: config.description,
        category: config.category,
        icon: config.icon,
        requiredProgress: config.requiredProgress,
        progress: userAchievement ? userAchievement.progress : 0,
        completed: userAchievement ? userAchievement.completed : false,
        completedAt: userAchievement ? userAchievement.completedAt : null,
        unlockedAt: userAchievement ? userAchievement.unlockedAt : null
      };
    });

    // Group achievements by category
    const groupedAchievements = {
      'getting-started': allAchievements.filter(a => a.category === 'getting-started'),
      'recipe-mastery': allAchievements.filter(a => a.category === 'recipe-mastery'),
      'meal-planning': allAchievements.filter(a => a.category === 'meal-planning'),
      'pantry-shopping': allAchievements.filter(a => a.category === 'pantry-shopping'),
      'milestone': allAchievements.filter(a => a.category === 'milestone')
    };

    // Calculate statistics
    const totalAchievements = allAchievements.length;
    const completedAchievements = allAchievements.filter(a => a.completed).length;
    const completionPercentage = Math.round((completedAchievements / totalAchievements) * 100);

    res.json({
      achievements: groupedAchievements,
      stats: {
        total: totalAchievements,
        completed: completedAchievements,
        completionPercentage,
        categories: {
          'getting-started': groupedAchievements['getting-started'].filter(a => a.completed).length,
          'recipe-mastery': groupedAchievements['recipe-mastery'].filter(a => a.completed).length,
          'meal-planning': groupedAchievements['meal-planning'].filter(a => a.completed).length,
          'pantry-shopping': groupedAchievements['pantry-shopping'].filter(a => a.completed).length,
          'milestone': groupedAchievements['milestone'].filter(a => a.completed).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * GET /achievements/recent - Get recently completed achievements
 * 
 * Returns achievements completed in the last 7 days
 */
router.get('/recent', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAchievements = await Achievement.find({
      userId: req.userId,
      completed: true,
      completedAt: { $gte: sevenDaysAgo }
    }).sort({ completedAt: -1 }).limit(10);

    const recentWithConfig = recentAchievements.map(achievement => {
      const config = achievements[achievement.achievementId];
      return {
        id: achievement.achievementId,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        completedAt: achievement.completedAt
      };
    });

    res.json({ recentAchievements: recentWithConfig });
  } catch (error) {
    console.error('Error fetching recent achievements:', error);
    res.status(500).json({ error: 'Failed to fetch recent achievements' });
  }
});

/**
 * POST /achievements/check - Manually check for achievements
 * 
 * Allows manual triggering of achievement checks for testing
 */
router.post('/check', auth, async (req, res) => {
  try {
    const { achievementId, progress = 1 } = req.body;
    
    if (!achievementId) {
      return res.status(400).json({ error: 'Achievement ID is required' });
    }

    const AchievementService = require('../services/achievementService');
    const result = await AchievementService.checkAchievement(req.userId, achievementId, progress);

    if (result) {
      res.json({
        success: true,
        achievement: result.achievement,
        newlyCompleted: result.newlyCompleted,
        message: result.newlyCompleted ? 'Achievement unlocked!' : 'Progress updated'
      });
    } else {
      res.status(404).json({ error: 'Achievement not found' });
    }
  } catch (error) {
    console.error('Error checking achievement:', error);
    res.status(500).json({ error: 'Failed to check achievement' });
  }
});

/**
 * GET /achievements/leaderboard - Get achievement leaderboard
 * 
 * Returns users ranked by achievement completion
 */
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await Achievement.aggregate([
      {
        $match: { completed: true }
      },
      {
        $group: {
          _id: '$userId',
          completedCount: { $sum: 1 },
          lastCompleted: { $max: '$completedAt' }
        }
      },
      {
        $sort: { completedCount: -1, lastCompleted: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          completedCount: 1,
          lastCompleted: 1
        }
      }
    ]);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router; 