'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Play, Pause, Square, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { io, Socket } from 'socket.io-client'

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

interface Waypoint {
  id: string
  sequence_number: number
  latitude: number
  longitude: number
  altitude: number
  reached: boolean
}

interface Mission {
  id: string
  name: string
  status: string
  progress: number
  pattern_type: string
  flight_altitude: number
  overlap_percentage: number
  estimated_duration: number
  waypoints: Waypoint[]
  survey_area: Array<{ lat: number; lng: number }>
  drone_name: string
}

export default function MissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    fetchMission()

    // Set up WebSocket connection
    const newSocket = io('http://localhost:5000')
    newSocket.emit('subscribe-mission', params.id)
    
    newSocket.on('mission-update', (updatedMission: Mission) => {
      // Ensure waypoints is always an array
      if (updatedMission.waypoints && !Array.isArray(updatedMission.waypoints)) {
        updatedMission.waypoints = []
      }
      setMission(updatedMission)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [params.id])

  const fetchMission = async () => {
    try {
      const response = await api.get(`/missions/${params.id}`)
      const missionData = response.data
      // Ensure waypoints is always an array
      if (missionData.waypoints && !Array.isArray(missionData.waypoints)) {
        missionData.waypoints = []
      }
      setMission(missionData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching mission:', error)
      setLoading(false)
    }
  }

  const updateMissionStatus = async (status: string) => {
    try {
      await api.patch(`/missions/${mission!.id}/status`, { status })
      fetchMission()
    } catch (error) {
      console.error('Error updating mission status:', error)
    }
  }

  const simulateProgress = () => {
    if (!mission || mission.status !== 'in-progress') return
    const waypoints = Array.isArray(mission.waypoints) ? mission.waypoints : []

    const interval = setInterval(async () => {
      if (mission.progress < 100) {
        const newProgress = Math.min(100, mission.progress + 2)
        const currentWaypoint = waypoints.length > 0 
          ? Math.floor((newProgress / 100) * waypoints.length)
          : 0

        try {
          await api.patch(`/missions/${mission.id}/progress`, {
            progress: newProgress,
            current_waypoint: currentWaypoint
          })
        } catch (error) {
          console.error('Error updating progress:', error)
        }
      } else {
        clearInterval(interval)
        updateMissionStatus('completed')
      }
    }, 2000)

    return () => clearInterval(interval)
  }

  useEffect(() => {
    if (mission?.status === 'in-progress' && mission.progress < 100) {
      const cleanup = simulateProgress()
      return cleanup
    }
  }, [mission?.status, mission?.progress])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Mission not found</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-100 text-gray-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'aborted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Missions
      </button>

      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mission.name}</h1>
            <p className="mt-2 text-gray-600">Mission ID: {mission.id}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mission.status)}`}>
            {mission.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Progress</h3>
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${mission.progress || 0}%` }}
              />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{mission.progress || 0}%</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Waypoints</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {Array.isArray(mission.waypoints) ? mission.waypoints.length : 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {Array.isArray(mission.waypoints) 
              ? mission.waypoints.filter((w: Waypoint) => w.reached).length 
              : 0} reached
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Estimated Duration</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {Math.floor((mission.estimated_duration || 0) / 60)}m {((mission.estimated_duration || 0) % 60)}s
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mission Map</h2>
            <div className="h-96 rounded-lg overflow-hidden border">
              <MapComponent
                surveyArea={Array.isArray(mission.survey_area) ? mission.survey_area : []}
                waypoints={Array.isArray(mission.waypoints) ? mission.waypoints : []}
                mode="view"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mission Control</h2>
            <div className="space-y-3">
              {mission.status === 'planned' && (
                <button
                  onClick={() => updateMissionStatus('in-progress')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Mission
                </button>
              )}
              {mission.status === 'in-progress' && (
                <>
                  <button
                    onClick={() => updateMissionStatus('paused')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause Mission
                  </button>
                  <button
                    onClick={() => updateMissionStatus('aborted')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Abort Mission
                  </button>
                </>
              )}
              {mission.status === 'paused' && (
                <button
                  onClick={() => updateMissionStatus('in-progress')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume Mission
                </button>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mission Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Drone</dt>
                <dd className="text-sm text-gray-900">{mission.drone_name || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pattern Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{mission.pattern_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Flight Altitude</dt>
                <dd className="text-sm text-gray-900">{mission.flight_altitude}m</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Overlap Percentage</dt>
                <dd className="text-sm text-gray-900">{mission.overlap_percentage}%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

