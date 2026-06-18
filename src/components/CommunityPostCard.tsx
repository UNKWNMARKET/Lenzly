import { useState, useEffect, memo } from 'react'
import { MapPin, Navigation, Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer } from 'lucide-react'
import { img } from '@/lib/image'
import { useLocation } from 'wouter'

type Props = {
  post: {
    id: string
    image_url: string
    location_name: string
    lat: number | null
    lng: number | null
    category: string | null
    profiles: { username: string | null; avatar_url: string | null } | null
  }
}

type Weather = {
  temp: number
  code: number
  wind: number
}

function weatherIcon(code: number) {
  if (code === 0) return <Sun size={10} className="text-yellow-400" />
  if (code <= 3) return <Cloud size={10} className="text-white/60" />
  if (code <= 67) return <CloudRain size={10} className="text-blue-400" />
  if (code <= 77) return <CloudSnow size={10} className="text-blue-200" />
  return <CloudRain size={10} className="text-blue-400" />
}

function weatherLabel(code: number) {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Stormy'
}

function CommunityPostCard({ post }: Props) {
  const [, navigate] = useLocation()
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    if (!post.lat || !post.lng) return
    const controller = new AbortController()
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${post.lat}&longitude=${post.lng}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&forecast_days=1`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(d => {
        if (d?.current) {
          setWeather({
            temp: Math.round(d.current.temperature_2m),
            code: d.current.weathercode,
            wind: Math.round(d.current.windspeed_10m),
          })
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [post.lat, post.lng])

  const openDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    const q = post.lat && post.lng
      ? `${post.lat},${post.lng}`
      : encodeURIComponent(post.location_name || '')
    if (!q) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
  }

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      className="relative overflow-hidden rounded-xl bg-lenz-card cursor-pointer active:scale-[0.97] transition-transform"
      style={{ aspectRatio: '3/4' }}
    >
      <img
        src={img.thumb(post.image_url)}
        alt={post.location_name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Category top-left */}
      {post.category && (
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-medium bg-black/50 backdrop-blur-sm text-white/70 px-1.5 py-0.5 rounded-full">
            {post.category}
          </span>
        </div>
      )}

      {/* Weather top-right */}
      {weather && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-1">
          {weatherIcon(weather.code)}
          <span className="text-[10px] font-bold text-white">{weather.temp}°F</span>
        </div>
      )}

      {/* Bottom gradient info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1">
        {/* Location */}
        <div className="flex items-center gap-1 pr-20">
          <MapPin size={9} className="text-gold shrink-0" />
          <p className="text-[11px] font-bold text-white truncate leading-tight">{post.location_name || 'Unknown Location'}</p>
        </div>

        {/* Weather detail row */}
        {weather && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/50">{weatherLabel(weather.code)}</span>
            <div className="flex items-center gap-0.5">
              <Wind size={8} className="text-white/40" />
              <span className="text-[9px] text-white/40">{weather.wind}mph</span>
            </div>
          </div>
        )}

        {/* Photographer */}
        {post.profiles?.username && (
          <div className="flex items-center gap-1 min-w-0 pr-20">
            <div className="w-4 h-4 rounded-full bg-white/20 overflow-hidden shrink-0">
              {post.profiles.avatar_url
                ? <img src={img.avatar(post.profiles.avatar_url)} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[7px] text-white font-bold">{post.profiles.username[0].toUpperCase()}</div>
              }
            </div>
            <span className="text-[9px] text-white/60 truncate">@{post.profiles.username}</span>
          </div>
        )}
      </div>

      {/* Directions button — always visible, absolutely anchored bottom-right */}
      <button
        onClick={openDirections}
        className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-gold/40 rounded-full px-2 py-1 active:bg-gold/30"
      >
        <Navigation size={8} className="text-gold" />
        <span className="text-[9px] text-gold font-semibold">Directions</span>
      </button>
    </div>
  )
}

export default memo(CommunityPostCard)
