import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

export default function NotFound() {
  return (
    <Container
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
      }}
    >
      <Typography sx={{ fontSize: '3.5rem', mb: 1, lineHeight: 1 }}>
        🌸
      </Typography>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: '2.5rem', sm: '3.5rem' },
          letterSpacing: '0.04em',
          background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 60%, #93c5fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          mb: 1,
        }}
      >
        404
      </Typography>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.3rem',
          color: '#f1e9ff',
          mb: 1,
        }}
      >
        This page hasn't aired yet
      </Typography>

      <Typography
        sx={{
          fontSize: '0.92rem',
          color: 'rgba(255,255,255,0.45)',
          maxWidth: 380,
          mb: 4,
          lineHeight: 1.6,
        }}
      >
        We couldn't find the page you're looking for. It may have been moved,
        deleted, or never existed in the first place.
      </Typography>

      <Button
        component={Link}
        to="/"
        variant="contained"
        sx={{
          background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.88rem',
          textTransform: 'none',
          px: 3.5,
          py: 1.1,
          borderRadius: '20px',
          boxShadow: '0 0 16px rgba(232, 121, 160, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
            boxShadow: '0 0 24px rgba(232, 121, 160, 0.6)',
          },
        }}
      >
        ← Back to Home
      </Button>
    </Container>
  )
}