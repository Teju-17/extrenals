import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ExplainabilityBar({ influencer }) {
  const data = [
    { name: 'Profile', contribution: Number((influencer.avg_profile_score * 100).toFixed(2)) },
    { name: 'Engagement', contribution: Number((influencer.avg_engagement_score * 100).toFixed(2)) },
    { name: 'Temporal', contribution: Number((influencer.avg_temporal_score * 100).toFixed(2)) },
  ]

  return (
    <div className="h-72 rounded-xl bg-slate-900 p-4">
      <h3 className="mb-2 text-sm text-slate-300">Risk Component Contributions (%)</h3>
      <ResponsiveContainer width="100%" height="95%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip />
          <Bar dataKey="contribution" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
