import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import AuthModal from './AuthModal.jsx'
import SearchBar from './SearchBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navLinkSx = {
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 500,
  fontSize: '0.8rem',
  letterSpacing: '0.04em',
  textTransform: 'none',
  px: 1.5,
  borderRadius: '20px',
  transition: 'color 0.2s',
  '&:hover': {
    color: '#f9a8d4',
    background: 'rgba(249, 168, 212, 0.08)',
  },
}

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth()

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'
  const [menuAnchor, setMenuAnchor] = useState(null)

  function openAuth(mode) {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  async function handleLogout() {
    setMenuAnchor(null)
    await signOut()
  }

  const isLoggedIn = Boolean(user) && !loading

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(90deg, #1a1025 0%, #1e1535 50%, #1a1025 100%)',
        borderBottom: '1px solid rgba(255, 182, 215, 0.15)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.5)',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 0.5, minHeight: '60px !important' }}>

        {/* Logo */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            component="span"
            sx={{ fontSize: '1.3rem', lineHeight: 1 }}
          >
            🌸
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.15rem',
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

        {/* Nav links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, mr: 2 }}>
          <SearchBar size="compact" />
          <Button component={Link} to="/" size="small" sx={navLinkSx}>
            Home
          </Button>
          <Button component={Link} to="/Anime" size="small" sx={navLinkSx}>
            Anime
          </Button>
          <Button component={Link} to="/category/top-rated" size="small" sx={navLinkSx}>
            Rankings
          </Button>
        </Box>

        {/* Auth area */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isLoggedIn ? (
            <>
              <Box
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                role="button"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  px: 0.5,
                  py: 0.5,
                  borderRadius: '999px',
                  transition: 'background 0.2s',
                  '&:hover': { background: 'rgba(249, 168, 212, 0.08)' },
                }}
              >
                <Avatar
                  src={profile?.avatar}
                  alt={profile?.username || 'Profile'}
                  sx={{
                    width: 34,
                    height: 34,
                    border: '2px solid rgba(249, 168, 212, 0.4)',
                  }}
                />
                <Typography
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {profile?.username || 'Profile'}
                </Typography>
              </Box>

              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      background: '#1a1228',
                      border: '1px solid rgba(255, 182, 215, 0.15)',
                      borderRadius: '14px',
                      minWidth: 160,
                    },
                  },
                }}
              >
                <MenuItem
                  component={Link}
                  to={`/profile/${profile?.handle}`}
                  sx={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': { background: 'rgba(249, 168, 212, 0.08)' },
                  }}
                  onClick={() => setMenuAnchor(null)}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  sx={{
                    fontSize: '0.85rem',
                    color: '#f87171',
                    '&:hover': { background: 'rgba(248, 113, 113, 0.1)' },
                  }}
                  onClick={handleLogout}
                >
                  Log Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                variant="text"
                onClick={() => openAuth('login')}
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  letterSpacing: '0.03em',
                  px: 2,
                  borderRadius: '20px',
                  transition: 'color 0.2s, background 0.2s',
                  '&:hover': {
                    color: '#f9a8d4',
                    background: 'rgba(249, 168, 212, 0.08)',
                  },
                }}
              >
                Login
              </Button>

              <Button
                variant="contained"
                onClick={() => openAuth('signup')}
                sx={{
                  background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  letterSpacing: '0.04em',
                  px: 2.5,
                  py: 0.85,
                  borderRadius: '20px',
                  boxShadow: '0 0 16px rgba(232, 121, 160, 0.35)',
                  transition: 'box-shadow 0.25s, transform 0.15s',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
                    boxShadow: '0 0 24px rgba(232, 121, 160, 0.6)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>

      </Toolbar>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </AppBar>
  )
}