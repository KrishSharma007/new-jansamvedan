"use client";

import { useEffect, useRef, useState } from 'react';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

export function LeafletMap({ latitude, longitude, onLocationSelect, height = "400px" }: LeafletMapProps) {
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
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add marker
      markerRef.current = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);

      // Add click event
      mapInstanceRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
        
        // Update marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      });
    } else {
      // Update existing map
      mapInstanceRef.current.setView([latitude, longitude], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }
  }, [isLoaded, latitude, longitude, onLocationSelect]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height }} 
      className="rounded-lg border"
    />
  );
}
