import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  {
    heading: 'Browse',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Top Rated', to: '/' },
      { label: 'Airing Now', to: '/' },
      { label: 'Upcoming', to: '/' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'My Profile', to: '/profile' },
      { label: 'Watchlist', to: '/profile' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(90deg, #1a1025 0%, #1e1535 50%, #1a1025 100%)',
        borderTop: '1px solid rgba(255, 182, 215, 0.12)',
        mt: 8,
      }}
    >
      <Container sx={{ py: 5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          {/* Logo + tagline */}
          <Box sx={{ maxWidth: 280 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
                🌸
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 60%, #93c5fd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                KyuuList
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Track, rate, and discover anime — all in one cozy little corner.
            </Typography>
          </Box>

          {/* Link columns */}
          <Box sx={{ display: 'flex', gap: { xs: 4, sm: 6 }, flexWrap: 'wrap' }}>
            {FOOTER_LINKS.map((column) => (
              <Box key={column.heading}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.35)',
                    mb: 1.5,
                  }}
                >
                  {column.heading}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {column.links.map((link) => (
                    <Typography
                      key={link.label}
                      component={Link}
                      to={link.to}
                      sx={{
                        fontSize: '0.82rem',
                        color: 'rgba(255,255,255,0.6)',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: '#f9a8d4' },
                      }}
                    >
                      {link.label}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom bar */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid rgba(255, 182, 215, 0.08)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            © {year} KyuuList. Made with 🩷 for anime fans.
          </Typography>
          <Typography
            component="a"
            href="https://anilist.co"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.3)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
              '&:hover': { color: '#c4b5fd' },
            }}
          >
            Anime data powered by AniList
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}