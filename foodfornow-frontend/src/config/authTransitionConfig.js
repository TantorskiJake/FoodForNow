/**
 * Shared auth transition config for login and logout.
 * Change these in one place to update both flows.
 */
export const AUTH_TRANSITION = {
  /** Cubic bezier for smooth ease-out (deliberate, not rushed). */
  easeOut: [0.22, 1, 0.36, 1],

  /** Form exit: blur + scale duration (login form, and optionally page on logout). */
  exitDuration: 0.5,

  /** Green circle expand/shrink duration. */
  circleDuration: 0.55,

  /** After circle is full: hold time before fade (login only). */
  fadeStart: 0.55,

  /** Fade-out duration for overlay (login: circle then fade; logout: no fade, navigate on full). */
  fadeDuration: 0.5,

  /** Circle scale when "full" (covers viewport). */
  circleScaleFull: 2.5,

  /** Success checkmark / hold on login before exit. */
  successHoldMs: 700,
  successIconDuration: 0.45,

  /** Form exit visual (used by login; can be reused for logout page exit). */
  formExit: {
    scale: 0.97,
    blurPx: 6,
  },

  /** Brand green for circle gradient. */
  circleGradient: 'linear-gradient(135deg, #228B22 0%, #006400 100%)',
};

export default AUTH_TRANSITION;
