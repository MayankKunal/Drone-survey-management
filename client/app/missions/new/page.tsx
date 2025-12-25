'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Trash2, Undo2, Save } from 'lucide-react'
import api from '@/lib/api'

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

interface Drone {
  id: string
  name: string
  status: string
}

export default function NewMissionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    drone_id: '',
    pattern_type: 'grid',
    flight_altitude: 50,
    overlap_percentage: 70,
  })
  const [surveyArea, setSurveyArea] = useState<Array<{ lat: number; lng: number }>>([])
  const [surveyAreaHistory, setSurveyAreaHistory] = useState<Array<{ lat: number; lng: number }>[]>([])
  const [drones, setDrones] = useState<Drone[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Mission templates
  const templates = [
    { name: 'Standard Inspection', pattern_type: 'grid', flight_altitude: 50, overlap_percentage: 70 },
    { name: 'High Detail Mapping', pattern_type: 'crosshatch', flight_altitude: 30, overlap_percentage: 85 },
    { name: 'Perimeter Survey', pattern_type: 'perimeter', flight_altitude: 40, overlap_percentage: 60 },
    { name: 'Quick Overview', pattern_type: 'grid', flight_altitude: 80, overlap_percentage: 50 },
  ]

  useEffect(() => {
    fetchAvailableDrones()
  }, [])

  const fetchAvailableDrones = async () => {
    try {
      const response = await api.get('/drones/available/list')
      setDrones(response.data)
    } catch (error: any) {
      setError('Failed to load drones. Please try again.')
      console.error('Error fetching drones:', error)
    }
  }

  const handleSurveyAreaChange = (area: Array<{ lat: number; lng: number }>) => {
    setSurveyAreaHistory([...surveyAreaHistory, surveyArea])
    setSurveyArea(area)
  }

  const clearSurveyArea = () => {
    if (surveyArea.length > 0) {
      setSurveyAreaHistory([...surveyAreaHistory, surveyArea])
      setSurveyArea([])
      setError('')
    }
  }

  const undoLastPoint = () => {
    if (surveyAreaHistory.length > 0) {
      const previous = surveyAreaHistory[surveyAreaHistory.length - 1]
      setSurveyArea(previous)
      setSurveyAreaHistory(surveyAreaHistory.slice(0, -1))
    } else if (surveyArea.length > 0) {
      const newArea = surveyArea.slice(0, -1)
      setSurveyArea(newArea)
    }
  }

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData({
      ...formData,
      pattern_type: template.pattern_type,
      flight_altitude: template.flight_altitude,
      overlap_percentage: template.overlap_percentage,
    })
    setSuccess(`Applied "${template.name}" template`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('Mission name is required')
      return
    }

    if (surveyArea.length < 3) {
      setError('Please define a survey area with at least 3 points on the map')
      return
    }

    if (formData.flight_altitude < 10 || formData.flight_altitude > 120) {
      setError('Flight altitude must be between 10 and 120 meters')
      return
    }

    setLoading(true)
    try {
      console.log('Submitting mission:', { formData, surveyArea })
      const response = await api.post('/missions', {
        ...formData,
        survey_area: surveyArea,
      })
      console.log('Mission created:', response.data)
      setSuccess('Mission created successfully!')
      setTimeout(() => {
        router.push(`/missions/${response.data.id}`)
      }, 1000)
    } catch (error: any) {
      console.error('Error creating mission:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create mission. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Mission</h1>
        <p className="mt-2 text-gray-600">Plan a new drone survey mission</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Define Survey Area</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click on the map to define the survey area. You need at least 3 points. 
              {surveyArea.length > 0 && surveyArea.length < 3 && (
                <span className="text-orange-600 font-medium ml-2">
                  ({3 - surveyArea.length} more point{3 - surveyArea.length !== 1 ? 's' : ''} needed)
                </span>
              )}
            </p>
            <div className="relative">
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapComponent
                  surveyArea={surveyArea}
                  onSurveyAreaChange={handleSurveyAreaChange}
                  mode="draw"
                />
              </div>
              {surveyArea.length > 0 && (
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    type="button"
                    onClick={undoLastPoint}
                    className="bg-white shadow-md rounded-md p-2 hover:bg-gray-50 transition-colors"
                    title="Undo last point"
                  >
                    <Undo2 className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={clearSurveyArea}
                    className="bg-white shadow-md rounded-md p-2 hover:bg-gray-50 transition-colors"
                    title="Clear all points"
                  >
                    <Trash2 className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            {surveyArea.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {surveyArea.length} point{surveyArea.length !== 1 ? 's' : ''} defined
                  {surveyArea.length >= 3 && <span className="ml-2 text-green-600 font-medium">✓ Ready to create mission</span>}
                  {surveyArea.length < 3 && (
                    <span className="ml-2 text-orange-600 font-medium">
                      ({3 - surveyArea.length} more point{3 - surveyArea.length !== 1 ? 's' : ''} needed)
                    </span>
                  )}
                </p>
                {surveyArea.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Polygon is already complete with 3+ points
                      setSuccess('Survey area is ready!')
                      setTimeout(() => setSuccess(''), 2000)
                    }}
                    className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200"
                  >
                    Area Complete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Mission Templates */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Templates</h2>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="text-left p-3 border border-gray-200 rounded-md hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.pattern_type} • {template.flight_altitude}m • {template.overlap_percentage}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Site A Inspection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Drone
              </label>
              <select
                value={formData.drone_id}
                onChange={(e) => setFormData({ ...formData, drone_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a drone</option>
                {drones.map((drone) => (
                  <option key={drone.id} value={drone.id}>
                    {drone.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flight Pattern
              </label>
              <select
                value={formData.pattern_type}
                onChange={(e) => setFormData({ ...formData, pattern_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="grid">Grid Pattern</option>
                <option value="crosshatch">Crosshatch Pattern</option>
                <option value="perimeter">Perimeter Pattern</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.pattern_type === 'grid' && 'Systematic grid coverage'}
                {formData.pattern_type === 'crosshatch' && 'Diagonal crosshatch pattern'}
                {formData.pattern_type === 'perimeter' && 'Perimeter/boundary survey'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flight Altitude (meters)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={formData.flight_altitude}
                onChange={(e) => setFormData({ ...formData, flight_altitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overlap Percentage: {formData.overlap_percentage}%
              </label>
              <input
                type="range"
                min="50"
                max="90"
                value={formData.overlap_percentage}
                onChange={(e) => setFormData({ ...formData, overlap_percentage: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Higher overlap ensures better coverage but requires more waypoints
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || surveyArea.length < 3}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Mission'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

