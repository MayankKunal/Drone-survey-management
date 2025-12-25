'use client'

import { useEffect, useState } from 'react'
import { Battery, MapPin, Activity } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import api from '@/lib/api'

interface Drone {
  id: string
  name: string
  model: string
  status: string
  battery_level: number
  location_lat: number
  location_lng: number
}

export default function FleetPage() {
  const [drones, setDrones] = useState<Drone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrones()
    
    // Set up WebSocket for real-time updates
    const socket: Socket = io('http://localhost:5000')
    
    socket.on('drone-update', (updatedDrone: Drone) => {
      setDrones(prev => prev.map(d => d.id === updatedDrone.id ? updatedDrone : d))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchDrones = async () => {
    try {
      const response = await api.get('/drones')
      setDrones(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching drones:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'in-mission':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'text-green-600'
    if (level > 30) return 'text-yellow-600'
    return 'text-red-600'
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="mt-2 text-gray-600">Monitor and manage your drone fleet</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {drones.map((drone) => (
          <div key={drone.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{drone.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(drone.status)}`}>
                {drone.status}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="text-sm font-medium text-gray-900">{drone.model || 'N/A'}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Battery className={`h-5 w-5 ${getBatteryColor(drone.battery_level)} mr-2`} />
                  <span className="text-sm text-gray-600">Battery</span>
                </div>
                <span className={`text-sm font-semibold ${getBatteryColor(drone.battery_level)}`}>
                  {drone.battery_level}%
                </span>
              </div>

              {drone.location_lat && drone.location_lng && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{drone.location_lat.toFixed(4)}, {drone.location_lng.toFixed(4)}</span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getBatteryColor(drone.battery_level).replace('text-', 'bg-')}`}
                    style={{ width: `${drone.battery_level}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {drones.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drones</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding drones to your fleet.</p>
        </div>
      )}
    </div>
  )
}

