
import React from 'react';

interface StatCardProps {
  value: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl text-center shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div className="text-4xl font-bold text-indigo-600 mb-1">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

interface StatsProps {
  total: number;
  sectionA: number;
  sectionB: number;
  filtered: number;
}

const Stats: React.FC<StatsProps> = ({ total, sectionA, sectionB, filtered }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <StatCard value={total} label="Total Questions Logged" />
      <StatCard value={sectionA} label="Section A Questions" />
      <StatCard value={sectionB} label="Section B Questions" />
      <StatCard value={filtered} label="Filtered Questions" />
    </div>
  );
};

export default Stats;
