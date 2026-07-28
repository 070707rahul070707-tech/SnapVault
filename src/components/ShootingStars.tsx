"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

interface StarTrail {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  tailLength: number;
  color: string;
}

export default function ShootingStars() {
  const [stars, setStars] = useState<Star[]>([]);
  const [trails, setTrails] = useState<StarTrail[]>([]);

  useEffect(() => {
    // Real meteor colors based on actual chemical composition
    const meteorColors = [
      "from-transparent via-yellow-300/80 to-yellow-100",   // Yellow (Iron)
      "from-transparent via-purple-400/80 to-purple-200",   // Purple (Calcium)
      "from-transparent via-cyan-300/80 to-cyan-100",       // Blue/Cyan (Magnesium)
      "from-transparent via-orange-400/80 to-orange-200",   // Orange (Sodium)
      "from-transparent via-emerald-400/95 to-emerald-100", // Green (Nickel) - Highlighted!
    ];

    // 1. Static Twinkling Stars
    const generatedStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.0 + 0.5, 
      opacity: Math.random() * 0.5 + 0.2,
      twinkleSpeed: Math.random() * 4 + 2,
    }));

    // 2. FULL SCREEN Shooting Stars
    const generatedTrails = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      // MASSIVE SPREAD: Spawns from way above the screen, all the way down to the bottom!
      top: Math.random() * 200 - 50,   // -50vh to 150vh (covers the whole vertical height)
      left: Math.random() * 300 - 150, // -150vw to 150vw (spawns far left so they sweep across the bottom)
      delay: Math.random() * 6,
      duration: Math.random() * 3 + 2, 
      tailLength: Math.random() * 100 + 70, 
      color: meteorColors[Math.floor(Math.random() * meteorColors.length)], 
    }));

    setStars(generatedStars);
    setTrails(generatedTrails);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      
      {/* Deep Blue Night Sky Gradient */}
      <div 
        className="absolute inset-0" 
        style={{
          background: "linear-gradient(to bottom, #091221 0%, #03060a 50%, #000000 100%)"
        }}
      />

      {/* Static Twinkling Stars */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white"
          style={{
            top: `${star.y}%`,
            left: `${star.x}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 2, star.opacity],
          }}
          transition={{
            duration: star.twinkleSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Shooting Stars */}
      {trails.map((m) => (
        <motion.div
          key={`trail-${m.id}`}
          className="absolute flex items-center"
          style={{
            top: `${m.top}vh`,
            left: `${m.left}vw`,
            rotate: "40deg",
            willChange: "transform",
          }}
          initial={{ opacity: 0, x: -100 }}
          animate={{
            opacity: [0, 1, 0], 
            // Travels 3000px so even the ones starting way off-screen have time to cross it
            x: [0, 3000], 
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            delay: m.delay,
            ease: "linear", 
          }}
        >
          {/* Colorful Fading Tail */}
          <div
            className={`h-[1px] bg-gradient-to-r ${m.color}`}
            style={{ width: `${m.tailLength}px` }}
          />
          {/* Glowing head */}
          <div 
            className="w-[1.5px] h-[1.5px] rounded-full bg-white" 
            style={{ boxShadow: "0 0 5px 1px rgba(255,255,255,0.8)" }}
          />
        </motion.div>
      ))}
    </div>
  );
}