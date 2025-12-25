/**
 * Generate waypoints for different flight patterns
 */

function generateWaypoints(surveyArea, patternType = 'grid', options = {}) {
  const { altitude = 50, overlap = 70 } = options;

  // Extract bounds from survey area
  const bounds = getBounds(surveyArea);
  if (!bounds) return [];

  switch (patternType) {
    case 'grid':
      return generateGridPattern(bounds, altitude, overlap);
    case 'crosshatch':
      return generateCrosshatchPattern(bounds, altitude, overlap);
    case 'perimeter':
      return generatePerimeterPattern(bounds, altitude);
    default:
      return generateGridPattern(bounds, altitude, overlap);
  }
}

function getBounds(surveyArea) {
  if (Array.isArray(surveyArea) && surveyArea.length > 0) {
    // Array of coordinates
    const lats = surveyArea.map(p => {
      const lat = p.lat !== undefined ? p.lat : (Array.isArray(p) ? p[0] : null);
      if (lat === null || isNaN(lat)) {
        throw new Error(`Invalid latitude in point: ${JSON.stringify(p)}`);
      }
      return lat;
    });
    
    const lngs = surveyArea.map(p => {
      const lng = p.lng !== undefined ? p.lng : (Array.isArray(p) ? p[1] : null);
      if (lng === null || isNaN(lng)) {
        throw new Error(`Invalid longitude in point: ${JSON.stringify(p)}`);
      }
      return lng;
    });

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Validate that we have a valid area (not all points the same)
    if (minLat === maxLat && minLng === maxLng) {
      throw new Error('All survey area points are the same. Please define a valid area.');
    }

    // Ensure minimum area size
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    if (latRange < 0.0001 && lngRange < 0.0001) {
      throw new Error('Survey area is too small. Please define a larger area.');
    }

    return {
      minLat,
      maxLat,
      minLng,
      maxLng,
      points: surveyArea
    };
  }
  return null;
}

function generateGridPattern(bounds, altitude, overlap) {
  const waypoints = [];
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;

  // Ensure we have valid ranges
  if (latRange <= 0 || lngRange <= 0) {
    throw new Error('Invalid bounds: latRange or lngRange is zero or negative');
  }

  // Calculate spacing based on overlap percentage
  // Higher overlap = smaller spacing
  const spacingFactor = (100 - overlap) / 100;
  const latSpacing = Math.max(latRange * spacingFactor * 0.1, 0.0001);
  const lngSpacing = Math.max(lngRange * spacingFactor * 0.1, 0.0001);

  const latSteps = Math.max(3, Math.ceil(latRange / latSpacing));
  const lngSteps = Math.max(3, Math.ceil(lngRange / lngSpacing));

  for (let i = 0; i <= latSteps; i++) {
    const lat = bounds.minLat + (latRange * i / latSteps);
    const isEvenRow = i % 2 === 0;

    for (let j = 0; j <= lngSteps; j++) {
      const lng = isEvenRow 
        ? bounds.minLng + (lngRange * j / lngSteps)
        : bounds.maxLng - (lngRange * j / lngSteps);

      waypoints.push({
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        altitude: altitude
      });
    }
  }

  return waypoints;
}

function generateCrosshatchPattern(bounds, altitude, overlap) {
  const waypoints = [];
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;

  const spacingFactor = (100 - overlap) / 100;
  const spacing = Math.min(latRange, lngRange) * spacingFactor * 0.1;
  const steps = Math.max(5, Math.ceil(Math.max(latRange, lngRange) / spacing));

  // First pass: diagonal from bottom-left to top-right
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = bounds.minLat + (latRange * t);
    const lng = bounds.minLng + (lngRange * t);
    
    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      altitude: altitude
    });
  }

  // Second pass: diagonal from top-left to bottom-right
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = bounds.maxLat - (latRange * t);
    const lng = bounds.minLng + (lngRange * t);
    
    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      altitude: altitude
    });
  }

  return waypoints;
}

function generatePerimeterPattern(bounds, altitude) {
  const waypoints = [];
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;
  const steps = 20; // Number of waypoints around perimeter

  // Top edge
  for (let i = 0; i <= steps / 4; i++) {
    const lng = bounds.minLng + (lngRange * i / (steps / 4));
    waypoints.push({
      lat: parseFloat(bounds.maxLat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      altitude: altitude
    });
  }

  // Right edge
  for (let i = 1; i <= steps / 4; i++) {
    const lat = bounds.maxLat - (latRange * i / (steps / 4));
    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(bounds.maxLng.toFixed(6)),
      altitude: altitude
    });
  }

  // Bottom edge
  for (let i = 1; i <= steps / 4; i++) {
    const lng = bounds.maxLng - (lngRange * i / (steps / 4));
    waypoints.push({
      lat: parseFloat(bounds.minLat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      altitude: altitude
    });
  }

  // Left edge
  for (let i = 1; i < steps / 4; i++) {
    const lat = bounds.minLat + (latRange * i / (steps / 4));
    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(bounds.minLng.toFixed(6)),
      altitude: altitude
    });
  }

  return waypoints;
}

module.exports = {
  generateWaypoints
};

