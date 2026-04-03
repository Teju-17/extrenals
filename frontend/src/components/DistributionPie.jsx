import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#22c55e', '#f59e0b', '#ef4444']

export default function DistributionPie({ influencer }) {
  const data = [
    { name: 'Genuine', value: influencer.genuine_count },
    { name: 'Suspicious', value: influencer.suspicious_count },
    { name: 'Bot', value: influencer.bot_count },
  ]

  return (
    <div className="h-72 rounded-xl bg-slate-900 p-4">
      <h3 className="mb-2 text-sm text-slate-300">Follower Classification</h3>
      <ResponsiveContainer width="100%" height="95%">
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={90} label>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
