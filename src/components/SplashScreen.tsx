"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Animation Controllers for the 6-step sequence
  const mainControls = useAnimation();
  const centerLightControls = useAnimation();
  const ringControls = useAnimation();
  const outlineControls = useAnimation();
  const shutterControls = useAnimation();
  const baseControls = useAnimation();
  const textControls = useAnimation();

  useEffect(() => {
    // Session storage check to only play once per visit
    const hasPlayed = sessionStorage.getItem("splashPlayed");
    if (hasPlayed) {
      setIsDone(true);
      setShouldRender(true);
      return;
    }
    setShouldRender(true);

    const runSequence = async () => {
      // Step 1: Initial (Small purple light appears)
      await centerLightControls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, ease: "easeOut" },
      });

      // Step 2: Energy Build (Light expands into swirling rings)
      centerLightControls.start({
        scale: 4,
        opacity: 0,
        transition: { duration: 1, ease: "easeInOut" },
      });
      ringControls.start((i) => ({
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.5],
        rotate: 180 * (i % 2 === 0 ? 1 : -1), // Counter-rotating rings
        transition: { duration: 1.5, ease: "easeOut", delay: i * 0.2 },
      }));

      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Shape Reveal (Outline of the vault emerges)
      await outlineControls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 1, ease: "easeInOut" },
      });

      // Step 4: Logo Formation (Pieces lock into place)
      // Reveal the background of the icon
      baseControls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5 },
      });
      
      // Shutter blades snap in with a spring effect
      await shutterControls.start((i) => ({
        opacity: 1,
        rotate: i * 60,
        scale: 1,
        transition: { 
          type: "spring", 
          stiffness: 120, 
          damping: 12, 
          delay: i * 0.08 
        },
      }));

      // Step 5: Text Reveal (SnapVault fades in)
      await textControls.start({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: "easeOut" },
      });

      await new Promise((r) => setTimeout(r, 400));

      // Step 6: Settle (Gentle pulse of the whole logo)
      await mainControls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 1, ease: "easeInOut" },
      });

      await new Promise((r) => setTimeout(r, 300));

      // Fade out everything smoothly to reveal login
      await mainControls.start({
        opacity: 0,
        transition: { duration: 0.6, ease: "easeInOut" },
      });

      sessionStorage.setItem("splashPlayed", "true");
      setIsDone(true);
    };

    const timeout = setTimeout(runSequence, 300);
    return () => clearTimeout(timeout);
  }, [
    mainControls,
    centerLightControls,
    ringControls,
    outlineControls,
    shutterControls,
    baseControls,
    textControls,
  ]);

  if (!shouldRender) return null;
  if (isDone) return <>{children}</>;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
      animate={mainControls}
    >
      <div className="relative flex flex-col items-center justify-center w-64 h-64">
        
        {/* Step 1: Center Light */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-[#C084FC] shadow-[0_0_15px_5px_rgba(192,132,252,0.8)] z-10"
          initial={{ opacity: 0, scale: 0 }}
          animate={centerLightControls}
        />

        {/* Step 2: Energy Rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            className="absolute w-32 h-32 rounded-full border border-[#7C3AED] z-0"
            style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={ringControls}
          />
        ))}

        {/* SVG Logo Container */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <svg viewBox="0 0 100 100" className="w-32 h-32 overflow-visible">
            <defs>
              {/* Purple Gradient for Shutter */}
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              {/* Metallic Gradient for Vault Case */}
              <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E5E5E5" />
                <stop offset="100%" stopColor="#737373" />
              </linearGradient>
              {/* Soft Inner Glow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Step 4: Filled Base elements (Appears after outline) */}
            <motion.g initial={{ opacity: 0, scale: 0.95 }} animate={baseControls}>
              {/* Vault Main Body Fill */}
              <rect x="20" y="20" width="60" height="60" rx="16" fill="#111" stroke="url(#metalGrad)" strokeWidth="3" />
              {/* Left Hinge */}
              <rect x="12" y="38" width="16" height="24" rx="4" fill="url(#metalGrad)" stroke="#050505" strokeWidth="1" />
              <rect x="12" y="42" width="4" height="16" rx="2" fill="#050505" />
              {/* Right Dial/Lock */}
              <circle cx="85" cy="50" r="8" fill="url(#metalGrad)" stroke="#050505" strokeWidth="1" />
              <circle cx="85" cy="50" r="3" fill="#050505" />
            </motion.g>

            {/* Step 3: Shape Reveal (Outlines draw first) */}
            <motion.g
              initial={{ opacity: 0, pathLength: 0 }}
              animate={outlineControls}
              stroke="url(#purpleGrad)"
              strokeWidth="2"
              fill="none"
              style={{ filter: "url(#glow)" }}
            >
              <rect x="20" y="20" width="60" height="60" rx="16" />
              <rect x="12" y="38" width="16" height="24" rx="4" />
              <circle cx="85" cy="50" r="8" />
            </motion.g>

            {/* Step 4: Shutter Blades Lock In */}
            <g style={{ transformOrigin: "50px 50px" }}>
              {/* We generate 6 blades forming the camera aperture */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.polygon
                  key={i}
                  custom={i}
                  // Blade coordinates
                  points="45,26 73,26 53,46"
                  fill="url(#purpleGrad)"
                  stroke="#050505"
                  strokeWidth="1.5"
                  style={{ transformOrigin: "50px 50px" }}
                  // Start rotated outwards and slightly smaller
                  initial={{ opacity: 0, scale: 0.8, rotate: (i * 60) - 45 }}
                  animate={shutterControls}
                />
              ))}
              {/* Center hole of the aperture */}
              <motion.circle 
                cx="50" cy="50" r="8" 
                fill="#111" 
                initial={{ opacity: 0 }} 
                animate={baseControls} 
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Step 5: Text Reveal */}
      <motion.div
        className="mt-6 flex flex-col items-center"
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={textControls}
      >
        <h1 className="text-white font-sans font-semibold text-3xl tracking-wide flex items-center">
          Snap<span className="text-[#C084FC]">Vault</span>
        </h1>
        <p className="text-neutral-400 text-sm mt-2 font-medium tracking-wider">
          Your memories. Secured.
        </p>
      </motion.div>
    </motion.div>
  );
}