import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  pingPhase: number
  pingSpeed: number
  label: string
}

interface Traveller {
  from: number
  to: number
  t: number        // 0 → 1 progress along the edge
  speed: number
  headProgress: number  // slightly ahead of t for the head dot
}

const LABELS = ['NYC', 'LAX', 'MIA', 'CHI', 'AUS', 'SEA', 'DEN', 'BOS', 'ATL', 'PHL', 'PHX', 'LAS']
const GOLD = 'rgba(236,200,92,'
const NODE_COUNT = 9
const EDGE_DIST = 0.38  // max fraction of screen width to connect two nodes
const SPEED = 0.00018   // traveller speed per ms

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export default function GpsMapBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let raf = 0
    let lastTime = performance.now()

    // Initialise nodes spread across the canvas
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: 0.08 + Math.random() * 0.84,
      y: 0.08 + Math.random() * 0.84,
      vx: (Math.random() - 0.5) * 0.000035,
      vy: (Math.random() - 0.5) * 0.000035,
      pingPhase: Math.random() * Math.PI * 2,
      pingSpeed: 0.0012 + Math.random() * 0.001,
      label: LABELS[i % LABELS.length],
    }))

    // Build initial travellers (one per visible edge, staggered)
    const travellers: Traveller[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        if (Math.sqrt(dx * dx + dy * dy) < EDGE_DIST) {
          travellers.push({
            from: i, to: j,
            t: Math.random(),
            headProgress: 0,
            speed: SPEED * (0.6 + Math.random() * 0.8) * (Math.random() < 0.5 ? 1 : -1),
          })
        }
      }
    }

    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * devicePixelRatio
      canvas.height = H * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const px = (n: Node) => n.x * W
    const py = (n: Node) => n.y * H

    function draw(now: number) {
      const dt = Math.min(now - lastTime, 32)
      lastTime = now

      ctx.clearRect(0, 0, W, H)

      // Move nodes — bounce off edges
      for (const n of nodes) {
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < 0.04 || n.x > 0.96) { n.vx *= -1; n.x = Math.max(0.04, Math.min(0.96, n.x)) }
        if (n.y < 0.04 || n.y > 0.96) { n.vy *= -1; n.y = Math.max(0.04, Math.min(0.96, n.y)) }
        n.pingPhase += n.pingSpeed * dt
      }

      // Draw edges
      for (const tr of travellers) {
        const a = nodes[tr.from]
        const b = nodes[tr.to]
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > EDGE_DIST * 1.3) continue  // skip if nodes drifted far apart

        const ax = px(a), ay = py(a), bx = px(b), by = py(b)

        // Dashed route line
        ctx.save()
        ctx.setLineDash([4, 8])
        ctx.strokeStyle = `${GOLD}0.12)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
        ctx.restore()

        // Animated traveller
        tr.t += tr.speed * dt
        if (tr.t > 1) { tr.t = 0; tr.speed = Math.abs(tr.speed) }
        if (tr.t < 0) { tr.t = 1; tr.speed = -Math.abs(tr.speed) }

        const t = Math.max(0, Math.min(1, tr.t))
        const tx = lerp(ax, bx, t)
        const ty = lerp(ay, by, t)

        // Tail glow gradient along direction of travel
        const tailLen = 0.18
        const t0 = Math.max(0, t - tailLen)
        const tail0x = lerp(ax, bx, t0), tail0y = lerp(ay, by, t0)
        const grad = ctx.createLinearGradient(tail0x, tail0y, tx, ty)
        grad.addColorStop(0, `${GOLD}0)`)
        grad.addColorStop(1, `${GOLD}0.55)`)
        ctx.save()
        ctx.setLineDash([])
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(tail0x, tail0y)
        ctx.lineTo(tx, ty)
        ctx.stroke()
        ctx.restore()

        // Head dot
        ctx.beginPath()
        ctx.arc(tx, ty, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `${GOLD}0.9)`
        ctx.fill()

        // Small halo on head
        ctx.beginPath()
        ctx.arc(tx, ty, 5, 0, Math.PI * 2)
        ctx.fillStyle = `${GOLD}0.12)`
        ctx.fill()
      }

      // Draw nodes (GPS pins)
      for (const n of nodes) {
        const x = px(n), y = py(n)
        const ping = (Math.sin(n.pingPhase) + 1) / 2  // 0–1

        // Outer ping ring 1
        const r1 = 10 + ping * 18
        ctx.beginPath()
        ctx.arc(x, y, r1, 0, Math.PI * 2)
        ctx.strokeStyle = `${GOLD}${(0.25 * (1 - ping)).toFixed(2)})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Outer ping ring 2 (offset phase)
        const ping2 = (Math.sin(n.pingPhase - 1.2) + 1) / 2
        const r2 = 8 + ping2 * 24
        ctx.beginPath()
        ctx.arc(x, y, r2, 0, Math.PI * 2)
        ctx.strokeStyle = `${GOLD}${(0.15 * (1 - ping2)).toFixed(2)})`
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Inner glow fill
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 7)
        grd.addColorStop(0, `${GOLD}0.35)`)
        grd.addColorStop(1, `${GOLD}0)`)
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Centre dot
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `${GOLD}0.85)`
        ctx.fill()

        // Crosshair lines (short, subtle)
        ctx.save()
        ctx.strokeStyle = `${GOLD}0.18)`
        ctx.lineWidth = 0.8
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y)
        ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12)
        ctx.stroke()
        ctx.restore()

        // Label
        ctx.font = '700 8px Inter, sans-serif'
        ctx.letterSpacing = '0.08em'
        ctx.fillStyle = `${GOLD}0.35)`
        ctx.textAlign = 'center'
        ctx.fillText(n.label, x, y - 14)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}
