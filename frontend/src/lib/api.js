import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export async function analyzeCsv(file) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await axios.post(`${API_BASE}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data
}
