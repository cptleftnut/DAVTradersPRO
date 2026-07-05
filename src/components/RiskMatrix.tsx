import { motion } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const sectorData = [
  { subject: 'Teknologi', A: 120, fullMark: 150 },
  { subject: 'Finans', A: 98, fullMark: 150 },
  { subject: 'Energi', A: 86, fullMark: 150 },
  { subject: 'Sundhed', A: 99, fullMark: 150 },
  { subject: 'Forbrug', A: 85, fullMark: 150 },
  { subject: 'Krypto', A: 65, fullMark: 150 },
];

export function RiskMatrix() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800"
    >
      <h3 className="text-xs font-bold mb-6 text-gray-400 uppercase tracking-widest">Sektor Eksponering & Risikovurdering Matrix</h3>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="w-full h-64 lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sectorData}>
              <PolarGrid stroke="var(--color-gray-700)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-gray-400)', fontSize: 10, fontFamily: 'monospace' }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <Radar name="Eksponering" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full lg:w-1/2">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gray-950/80 rounded-2xl border border-gray-800/80 transition-colors hover:border-cyan-900/50"
          >
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Volatilitet</p>
              <p className="text-lg font-mono text-cyan-400">Moderat Høj</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gray-950/80 rounded-2xl border border-gray-800/80 transition-colors hover:border-emerald-900/50"
          >
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Likviditet</p>
              <p className="text-lg font-mono text-emerald-400">Institutionel</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
