'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download } from 'lucide-react'
import api from '@/lib/api'

interface Survey {
  id: string
  mission_name: string
  drone_name: string
  duration: number
  distance_covered: number
  coverage_area: number
  completed_at: string
}

interface Analytics {
  overview: {
    total_surveys: number
    total_duration: number
    total_distance: number
    total_coverage: number
    avg_duration: number
    avg_distance: number
  }
  monthly_stats: Array<{
    month: string
    count: number
    total_duration: number
  }>
}

export default function ReportsPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [surveysRes, analyticsRes] = await Promise.all([
        api.get('/surveys'),
        api.get('/surveys/analytics/overview')
      ])
      setSurveys(surveysRes.data)
      setAnalytics(analyticsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDistance = (meters: number) => {
    if (!meters) return '0m'
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)}km`
    return `${meters.toFixed(0)}m`
  }

  const exportToCSV = () => {
    if (surveys.length === 0) return

    const headers = ['Mission Name', 'Drone', 'Duration (seconds)', 'Distance (meters)', 'Coverage Area (m²)', 'Completed At']
    const rows = surveys.map(survey => [
      survey.mission_name || 'N/A',
      survey.drone_name || 'N/A',
      survey.duration || 0,
      survey.distance_covered || 0,
      survey.coverage_area || 0,
      new Date(survey.completed_at).toLocaleString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `survey-reports-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Survey Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive survey statistics and analytics</p>
        </div>
        {surveys.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        )}
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Surveys</h3>
            <p className="text-3xl font-semibold text-gray-900">{analytics.overview.total_surveys || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Duration</h3>
            <p className="text-3xl font-semibold text-gray-900">{formatDuration(analytics.overview.total_duration || 0)}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Distance</h3>
            <p className="text-3xl font-semibold text-gray-900">{formatDistance(analytics.overview.total_distance || 0)}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Duration</h3>
            <p className="text-3xl font-semibold text-gray-900">{formatDuration(analytics.overview.avg_duration || 0)}</p>
          </div>
        </div>
      )}

      {analytics && analytics.monthly_stats && analytics.monthly_stats.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Survey Statistics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthly_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0ea5e9" name="Number of Surveys" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Survey History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {survey.mission_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.drone_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(survey.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistance(survey.distance_covered)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.coverage_area ? `${survey.coverage_area.toFixed(2)} m²` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(survey.completed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {surveys.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No surveys completed yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

