import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * PencilCat3D - Interactive 3D Pencil-Drawn Cat Model
 * 
 * Features:
 * - Uses Midhun's authentic pencil drawing (/images/samples/catpencil.jpg)
 * - 3D Perspective Tilt & Parallax (Rotates toward mouse cursor in 3D)
 * - Dynamic Gaze-Tracking Pupils & Eyelids (Follows mouse pointer)
 * - Interactive 3D Pencil Paw that rises, reaches, and swats at the cursor
 * - Realistic Graphite Tone and Paper Shading
 * - Clean Off-White & Gold Block Badges (NO CAPSULES, MATCHING BORDERS)
 */
export default function PencilCat3D() {
  const containerRef = useRef(null);

  // Mouse tracking coordinates normalized [-1, 1]
  const [mousePos, setMousePos] = useState({ x: 0, y: 0.05 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSwatting, setIsSwatting] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [purring, setPurring] = useState(false);

  // Physics animation interpolation
  const currentPos = useRef({ x: 0, y: 0.05 });
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0.05 });
  const animFrameId = useRef(null);

  // Handle mouse movement across the frame
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawX = (e.clientX - centerX) / (rect.width / 1.3);
    const rawY = (e.clientY - centerY) / (rect.height / 1.3);

    const clampedX = Math.max(-1.1, Math.min(1.1, rawX));
    const clampedY = Math.max(-1.1, Math.min(1.1, rawY));

    setMousePos({ x: clampedX, y: clampedY });
  }, []);

  // Global mouse tracking when near the frame
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dist = Math.hypot(
        e.clientX - (rect.left + rect.width / 2),
        e.clientY - (rect.top + rect.height / 2)
      );

      if (dist < 600) {
        handleMouseMove(e);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [handleMouseMove]);

  // Smooth 60 FPS interpolation loop
  useEffect(() => {
    let active = true;

    const updateLoop = () => {
      if (!active) return;
      currentPos.current.x += (mousePos.x - currentPos.current.x) * 0.085;
      currentPos.current.y += (mousePos.y - currentPos.current.y) * 0.085;

      setRenderPos({
        x: Number(currentPos.current.x.toFixed(4)),
        y: Number(currentPos.current.y.toFixed(4))
      });

      animFrameId.current = requestAnimationFrame(updateLoop);
    };

    animFrameId.current = requestAnimationFrame(updateLoop);
    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [mousePos]);

  // Natural blinking cycle
  useEffect(() => {
    let blinkTimeout;
    const scheduleBlink = () => {
      const delay = 3500 + Math.random() * 2500;
      blinkTimeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 160);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Playful paw swat
  const handleTriggerSwat = () => {
    if (isSwatting) return;
    setIsSwatting(true);
    setPurring(true);
    setTimeout(() => setIsSwatting(false), 450);
    setTimeout(() => setPurring(false), 1800);
  };

  // 3D Perspective Angles
  const rotY = renderPos.x * 22; // Yaw
  const rotX = -renderPos.y * 18; // Pitch
  const rotZ = renderPos.x * 6; // Roll
  const transX = renderPos.x * 12;
  const transY = renderPos.y * 10;

  // Eye Gaze Tracking
  const pupilX = renderPos.x * 8;
  const pupilY = renderPos.y * 6;

  // Paw Movement
  const pawActive = isHovered || isSwatting || renderPos.y < 0.2;
  const pawTargetX = renderPos.x * 32;
  const pawTargetY = isSwatting ? -65 : pawActive ? -20 + renderPos.y * 15 : 12;
  const pawRotZ = isSwatting ? -24 : renderPos.x * 14;

  return (
    <div
      ref={containerRef}
      className="pencil-cat-stage"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0.05 });
      }}
      onClick={handleTriggerSwat}
      title="Click or move cursor to play with Midhun's 3D pencil-drawn cat!"
    >
      <div className="cat-frame-inner">
        {/* SVG Graphite Pencil Shading & Texture Filters */}
        <svg className="svg-pencil-filters" aria-hidden="true">
          <defs>
            <filter id="graphiteTooth" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.15
                        0 0 0 0 0.13
                        0 0 0 0 0.11
                        0 0 0 0.22 0"
                result="graphiteGrain"
              />
              <feBlend mode="multiply" in="SourceGraphic" in2="graphiteGrain" />
            </filter>
            <pattern id="pencilHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#3d3733" strokeWidth="0.8" strokeOpacity="0.35" />
            </pattern>
          </defs>
        </svg>

        {/* 3D Cat Scene Container */}
        <div
          className="cat-3d-scene"
          style={{
            transform: `perspective(900px) rotateX(${rotX * 0.4}deg) rotateY(${rotY * 0.4}deg)`
          }}
        >
          {/* Dynamic Ground Shadow */}
          <div
            className="cat-graphite-shadow"
            style={{
              transform: `translateX(${transX * 0.6}px) scaleX(${1 + Math.abs(renderPos.x) * 0.1})`
            }}
          />

          {/* 3D ARTWORK CANVAS: Displays Midhun's actual pencil cat drawing */}
          <div
            className="cat-drawing-3d-canvas"
            style={{
              transform: `translate3d(${transX}px, ${transY}px, 20px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
            }}
          >
            {/* The Real Hand-Drawn Cat Pencil Sketch */}
            <img
              src="/images/samples/catpencil.jpg"
              alt="Hand-Drawn Pencil Cat Portrait by Midhun"
              className="cat-real-pencil-img"
            />

            {/* Subtle Vignette & Paper Grain Overlay */}
            <div className="cat-pencil-grain-overlay" />

            {/* Interactive Eye Gaze-Tracking Sockets (Aligned over cat's eyes) */}
            <div className="cat-eyes-overlay">
              {/* Left Eye */}
              <div className={`eye-socket left-eye ${blinking ? 'eye-blinking' : ''}`}>
                <div
                  className="cat-pupil-glint"
                  style={{
                    transform: `translate(${pupilX}px, ${pupilY}px) scale(${isHovered ? 1.15 : 1})`
                  }}
                >
                  <span className="specular-spark" />
                </div>
                <div className="cat-eyelid-film" />
              </div>

              {/* Right Eye */}
              <div className={`eye-socket right-eye ${blinking ? 'eye-blinking' : ''}`}>
                <div
                  className="cat-pupil-glint"
                  style={{
                    transform: `translate(${pupilX}px, ${pupilY}px) scale(${isHovered ? 1.15 : 1})`
                  }}
                >
                  <span className="specular-spark" />
                </div>
                <div className="cat-eyelid-film" />
              </div>
            </div>

            {/* Dynamic Whiskers that Quiver in 3D */}
            <div
              className="cat-whiskers-3d"
              style={{
                transform: `translateZ(15px) rotateY(${rotY * 0.3}deg)`
              }}
            >
              <svg viewBox="0 0 240 70" className="whiskers-full-svg">
                {/* Left Whiskers */}
                <path d="M100 32 C 65 24, 30 16, 2 12" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.9" />
                <path d="M102 36 C 65 35, 30 34, 2 32" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.9" />
                <path d="M100 40 C 68 46, 35 56, 6 65" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.9" />
                {/* Right Whiskers */}
                <path d="M140 32 C 175 24, 210 16, 238 12" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.9" />
                <path d="M138 36 C 175 35, 210 34, 238 32" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.9" />
                <path d="M140 40 C 172 46, 205 56, 234 65" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.9" />
              </svg>
            </div>
          </div>

          {/* CUTE 3D PENCIL PAW THAT REACHES & PLAYS WITH MOUSE POINTER! */}
          <div
            className={`cat-3d-paw ${isSwatting ? 'paw-swatting' : ''}`}
            style={{
              transform: `translate3d(${pawTargetX}px, ${pawTargetY}px, 60px) rotateZ(${pawRotZ}deg)`
            }}
          >
            <svg viewBox="0 0 90 120" className="paw-svg">
              <path
                d="M28 120 L 32 45 C 32 30, 68 30, 68 45 L 72 120 Z"
                fill="#dfd9cd"
                stroke="#201d1b"
                strokeWidth="2.5"
              />
              <path
                d="M32 110 L 36 55 C 38 45, 46 42, 50 45 L 48 110 Z"
                fill="url(#pencilHatch)"
                opacity="0.8"
              />

              {/* Cute Round Paw Pad & 4 Puffed Toes */}
              <ellipse cx="50" cy="38" rx="22" ry="18" fill="#eae5da" stroke="#201d1b" strokeWidth="2.5" />

              {/* 4 Little Pencil Toes */}
              <circle cx="34" cy="24" r="8" fill="#f5f1e8" stroke="#201d1b" strokeWidth="2" />
              <circle cx="45" cy="18" r="8.5" fill="#f5f1e8" stroke="#201d1b" strokeWidth="2" />
              <circle cx="57" cy="18" r="8.5" fill="#f5f1e8" stroke="#201d1b" strokeWidth="2" />
              <circle cx="68" cy="24" r="8" fill="#f5f1e8" stroke="#201d1b" strokeWidth="2" />

              {/* Cute Soft Graphite Toe Beans */}
              <ellipse cx="50" cy="40" rx="10" ry="7" fill="#bfaea1" stroke="#4a3e35" strokeWidth="1.2" />
              <circle cx="34" cy="24" r="3.5" fill="#c7b8ac" />
              <circle cx="45" cy="18" r="3.8" fill="#c7b8ac" />
              <circle cx="57" cy="18" r="3.8" fill="#c7b8ac" />
              <circle cx="68" cy="24" r="3.5" fill="#c7b8ac" />
            </svg>
          </div>
        </div>

        {/* Floating Mouse Teaser Dot (Graphite yarn) on Hover */}
        {isHovered && (
          <div
            className="pencil-teaser-dot"
            style={{
              left: `${50 + renderPos.x * 40}%`,
              top: `${50 + renderPos.y * 40}%`
            }}
          >
            <span className="teaser-core" />
            <span className="teaser-ring" />
          </div>
        )}

        {/* Clean Rectangular Block Info Footer (NO CAPSULES, MATCHING BORDER) */}
        <div className="cat-frame-footer">
          <div className="artist-signature-block">
            <span className="sig-name">Midhun R.S.</span>
            <span className="sig-title">Lead Artist</span>
          </div>

          <div className="spec-badge-block">
            Staedtler Lumograph • 65 Hrs Detail
          </div>
        </div>

        {/* Interactive Play Hint */}
        <div className="interactive-play-hint">
          {purring ? '🐾 Purrr... Swat!' : 'Hover mouse to play • Click to swat paw'}
        </div>
      </div>
    </div>
  );
}
