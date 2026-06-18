import { useState, useEffect } from 'react'

export interface DayForecast {
  date: string
  dayName: string
  weatherCode: number
  tempMaxF: number
  tempMinF: number
  precipPct: number
  windMph: number
  condition: string
  emoji: string
  photoScore: number   // 0–100: how good for photography
  photoLabel: string   // 'Excellent' | 'Good' | 'Fair' | 'Poor'
}

export function useWeather(lat: number, lng: number) {
  const [forecast, setForecast] = useState<DayForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lat || !lng) return
    setLoading(true)
    setError(null)

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max` +
      `&timezone=auto&forecast_days=5`

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Forecast unavailable')
        return r.json()
      })
      .then(data => {
        const d = data.daily
        const days: DayForecast[] = d.time.map((date: string, i: number) => {
          const code: number = d.weathercode[i]
          const precipPct: number = d.precipitation_probability_max[i] ?? 0
          const score = photoScore(code, precipPct)
          return {
            date,
            dayName: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
            weatherCode: code,
            tempMaxF: Math.round(d.temperature_2m_max[i] * 9 / 5 + 32),
            tempMinF: Math.round(d.temperature_2m_min[i] * 9 / 5 + 32),
            precipPct,
            windMph: Math.round(d.windspeed_10m_max[i] * 0.621371),
            condition: wmoCondition(code),
            emoji: wmoEmoji(code),
            photoScore: score,
            photoLabel: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
          }
        })
        setForecast(days)
        setLoading(false)
      })
      .catch(err => {
        setError('Could not load forecast')
        setLoading(false)
      })
  }, [lat, lng])

  return { forecast, loading, error }
}

function wmoCondition(code: number): string {
  if (code === 0) return 'Clear Sky'
  if (code <= 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 86) return 'Snow Showers'
  return 'Thunderstorm'
}

function wmoEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

// Photography-optimized score: partly cloudy > clear > overcast > drizzle/fog > rain > storm
function photoScore(code: number, precip: number): number {
  let base: number
  if (code === 0) base = 85        // clear — great golden hour, harsh midday
  else if (code <= 2) base = 95    // partly cloudy — diffused + colour = perfect
  else if (code === 3) base = 72   // overcast — good for portraits/arch, flat light
  else if (code <= 48) base = 45   // fog — dramatic but limited subject range
  else if (code <= 57) base = 30   // drizzle — gear risk, wet gear
  else if (code <= 67) base = 18   // rain
  else if (code <= 77) base = 62   // snow — beautiful but cold
  else if (code <= 82) base = 28   // showers — unpredictable
  else if (code <= 86) base = 55   // snow showers — often scenic
  else base = 8                    // thunderstorm

  // Penalise high precipitation probability
  base -= Math.floor(precip * 0.25)
  return Math.max(0, Math.min(100, base))
}
