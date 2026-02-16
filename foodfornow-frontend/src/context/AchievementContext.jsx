import React, { createContext, useContext, useState, useCallback } from 'react';
import AchievementNotification from '../components/AchievementNotification';

const AchievementContext = createContext();

/**
 * AchievementProvider Component
 * 
 * Provides global achievement notification functionality.
 * Manages achievement notifications and displays them when achievements are unlocked.
 */
export const AchievementProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Show an achievement notification
   * @param {Object} achievement - Achievement object with name, description, and icon
   */
  const showAchievement = useCallback((achievement) => {
    if (!achievement?.name) return;
    const id = Date.now() + Math.random();
    setNotifications(prev => {
      // Don't show duplicate - same achievement already in queue
      if (prev.some(n => n.achievement?.name === achievement.name)) return prev;
      return [...prev, { id, achievement }];
    });
  }, []);

  /**
   * Remove an achievement notification
   * @param {number} id - Notification ID to remove
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Show multiple achievement notifications
   * @param {Array} achievements - Array of achievement objects
   */
  const showAchievements = useCallback((achievements) => {
    if (!Array.isArray(achievements)) return;
    // Deduplicate by name - only show each achievement once
    const seen = new Set();
    const unique = achievements.filter(a => {
      const key = a?.name || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.forEach((achievement, index) => {
      setTimeout(() => {
        showAchievement(achievement);
      }, index * 500); // Stagger notifications by 500ms
    });
  }, [showAchievement]);

  const value = {
    showAchievement,
    showAchievements,
    removeNotification
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
      
      {/* Render achievement notifications */}
      {notifications.map(({ id, achievement }) => (
        <AchievementNotification
          key={id}
          achievement={achievement}
          onClose={() => removeNotification(id)}
        />
      ))}
    </AchievementContext.Provider>
  );
};

/**
 * Custom hook to use achievement context
 * @returns {Object} Achievement context methods
 */
export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

export default AchievementContext; 