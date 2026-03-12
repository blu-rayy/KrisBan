import { useEffect, useRef } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';

// The animation is a full cycle: frames 0-77 = sun→moon, frames 77-154 = moon→sun
const MID_FRAME = 77;
const END_FRAME = 154;

export const DarkModeToggle = ({ darkMode, onToggle }) => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  // Always-current ref so the complete handler can read latest darkMode
  const darkModeRef = useRef(darkMode);
  useEffect(() => { darkModeRef.current = darkMode; }, [darkMode]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const dotLottie = new DotLottie({
      canvas: canvasRef.current,
      src: '/theme-toggle.json',
      autoplay: false,
      loop: false,
      speed: 2,
    });

    playerRef.current = dotLottie;

    dotLottie.addEventListener('load', () => {
      isReadyRef.current = true;
      dotLottie.setFrame(darkModeRef.current ? MID_FRAME : 15);
    });

    // After dark→light finishes (ends at frame 154), pre-seek to 20
    // so the next light→dark click starts instantly with no seek delay
    dotLottie.addEventListener('complete', () => {
      if (!darkModeRef.current) {
        dotLottie.setFrame(20);
      }
    });

    return () => {
      dotLottie.destroy();
      playerRef.current = null;
      isReadyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = (e) => {
    // Play Lottie animation
    const player = playerRef.current;
    if (player && isReadyRef.current) {
      if (!darkMode) {
        player.setFrame(20);
        player.setSegment(20, MID_FRAME);
      } else {
        player.setFrame(MID_FRAME);
        player.setSegment(MID_FRAME, END_FRAME);
      }
      player.play();
    }

    // Circular wipe via View Transitions API
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    if (!document.startViewTransition) {
      onToggle();
      return;
    }

    const transition = document.startViewTransition(() => onToggle());

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath: !darkMode ? clipPath : [...clipPath].reverse() },
        {
          duration: 450,
          easing: 'ease-in-out',
          pseudoElement: !darkMode
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
        }
      );
    });
  };

  return (
    <button
      onClick={handleClick}
      className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <canvas ref={canvasRef} width={72} height={72} style={{ display: 'block', width: '70px', height: '70px' }} />
    </button>
  );
};
