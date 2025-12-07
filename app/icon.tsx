import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 192,
  height: 192,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '32px',
          position: 'relative',
        }}
      >
        {/* Ajanda kapağı */}
        <div
          style={{
            width: '140px',
            height: '160px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}
        >
          {/* Üst spiral/halka efekti */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'space-around',
              paddingLeft: '20px',
              paddingRight: '20px',
            }}
          >
            <div style={{ width: '16px', height: '16px', background: '#667eea', borderRadius: '50%' }} />
            <div style={{ width: '16px', height: '16px', background: '#667eea', borderRadius: '50%' }} />
            <div style={{ width: '16px', height: '16px', background: '#667eea', borderRadius: '50%' }} />
          </div>

          {/* "M" harfi - Melike için */}
          <div
            style={{
              fontSize: '72px',
              color: '#667eea',
              fontWeight: 'bold',
              marginTop: '20px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            M
          </div>

          {/* Alt çizgi dekorasyonu */}
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ width: '80px', height: '3px', background: '#667eea', borderRadius: '2px', opacity: 0.6 }} />
            <div style={{ width: '60px', height: '3px', background: '#764ba2', borderRadius: '2px', opacity: 0.4 }} />
            <div style={{ width: '70px', height: '3px', background: '#667eea', borderRadius: '2px', opacity: 0.3 }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
