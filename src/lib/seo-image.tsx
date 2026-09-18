import { ImageResponse } from 'next/og'

export const alt = 'ForgeNursing — focused practice for your next NCLEX-RN attempt'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', background: '#0B2545', padding: '70px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', fontSize: 40, fontWeight: 700 }}>Forge<span style={{ color: '#6EE0DE' }}>Nursing</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.12 }}>Your next NCLEX-RN attempt deserves a clearer plan.</div>
        <div style={{ fontSize: 30, color: '#CBD5E1' }}>Practice. Understand your choice. Try again.</div>
      </div>
      <div style={{ display: 'flex', fontSize: 26, color: '#6EE0DE' }}>Try 3 free questions · forgenursing.com</div>
    </div>, size,
  )
}
