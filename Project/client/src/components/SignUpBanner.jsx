import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useAuth } from '../context/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'

/**
 * SignUpBanner
 * A homepage CTA encouraging guests to create an account and start their
 * own watchlist. Renders nothing once a user is logged in.
 */
export default function SignUpBanner() {
  const { user, loading } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  // Don't flash the banner during the brief initial auth check, and never
  // show it to someone who's already logged in.
  if (loading || user) return null

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px',
          border: '1px solid rgba(255, 182, 215, 0.15)',
          background: 'linear-gradient(135deg, rgba(232, 121, 160, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)',
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 5 },
          mb: 5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              color: '#f1e9ff',
              mb: 0.5,
            }}
          >
            🌸 Start tracking what you watch
          </Typography>
          <Typography
            sx={{
              fontSize: '0.88rem',
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 420,
            }}
          >
            Create a free account to build your own watchlist, rate your
            favorites, and pick up right where you left off.
          </Typography>
        </Box>

        <Button
          onClick={() => setAuthOpen(true)}
          variant="contained"
          sx={{
            flexShrink: 0,
            background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.9rem',
            textTransform: 'none',
            px: 3.5,
            py: 1.2,
            borderRadius: '20px',
            boxShadow: '0 0 18px rgba(232, 121, 160, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
              boxShadow: '0 0 26px rgba(232, 121, 160, 0.6)',
            },
          }}
        >
          Sign Up Free
        </Button>
      </Box>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="signup"
      />
    </>
  )
}