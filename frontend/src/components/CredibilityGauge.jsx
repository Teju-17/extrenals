import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function CredibilityGauge({ score }) {
  const percentage = Math.round(score * 100)
  const data = [
    { name: 'Credibility', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ]

  const color = percentage >= 60 ? '#22c55e' : percentage >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="h-56 rounded-xl bg-slate-900 p-4">
      <h3 className="mb-2 text-sm text-slate-300">Credibility Gauge</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            cx="50%"
            cy="90%"
            innerRadius={60}
            outerRadius={85}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#1e293b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <p className="-mt-12 text-center text-2xl font-semibold text-white">{percentage}%</p>
    </div>
  )
}
