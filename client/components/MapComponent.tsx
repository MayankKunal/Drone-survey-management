'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Waypoint {
  id?: string
  sequence_number?: number
  latitude: number
  longitude: number
  altitude?: number
  reached?: boolean
}

interface MapComponentProps {
  surveyArea?: Array<{ lat: number; lng: number }>
  waypoints?: Waypoint[]
  mode?: 'view' | 'draw'
  onSurveyAreaChange?: (area: Array<{ lat: number; lng: number }>) => void
  showControls?: boolean
}

function MapClickHandler({ onSurveyAreaChange, mode, currentArea }: { 
  onSurveyAreaChange?: (area: Array<{ lat: number; lng: number }>) => void, 
  mode?: string,
  currentArea?: Array<{ lat: number; lng: number }>
}) {
  const map = useMap()
  const areaRef = useRef<Array<{ lat: number; lng: number }>>(currentArea || [])

  // Sync with parent state
  useEffect(() => {
    if (currentArea) {
      areaRef.current = [...currentArea]
    }
  }, [currentArea])

  useEffect(() => {
    if (mode !== 'draw' || !onSurveyAreaChange) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('Invalid coordinates:', { lat, lng })
        return
      }

      const newPoint = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) }
      const currentPoints = areaRef.current
      console.log('Map clicked, adding point:', newPoint, 'Current area length:', currentPoints.length)

      // Check if clicking near the first point (close polygon) - only if we have 3+ points
      if (currentPoints.length >= 3) {
        const firstPoint = currentPoints[0]
        const distance = Math.sqrt(
          Math.pow(lat - firstPoint.lat, 2) + Math.pow(lng - firstPoint.lng, 2)
        )
        // Increased threshold for easier closing (about 1km at equator)
        if (distance < 0.01) {
          // Keep the polygon closed (don't clear, just don't add duplicate point)
          console.log('Polygon already closed with', currentPoints.length, 'points')
          return
        }
      }

      // Add new point
      const updatedArea = [...currentPoints, newPoint]
      areaRef.current = updatedArea
      console.log('Updated area, total points:', updatedArea.length)
      onSurveyAreaChange(updatedArea)
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onSurveyAreaChange, mode])

  return null
}

export default function MapComponent({ surveyArea = [], waypoints = [], mode = 'view', onSurveyAreaChange }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Default center (San Francisco)
  const center: [number, number] = surveyArea.length > 0
    ? [surveyArea[0].lat, surveyArea[0].lng]
    : [37.7749, -122.4194]

  const waypointPositions: [number, number][] = waypoints.map(wp => [wp.latitude, wp.longitude])

  return (
    <MapContainer
      center={center}
      zoom={surveyArea.length > 0 ? 15 : 13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {mode === 'draw' && (
        <MapClickHandler 
          onSurveyAreaChange={onSurveyAreaChange} 
          mode={mode} 
          currentArea={surveyArea}
        />
      )}

      {surveyArea.length >= 3 && (
        <Polygon
          positions={surveyArea.map(p => [p.lat, p.lng])}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
        />
      )}

      {waypoints.length > 0 && (
        <>
          <Polyline
            positions={waypointPositions}
            pathOptions={{ color: 'red', weight: 2 }}
          />
          {waypoints.map((wp, index) => (
            <Marker
              key={wp.id || index}
              position={[wp.latitude, wp.longitude]}
            >
              <Popup>
                Waypoint {wp.sequence_number !== undefined ? wp.sequence_number + 1 : index + 1}
                {wp.altitude && <br />}
                {wp.altitude && `Altitude: ${wp.altitude}m`}
                {wp.reached !== undefined && (
                  <>
                    <br />
                    Status: {wp.reached ? 'Reached' : 'Pending'}
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </>
      )}

      {surveyArea.length > 0 && surveyArea.length < 3 && mode === 'draw' && (
        <>
          {surveyArea.map((point, index) => (
            <Marker key={index} position={[point.lat, point.lng]}>
              <Popup>Point {index + 1}</Popup>
            </Marker>
          ))}
        </>
      )}
    </MapContainer>
  )
}

