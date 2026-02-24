"use client";

import React, { useEffect, useRef, useState } from 'react';

interface LeafletDisplayMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: string;
  className?: string;
  showAttribution?: boolean;
  markerTitle?: string;
}

export function LeafletDisplayMap({ 
  latitude, 
  longitude, 
  zoom = 15,
  height = "200px",
  className = "",
  showAttribution = true,
  markerTitle = "Location"
}: LeafletDisplayMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
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

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: showAttribution ? '© OpenStreetMap contributors' : ''
      }).addTo(mapInstanceRef.current);

      // Add marker
      const icon = L.divIcon({
        html: `<div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ef4444;
          border: 3px solid white;
          box-shadow: 0 0 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
        ">📍</div>`,
        className: 'location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markerRef.current = L.marker([latitude, longitude], { icon })
        .addTo(mapInstanceRef.current);

      // Add popup
      markerRef.current.bindPopup(`
        <div style="min-width: 150px;">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${markerTitle}</h3>
          <p style="margin: 0; font-size: 11px; color: #666;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </p>
        </div>
      `);

      // Open popup by default
      markerRef.current.openPopup();
    } else {
      // Update existing map center and marker
      mapInstanceRef.current.setView([latitude, longitude], zoom);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }
  }, [isLoaded, latitude, longitude, zoom, showAttribution, markerTitle]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height }} 
      className={`rounded-lg border ${className}`}
    />
  );
}
