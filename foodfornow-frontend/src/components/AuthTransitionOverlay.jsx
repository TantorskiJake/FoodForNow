import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AUTH_TRANSITION } from '../config/authTransitionConfig';

const {
  easeOut,
  circleDuration,
  fadeDuration,
  fadeStart,
  circleScaleFull,
  circleGradient,
} = AUTH_TRANSITION;

/**
 * Unified auth transition overlay for login and logout.
 * Uses the same green circle expand so both flows feel consistent;
 * change authTransitionConfig.js to tweak both at once.
 *
 * - Login: shown on /dashboard after justLoggedIn → circle expands, holds, fades.
 * - Logout: shown when justLoggedOut → circle expands over current page, then completion callback runs (logout + navigate).
 */
export default function AuthTransitionOverlay() {
  const { pathname } = useLocation();
  const { justLoggedIn, justLoggedOut, finishLogoutTransition } = useAuth();
  const [loginHidden, setLoginHidden] = useState(false);

  useEffect(() => {
    if (justLoggedIn) setLoginHidden(false);
  }, [justLoggedIn]);

  const showLogin = pathname === '/dashboard' && justLoggedIn && !loginHidden;
  const showLogout = justLoggedOut;

  if (!showLogin && !showLogout) return null;

  const isLogout = showLogout;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{
        opacity: isLogout
          ? 1
          : [1, 1, 0],
        transition: isLogout
          ? undefined
          : {
              duration: fadeDuration,
              times: [0, fadeStart, 1],
              ease: easeOut,
            },
      }}
      onAnimationComplete={() => {
        if (!isLogout) setLoginHidden(true);
      }}
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
        animate={{ scale: circleScaleFull }}
        transition={{ duration: circleDuration, ease: easeOut }}
        onAnimationComplete={() => {
          if (isLogout) finishLogoutTransition();
        }}
        style={{
          width: '100vmax',
          height: '100vmax',
          borderRadius: '50%',
          background: circleGradient,
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}
