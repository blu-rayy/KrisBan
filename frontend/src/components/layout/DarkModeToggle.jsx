import { useEffect, useRef } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';

// The animation is a full cycle: frames 0-77 = sun→moon, frames 77-154 = moon→sun
const MID_FRAME = 77;
const END_FRAME = 154;

export const DarkModeToggle = ({ darkMode, onToggle }) => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);

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
      // Snap to correct state for current theme (no animation)
      dotLottie.setFrame(darkMode ? MID_FRAME : 0);
    });

    return () => {
      dotLottie.destroy();
      playerRef.current = null;
      isReadyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = () => {
    onToggle();

    const player = playerRef.current;
    if (!player || !isReadyRef.current) return;

    if (!darkMode) {
      // Light → Dark: play first half (sun → moon)
      player.setSegment(0, MID_FRAME);
    } else {
      // Dark → Light: play second half (moon → sun)
      player.setSegment(MID_FRAME, END_FRAME);
    }
    player.setMode('forward');
    player.play();
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
