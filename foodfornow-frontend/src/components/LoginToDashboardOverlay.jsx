import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/**
 * Full-screen overlay shown when navigating from login to dashboard.
 * Circle reveal in brand green expands from center, then fades out
 * while the dashboard entrance runs underneath.
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
        transition: { duration: 0.4, times: [0, 0.7, 1] },
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
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
