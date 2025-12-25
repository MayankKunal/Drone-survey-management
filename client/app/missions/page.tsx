'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Play, Pause, Square, MapPin, Clock, Search, Filter, X } from 'lucide-react'
import api from '@/lib/api'

interface Mission {
  id: string
  name: string
  status: string
  progress: number
  drone_name: string
  pattern_type: string
  estimated_duration: number
  created_at: string
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [patternFilter, setPatternFilter] = useState<string>('all')

  useEffect(() => {
    fetchMissions()
  }, [])

  const fetchMissions = async () => {
    try {
      const response = await api.get('/missions')
      setMissions(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching missions:', error)
      setLoading(false)
    }
  }

  const updateMissionStatus = async (missionId: string, status: string) => {
    try {
      await api.patch(`/missions/${missionId}/status`, { status })
      fetchMissions()
    } catch (error) {
      console.error('Error updating mission status:', error)
    }
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Filter missions based on search and filters
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchesSearch = searchQuery === '' || 
        mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mission.drone_name && mission.drone_name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || mission.status === statusFilter
      const matchesPattern = patternFilter === 'all' || mission.pattern_type === patternFilter
      
      return matchesSearch && matchesStatus && matchesPattern
    })
  }, [missions, searchQuery, statusFilter, patternFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPatternFilter('all')
  }

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || patternFilter !== 'all'

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
          <h1 className="text-3xl font-bold text-gray-900">Missions</h1>
          <p className="mt-2 text-gray-600">Plan and manage drone survey missions</p>
        </div>
        <Link
          href="/missions/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          Create Mission
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search missions or drones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="aborted">Aborted</option>
            </select>
          </div>
          <div>
            <select
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Patterns</option>
              <option value="grid">Grid</option>
              <option value="crosshatch">Crosshatch</option>
              <option value="perimeter">Perimeter</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {filteredMissions.length} of {missions.length} missions
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Drone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pattern
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMissions.map((mission) => (
              <tr key={mission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/missions/${mission.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                    {mission.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                    {mission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${mission.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{mission.progress || 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {mission.drone_name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {mission.pattern_type || 'grid'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDuration(mission.estimated_duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {mission.status === 'planned' && (
                      <button
                        onClick={() => updateMissionStatus(mission.id, 'in-progress')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Start"
                      >
                        <Play className="h-5 w-5" />
                      </button>
                    )}
                    {mission.status === 'in-progress' && (
                      <>
                        <button
                          onClick={() => updateMissionStatus(mission.id, 'paused')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Pause"
                        >
                          <Pause className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateMissionStatus(mission.id, 'aborted')}
                          className="text-red-600 hover:text-red-900"
                          title="Abort"
                        >
                          <Square className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {mission.status === 'paused' && (
                      <button
                        onClick={() => updateMissionStatus(mission.id, 'in-progress')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Resume"
                      >
                        <Play className="h-5 w-5" />
                      </button>
                    )}
                    <Link
                      href={`/missions/${mission.id}`}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Details"
                    >
                      <MapPin className="h-5 w-5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMissions.length === 0 && missions.length > 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
          <Filter className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No missions match your filters</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          <div className="mt-6">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {missions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No missions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new mission.</p>
          <div className="mt-6">
            <Link
              href="/missions/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Create Mission
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

