"use client";

import { useEffect, useRef, useState } from 'react';

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  category?: string;
  status?: string;
  priority?: string;
  address?: string;
  color?: string;
  size?: number;
}

interface LeafletMapWithMarkersProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Marker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: Marker) => void;
  height?: string;
  className?: string;
  showAttribution?: boolean;
  focusOnMarker?: string; // ID of marker to focus on
  autoFitBounds?: boolean; // Whether to auto-fit bounds to show all markers
  mapView?: 'normal' | 'satellite' | 'terrain' | 'minimal'; // Map view type
  onMapViewChange?: (view: string) => void; // Callback for view changes
}

export function LeafletMapWithMarkers({ 
  latitude, 
  longitude, 
  zoom = 12,
  markers = [],
  onLocationSelect,
  onMarkerClick,
  height = "400px",
  className = "",
  showAttribution = true,
  focusOnMarker,
  autoFitBounds = false,
  mapView = 'normal',
  onMapViewChange
}: LeafletMapWithMarkersProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setIsLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  const createMarkerIcon = (marker: Marker, isFocused: boolean = false) => {
    const L = (window as any).L;
    const color = marker.color || getStatusColor(marker.status);
    const baseSize = marker.size || getPrioritySize(marker.priority);
    const size = isFocused ? Math.max(baseSize * 2.2, 40) : baseSize;
    const borderWidth = isFocused ? 5 : 3;
    const shadowSize = isFocused ? 16 : 12;
    const pulseSize = isFocused ? 30 : 0;
    
    // Create a more sophisticated marker with gradient and better styling
    const markerHtml = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isFocused ? `
          <div style="
            position: absolute;
            width: ${pulseSize}px;
            height: ${pulseSize}px;
            border-radius: 50%;
            background-color: ${color};
            opacity: 0.3;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)});
          border: ${borderWidth}px solid white;
          box-shadow: 
            0 0 ${shadowSize}px rgba(0,0,0,0.3),
            0 4px 8px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isFocused ? '18px' : '14px'};
          color: white;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          z-index: ${isFocused ? 1000 : 100};
          position: relative;
        ">
          ${getCategoryIcon(marker.category)}
        </div>
        ${isFocused ? `
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid white;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    `;
    
    return L.divIcon({
      html: markerHtml,
      className: `custom-marker ${isFocused ? 'focused-marker' : ''}`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (num & 255) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const getCategoryIcon = (category?: string) => {
    const icons: { [key: string]: string } = {
      'Pothole': '🕳️',
      'Garbage Collection': '🗑️',
      'Street Light': '💡',
      'Water Supply': '💧',
      'Drainage': '🌊',
      'Road Repair': '🛣️',
      'Traffic Signal': '🚦',
      'Public Toilet': '🚻',
      'Park Maintenance': '🌳',
      'Electricity': '⚡',
      'Sewage': '🚰',
      'Footpath': '🚶',
      'Bus Stop': '🚌',
      'Traffic Sign': '🚧',
      'Public Garden': '🌺'
    };
    return icons[category || ''] || '📍';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "RESOLVED": return "#22c55e";
      case "IN_PROGRESS": return "#3b82f6";
      case "ASSIGNED": return "#eab308";
      case "PENDING": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getPrioritySize = (priority?: string) => {
    // Increased sizes for better visibility
    switch (priority) {
      case "high": return 32;
      case "medium": return 28;
      case "low": return 24;
      default: return 28;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#22c55e";
      default: return "#6b7280";
    }
  };

  const getTileLayer = (view: string) => {
    const L = (window as any).L;
    switch (view) {
      case 'satellite':
        return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
        });
      case 'terrain':
        return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap (CC-BY-SA)'
        });
      case 'minimal':
        // Clean CartoDB Positron style (what normal was using)
        return L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        });
      default: // normal - back to original OpenStreetMap
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        });
    }
  };


  useEffect(() => {
    if (!isLoaded || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], zoom);

      // Add initial tile layer
      tileLayerRef.current = getTileLayer(mapView);
      tileLayerRef.current.addTo(mapInstanceRef.current);

      // Add click event for location selection
      if (onLocationSelect) {
        mapInstanceRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          onLocationSelect(lat, lng);
        });
      }
    } else {
      // Update existing map center
      mapInstanceRef.current.setView([latitude, longitude], zoom);
    }
  }, [isLoaded, latitude, longitude, zoom, onLocationSelect, showAttribution]);

  // Handle map view changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    tileLayerRef.current = getTileLayer(mapView);
    tileLayerRef.current.addTo(mapInstanceRef.current);
  }, [mapView, markers]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !(window as any).L) return;

    const L = (window as any).L;
    clearMarkers();

    const bounds = L.latLngBounds();
    let focusedMarker: any = null;

    markers.forEach(marker => {
      if (marker.latitude && marker.longitude) {
        const isFocused = focusOnMarker === marker.id;
        const icon = createMarkerIcon(marker, isFocused);
        const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon })
          .addTo(mapInstanceRef.current);

        // Add click event for marker
        if (onMarkerClick) {
          leafletMarker.on('click', () => {
            onMarkerClick(marker);
          });
        }

        // Add popup with enhanced styling
        const popupContent = `
          <div style="
            min-width: 280px;
            max-width: 320px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 16px;
              margin: -10px -10px 12px -10px;
              border-radius: 8px 8px 0 0;
              position: relative;
            ">
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                line-height: 1.3;
              ">${marker.title || 'Issue'}</h3>
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
              ">
                <span style="font-size: 14px;">${getCategoryIcon(marker.category)}</span>
                <span style="font-size: 12px; opacity: 0.9;">${marker.category || 'Unknown Category'}</span>
              </div>
            </div>
            
            <div style="padding: 0 4px;">
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 8px 12px;
                background: ${getStatusColor(marker.status)}15;
                border-radius: 6px;
                border-left: 4px solid ${getStatusColor(marker.status)};
              ">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">Status</span>
                <span style="
                  font-size: 11px;
                  font-weight: 600;
                  color: ${getStatusColor(marker.status)};
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">${marker.status || 'Unknown'}</span>
              </div>
              
              ${marker.priority ? `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 8px;
                  padding: 6px 12px;
                  background: #f8fafc;
                  border-radius: 6px;
                ">
                  <span style="font-size: 12px; font-weight: 500; color: #374151;">Priority</span>
                  <span style="
                    font-size: 11px;
                    font-weight: 600;
                    color: ${getPriorityColor(marker.priority)};
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  ">${marker.priority}</span>
                </div>
              ` : ''}
              
              ${marker.address ? `
                <div style="
                  padding: 8px 12px;
                  background: #f8fafc;
                  border-radius: 6px;
                  border: 1px solid #e5e7eb;
                ">
                  <div style="
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                  ">
                    <span style="font-size: 12px; color: #6b7280; margin-top: 1px;">📍</span>
                    <span style="
                      font-size: 11px;
                      color: #4b5563;
                      line-height: 1.4;
                    ">${marker.address}</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        leafletMarker.bindPopup(popupContent);

        // Add to bounds for auto-fit
        bounds.extend([marker.latitude, marker.longitude]);

        // Store focused marker for later centering
        if (isFocused) {
          focusedMarker = leafletMarker;
        }

        markersRef.current.push(leafletMarker);
      }
    });

    // Handle focus and auto-fit
    if (focusedMarker) {
      // Focus on specific marker with higher zoom
      mapInstanceRef.current.setView([focusedMarker.getLatLng().lat, focusedMarker.getLatLng().lng], 16);
      // Open popup for focused marker
      focusedMarker.openPopup();
    } else if (autoFitBounds && markers.length > 0) {
      // Auto-fit to show all markers
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [isLoaded, markers, onMarkerClick, focusOnMarker, autoFitBounds]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        position: 'relative'
      }} 
      className={`${className}`}
    />
  );
}
