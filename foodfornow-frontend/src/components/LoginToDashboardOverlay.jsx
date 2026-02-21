import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const EASE_OUT = [0.22, 1, 0.36, 1];
const CIRCLE_DURATION = 0.55;
const FADE_DURATION = 0.5;
const FADE_START = 0.55; // hold full green, then fade as dashboard loads in

/**
 * Full-screen overlay shown when navigating from login to dashboard.
 * Circle reveal in brand green expands from center, holds briefly,
 * then fades out as the dashboard slides in.
 */
export default function LoginToDashboardOverlay() {
  const { pathname } = useLocation();
  const { justLoggedIn } = useAuth();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (justLoggedIn) setHidden(false);
  }, [justLoggedIn]);

  const show = pathname === '/dashboard' && justLoggedIn && !hidden;
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{
        opacity: [1, 1, 0],
        transition: {
          duration: FADE_DURATION,
          times: [0, FADE_START, 1],
          ease: EASE_OUT,
        },
      }}
      onAnimationComplete={() => setHidden(true)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 2.5 }}
        transition={{ duration: CIRCLE_DURATION, ease: EASE_OUT }}
        style={{
          width: '100vmax',
          height: '100vmax',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #228B22 0%, #006400 100%)',
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}
