import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  useTheme,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  useMediaQuery,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
  Kitchen as KitchenIcon,
  ShoppingCart as ShoppingCartIcon,
  CalendarToday as CalendarTodayIcon,
  Celebration as CelebrationIcon,
  MilitaryTech as MilitaryTechIcon,
  Timeline as TimelineIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Achievements = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [achievements, setAchievements] = useState({});
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [recentAchievements, setRecentAchievements] = useState([]);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const [achievementsRes, recentRes] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/recent')
      ]);

      setAchievements(achievementsRes.data.achievements);
      setStats(achievementsRes.data.stats);
      setRecentAchievements(recentRes.data.recentAchievements);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'getting-started': <StarIcon />,
      'recipe-mastery': <RestaurantIcon />,
      'meal-planning': <CalendarTodayIcon />,
      'pantry-shopping': <ShoppingCartIcon />,
      'milestone': <MilitaryTechIcon />
    };
    return icons[category] || <TrophyIcon />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'getting-started': '#4caf50',
      'recipe-mastery': '#ff9800',
      'meal-planning': '#2196f3',
      'pantry-shopping': '#9c27b0',
      'milestone': '#ffd700'
    };
    return colors[category] || '#757575';
  };

  const getCategoryName = (category) => {
    const names = {
      'getting-started': 'Getting Started',
      'recipe-mastery': 'Recipe Mastery',
      'meal-planning': 'Meal Planning',
      'pantry-shopping': 'Pantry & Shopping',
      'milestone': 'Milestones'
    };
    return names[category] || category;
  };

  const renderAchievementCard = (achievement) => {
    // For milestone achievements, cap progress at 100% when completed
    let progress = (achievement.progress / achievement.requiredProgress) * 100;
    if (achievement.category === 'milestone' && achievement.completed) {
      progress = 100;
    }
    const isCompleted = achievement.completed;
    const isStarted = achievement.progress > 0;

    return (
      <Zoom in timeout={300}>
        <Card
          elevation={isCompleted ? 4 : 1}
          sx={{
            height: '100%',
            transition: 'all 0.3s ease',
            border: isCompleted ? `2px solid ${getCategoryColor(achievement.category)}` : '1px solid',
            borderColor: isCompleted ? getCategoryColor(achievement.category) : 'divider',
            background: isCompleted 
              ? `linear-gradient(135deg, ${getCategoryColor(achievement.category)}15 0%, ${getCategoryColor(achievement.category)}05 100%)`
              : 'background.paper',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isCompleted ? 8 : 4,
            },
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  fontSize: '2rem',
                  mr: 2,
                  opacity: isCompleted ? 1 : 0.5,
                  filter: isCompleted ? 'none' : 'grayscale(100%)',
                }}
              >
                {achievement.icon}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: isCompleted ? 'text.primary' : 'text.secondary',
                    textDecoration: isCompleted ? 'none' : 'none',
                  }}
                >
                  {achievement.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {achievement.description}
                </Typography>
              </Box>
              {isCompleted && (
                <CheckCircleIcon
                  sx={{
                    color: getCategoryColor(achievement.category),
                    fontSize: '1.5rem',
                  }}
                />
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {achievement.category === 'milestone' && achievement.completed 
                    ? `${achievement.requiredProgress} / ${achievement.requiredProgress}`
                    : `${achievement.progress} / ${achievement.requiredProgress}`
                  }
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: isCompleted 
                      ? getCategoryColor(achievement.category)
                      : theme.palette.primary.main,
                  },
                }}
              />
            </Box>

            {isCompleted && achievement.completedAt && (
              <Typography variant="caption" color="text.secondary">
                Completed: {new Date(achievement.completedAt).toLocaleDateString()}
              </Typography>
            )}

            {!isStarted && (
              <Chip
                icon={<LockIcon />}
                label="Locked"
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  const renderCategorySection = (category, achievements) => {
    const categoryStats = stats.categories?.[category] || 0;
    const totalInCategory = achievements.length;
    const completionRate = totalInCategory > 0 ? Math.round((categoryStats / totalInCategory) * 100) : 0;

    return (
      <Box key={category} sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              color: getCategoryColor(category),
              mr: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {getCategoryIcon(category)}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {getCategoryName(category)}
          </Typography>
          <Chip
            label={`${categoryStats}/${totalInCategory}`}
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {completionRate}% complete
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              {renderAchievementCard(achievement)}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box>
            {/* Header Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-1px',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #ffffff 30%, #e0e0e0 90%)'
                    : 'linear-gradient(45deg, #1a1a1a 30%, #4a4a4a 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Achievements
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400, opacity: 0.8 }}
              >
                Track your culinary journey and unlock new milestones
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Stats Overview */}
            <Slide direction="up" in timeout={1000}>
              <Card
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                          {stats.completed || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                          {stats.total || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Available
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info" sx={{ fontWeight: 700 }}>
                          {stats.completionPercentage || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning" sx={{ fontWeight: 700 }}>
                          {recentAchievements.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recent Unlocks
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Slide>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <Slide direction="up" in timeout={1200}>
                <Card
                  elevation={0}
                  sx={{
                    mb: 4,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      🎉 Recently Unlocked
                    </Typography>
                    <Grid container spacing={2}>
                      {recentAchievements.slice(0, 3).map((achievement) => (
                        <Grid item xs={12} sm={4} key={achievement.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ fontSize: '2rem', mr: 2 }}>
                              {achievement.icon}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {achievement.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(achievement.completedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Slide>
            )}

            {/* Achievements by Category */}
            <Slide direction="up" in timeout={1400}>
              <Box>
                {Object.entries(achievements).map(([category, categoryAchievements]) =>
                  renderCategorySection(category, categoryAchievements)
                )}
              </Box>
            </Slide>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Achievements; 