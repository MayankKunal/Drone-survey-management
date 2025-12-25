# Troubleshooting Guide

## Mission Creation Issues

### Problem: Cannot create a mission

#### Check 1: Survey Area
- **Requirement**: You need at least 3 points to define a survey area
- **How to add points**: Click on the map to add points
- **Visual feedback**: 
  - Points appear as markers on the map
  - Counter shows how many points you've added
  - Green checkmark appears when you have 3+ points

#### Check 2: Form Validation
- **Mission Name**: Required field, cannot be empty
- **Flight Altitude**: Must be between 10 and 120 meters
- **Survey Area**: Must have at least 3 points

#### Check 3: Server Connection
1. Make sure the backend server is running on port 5000
2. Check browser console for API errors
3. Verify the API URL in your environment

#### Check 4: Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for any JavaScript errors
- **Network tab**: Check if the POST request to `/api/missions` is failing
  - Status code should be 201 (Created) or 200 (OK)
  - If 400/500, check the error message in the response

### Common Error Messages

#### "Name and survey_area are required"
- **Cause**: Missing mission name or survey area
- **Fix**: Fill in the mission name and add at least 3 points on the map

#### "Survey area must be an array with at least 3 points"
- **Cause**: Survey area not properly formatted or has less than 3 points
- **Fix**: Click on the map to add at least 3 points

#### "Failed to generate waypoints"
- **Cause**: Survey area coordinates are invalid or area is too small
- **Fix**: 
  - Make sure you're clicking on the map (not outside)
  - Try defining a larger area
  - Check that points are not all the same location

#### "Invalid point at index X"
- **Cause**: One of the points has invalid coordinates
- **Fix**: Clear the survey area and redraw it

### Debugging Steps

1. **Check Backend Logs**
   ```bash
   # In the server terminal, you should see:
   # "Creating mission with data: ..."
   # "Generated X waypoints"
   ```

2. **Check Frontend Console**
   ```javascript
   // Should see:
   // "Submitting mission: ..."
   // "Mission created: ..."
   ```

3. **Test API Directly**
   ```bash
   curl -X POST http://localhost:5000/api/missions \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Mission",
       "pattern_type": "grid",
       "flight_altitude": 50,
       "overlap_percentage": 70,
       "survey_area": [
         {"lat": 37.7749, "lng": -122.4194},
         {"lat": 37.7750, "lng": -122.4195},
         {"lat": 37.7751, "lng": -122.4196}
       ]
     }'
   ```

### Quick Fixes

1. **Clear and Redraw Survey Area**
   - Click the trash icon to clear all points
   - Start fresh by clicking on the map

2. **Use a Template**
   - Click on one of the mission templates
   - This pre-fills pattern, altitude, and overlap settings

3. **Check Map Loading**
   - If map doesn't load, check your internet connection
   - Map tiles are loaded from OpenStreetMap

4. **Restart Servers**
   ```bash
   # Stop current servers (Ctrl+C)
   # Then restart:
   npm run dev
   ```

### Still Having Issues?

1. Check the server terminal for detailed error messages
2. Check browser console for client-side errors
3. Verify database is accessible (check `server/drone_survey.db` exists)
4. Try creating a mission with minimal data:
   - Name: "Test"
   - Pattern: Grid
   - Altitude: 50
   - Overlap: 70
   - Add 3 points on map (click in different locations)

