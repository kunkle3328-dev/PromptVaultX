"use client";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useSystemStore } from "@/lib/store";

export function GalaxyCanvas() {
  const { executionState } = useSystemStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    
    const noise = (x: number, y: number) => {
      return Math.sin(x) * Math.cos(y);
    };

    const particles = Array.from({ length: 300 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: 0,
      vy: 0,
      size: Math.random() * 1.5 + 0.5,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    let time = 0;
    const draw = () => {
      time += 0.01;
      ctx.fillStyle = "rgba(5, 5, 5, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let force = 0.1;
      let color = "#ffffff";
      if (executionState === 'thinking') { force = 0.6; color = "#00f6ff"; }
      else if (executionState === 'executing') { force = 1.4; color = "#00f6ff"; }
      else if (executionState === 'error') { force = 0.8; color = "#ff0033"; }

      particles.forEach((p) => {
        const angle = noise(p.x * 0.005 + time, p.y * 0.005 + time) * Math.PI * 2;
        
        p.vx += Math.cos(angle) * force + (Math.random() - 0.5) * 0.2;
        p.vy += Math.sin(angle) * force + (Math.random() - 0.5) * 0.2;

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.92;
        p.vy *= 0.92;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (force > 0.2 ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [executionState]);

  const getCanvasStyles = () => {
    switch (executionState) {
      case 'thinking': return { cyan: 0.15, red: 0.02 };
      case 'executing': return { cyan: 0.3, red: 0.02 };
      case 'error': return { cyan: 0.02, red: 0.3 };
      default: return { cyan: 0.05, red: 0.04 };
    }
  };

  const styles = getCanvasStyles();

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none">
      <motion.div 
        animate={{ opacity: styles.cyan, scale: executionState === 'executing' ? 1.5 : 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00f6ff] blur-[120px]" 
      />
      <motion.div 
        animate={{ opacity: styles.red, scale: executionState === 'error' ? 2 : 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ff0033] blur-[150px]" 
      />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #222 1px, transparent 0)', backgroundSize: '40px 40px', opacity: 0.5 }} />
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
    </div>
  );
}
