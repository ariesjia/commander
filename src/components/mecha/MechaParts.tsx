"use client";

import { motion } from "framer-motion";

const partVariant = {
  hidden: { opacity: 0, scale: 0.5, y: -30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 15 } },
};

export function MechaGhost() {
  return (
    <g opacity={0.15} stroke="#00D4FF" strokeWidth={1} fill="none" strokeDasharray="4 4">
      <rect x={85} y={100} width={30} height={50} rx={4} />
      <rect x={80} y={150} width={40} height={60} rx={4} />
      <rect x={60} y={155} width={20} height={50} rx={3} />
      <rect x={120} y={155} width={20} height={50} rx={3} />
      <rect x={82} y={210} width={16} height={55} rx={3} />
      <rect x={102} y={210} width={16} height={55} rx={3} />
      <rect x={84} y={265} width={14} height={20} rx={4} />
      <rect x={102} y={265} width={14} height={20} rx={4} />
    </g>
  );
}

export function Feet() {
  return (
    <motion.g variants={partVariant} initial="hidden" animate="visible">
      {/* Left foot */}
      <rect x={78} y={265} width={20} height={14} rx={4} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
      <rect x={74} y={275} width={28} height={8} rx={3} fill="#2A3A55" stroke="#00D4FF" strokeWidth={0.5} />
      {/* Right foot */}
      <rect x={102} y={265} width={20} height={14} rx={4} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
      <rect x={98} y={275} width={28} height={8} rx={3} fill="#2A3A55" stroke="#00D4FF" strokeWidth={0.5} />
    </motion.g>
  );
}

export function Legs() {
  return (
    <motion.g variants={partVariant} initial="hidden" animate="visible">
      {/* Left leg */}
      <rect x={82} y={215} width={16} height={52} rx={4} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
      <circle cx={90} cy={225} r={3} fill="#00D4FF" opacity={0.4} />
      <rect x={84} y={240} width={12} height={3} rx={1} fill="#00D4FF" opacity={0.3} />
      {/* Right leg */}
      <rect x={102} y={215} width={16} height={52} rx={4} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
      <circle cx={110} cy={225} r={3} fill="#00D4FF" opacity={0.4} />
      <rect x={104} y={240} width={12} height={3} rx={1} fill="#00D4FF" opacity={0.3} />
      {/* Hip joint */}
      <rect x={86} y={210} width={28} height={10} rx={3} fill="#4A5F80" stroke="#00D4FF" strokeWidth={0.5} />
    </motion.g>
  );
}

export function Torso({ showCore }: { showCore: boolean }) {
  return (
    <motion.g variants={partVariant} initial="hidden" animate="visible">
      {/* Main body */}
      <path
        d="M78 155 L80 148 L120 148 L122 155 L125 210 L75 210 Z"
        fill="#3B4C6B"
        stroke="#00D4FF"
        strokeWidth={0.5}
      />
      {/* Chest plate */}
      <path
        d="M85 155 L100 148 L115 155 L112 185 L88 185 Z"
        fill="#4A5F80"
        stroke="#00D4FF"
        strokeWidth={0.5}
      />
      {/* Energy core */}
      {showCore && (
        <g className="animate-energy-pulse">
          <circle cx={100} cy={170} r={8} fill="#00D4FF" opacity={0.3} />
          <circle cx={100} cy={170} r={5} fill="#00D4FF" opacity={0.6} />
          <circle cx={100} cy={170} r={2.5} fill="#ffffff" opacity={0.9} />
        </g>
      )}
      {/* Armor lines */}
      <line x1={85} y1={190} x2={115} y2={190} stroke="#00D4FF" strokeWidth={0.5} opacity={0.3} />
      <line x1={87} y1={200} x2={113} y2={200} stroke="#00D4FF" strokeWidth={0.5} opacity={0.3} />
    </motion.g>
  );
}

export function LeftArm() {
  return (
    <motion.g variants={partVariant} initial="hidden" animate="visible">
      {/* Shoulder */}
      <circle cx={68} cy={155} r={10} fill="#4A5F80" stroke="#00D4FF" strokeWidth={0.5} />
      <circle cx={68} cy={155} r={4} fill="#00D4FF" opacity={0.3} />
      {/* Upper arm */}
      <rect x={60} y={163} width={16} height={28} rx={4} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
      {/* Forearm */}
      <rect x={58} y={193} width={18} height={30} rx={4} fill="#4A5F80" stroke="#00D4FF" strokeWidth={0.5} />
      {/* Hand */}
      <rect x={60} y={223} width={14} height={10} rx={3} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
    </motion.g>
  );
}

export function RightArm() {
  return (
    <motion.g variants={partVariant} initial="hidden" animate="visible">
      {/* Shoulder */}
      <circle cx={132} cy={155} r={10} fill="#4A5F80" stroke="#00D4FF" strokeWidth={0.5} />
      <circle cx={132} cy={155} r={4} fill="#FF6B00" opacity={0.4} />
      {/* Upper arm */}
      <rect x={124} y={163} width={16} height={28} rx={4} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
      {/* Forearm + weapon */}
      <rect x={122} y={193} width={20} height={30} rx={4} fill="#4A5F80" stroke="#FF6B00" strokeWidth={0.5} />
      {/* Cannon barrel */}
      <rect x={126} y={185} width={12} height={6} rx={2} fill="#FF6B00" opacity={0.7} />
      <rect x={130} y={178} width={4} height={10} rx={1} fill="#FF6B00" opacity={0.5} />
      {/* Hand */}
      <rect x={125} y={223} width={14} height={10} rx={3} fill="#3B4C6B" stroke="#00D4FF" strokeWidth={0.5} />
    </motion.g>
  );
}

export function Head({ showEyes }: { showEyes: boolean }) {
  return (
    <motion.g variants={partVariant} initial="hidden" animate="visible">
      {/* Neck */}
      <rect x={93} y={138} width={14} height={12} rx={3} fill="#4A5F80" />
      {/* Head shape */}
      <path
        d="M82 105 L84 95 L92 88 L108 88 L116 95 L118 105 L120 130 L115 140 L85 140 L80 130 Z"
        fill="#3B4C6B"
        stroke="#00D4FF"
        strokeWidth={0.5}
      />
      {/* Face plate */}
      <path
        d="M88 100 L100 94 L112 100 L113 125 L110 132 L90 132 L87 125 Z"
        fill="#2A3A55"
        stroke="#00D4FF"
        strokeWidth={0.5}
      />
      {/* Antenna */}
      <line x1={90} y1={88} x2={85} y2={78} stroke="#00D4FF" strokeWidth={1} />
      <circle cx={85} cy={77} r={2} fill="#00D4FF" opacity={0.6} />
      <line x1={110} y1={88} x2={115} y2={78} stroke="#00D4FF" strokeWidth={1} />
      <circle cx={115} cy={77} r={2} fill="#00D4FF" opacity={0.6} />
      {/* Eyes */}
      {showEyes && (
        <g className="animate-energy-pulse">
          <ellipse cx={94} cy={112} rx={4} ry={3} fill="#00D4FF" />
          <ellipse cx={106} cy={112} rx={4} ry={3} fill="#00D4FF" />
          <ellipse cx={94} cy={112} rx={2} ry={1.5} fill="#ffffff" opacity={0.8} />
          <ellipse cx={106} cy={112} rx={2} ry={1.5} fill="#ffffff" opacity={0.8} />
        </g>
      )}
      {/* Mouth/vent */}
      <rect x={94} y={122} width={12} height={4} rx={1} fill="#00D4FF" opacity={0.2} />
    </motion.g>
  );
}

export function PaintOverlay() {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Accent stripes on torso */}
      <rect x={88} y={155} width={24} height={2} rx={1} fill="#FF6B00" opacity={0.6} />
      <rect x={90} y={198} width={20} height={2} rx={1} fill="#FF6B00" opacity={0.6} />
      {/* Shoulder accents */}
      <circle cx={68} cy={155} r={6} fill="none" stroke="#FF6B00" strokeWidth={1} opacity={0.4} />
      <circle cx={132} cy={155} r={6} fill="none" stroke="#FF6B00" strokeWidth={1} opacity={0.4} />
      {/* Leg stripes */}
      <rect x={84} y={250} width={12} height={2} rx={1} fill="#FF6B00" opacity={0.5} />
      <rect x={104} y={250} width={12} height={2} rx={1} fill="#FF6B00" opacity={0.5} />
    </motion.g>
  );
}

export function ScatteredParts() {
  return (
    <g opacity={0.4}>
      <rect x={30} y={250} width={18} height={8} rx={2} fill="#3B4C6B" transform="rotate(-15 39 254)" />
      <rect x={150} y={240} width={14} height={14} rx={2} fill="#3B4C6B" transform="rotate(20 157 247)" />
      <circle cx={45} cy={200} r={5} fill="#4A5F80" />
      <rect x={155} y={180} width={10} height={20} rx={2} fill="#3B4C6B" transform="rotate(10 160 190)" />
      <rect x={25} y={160} width={12} height={6} rx={2} fill="#4A5F80" transform="rotate(-25 31 163)" />
      <circle cx={165} cy={150} r={4} fill="#3B4C6B" />
    </g>
  );
}
