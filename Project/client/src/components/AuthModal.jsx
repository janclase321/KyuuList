import { useState } from 'react'
import Modal from '@mui/material/Modal'
import Fade from '@mui/material/Fade'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CircularProgress from '@mui/material/CircularProgress'
import { supabase } from '../services/supabaseClient.js'
import { useAuth, DEFAULT_AVATAR_URL } from '../context/AuthContext.jsx'

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    color: '#f1e9ff',
    '& fieldset': { borderColor: 'rgba(255, 182, 215, 0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(249, 168, 212, 0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#e879a0' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#f9a8d4' },
}

/**
 * AuthModal
 * Login / Sign Up modal, toggled by the Navbar's auth buttons.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - initialMode: 'login' | 'signup' — which tab to start on
 */
export default function AuthModal({ open, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [handle, setHandle] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { refreshProfile } = useAuth()

  function resetFields() {
    setEmail('')
    setPassword('')
    setUsername('')
    setHandle('')
    setError('')
  }

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
  }

  function handleClose() {
    if (submitting) return // don't let them close mid-request
    resetFields()
    onClose()
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    resetFields()
    onClose()
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !handle.trim()) {
      setError('Username and handle are required.')
      return
    }

    setSubmitting(true)

    // Step 1: create the auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setSubmitting(false)
      setError(signUpError.message)
      return
    }

    const newUserId = signUpData.user?.id
    if (!newUserId) {
      setSubmitting(false)
      setError('Something went wrong creating your account. Please try again.')
      return
    }

    // Step 2: create the matching row in your `users` table
    const { error: profileError } = await supabase.from('users').insert({
      id: newUserId,
      username: username.trim(),
      handle: handle.trim(),
      bio: '',
      avatar: DEFAULT_AVATAR_URL,
    })

    setSubmitting(false)

    if (profileError) {
      // Note: the auth user was already created at this point. If this
      // fails (e.g. handle already taken), you may want a Postgres unique
      // constraint on `handle` to enforce this at the DB level too.
      setError(profileError.message)
      return
    }

    await refreshProfile()
    resetFields()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} closeAfterTransition>
      <Fade in={open}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 400,
            mx: 2,
            borderRadius: '20px',
            background: '#1a1228',
            border: '1px solid rgba(255, 182, 215, 0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            outline: 'none',
            p: 3.5,
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleClose}
            aria-label="Close"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'rgba(255,255,255,0.5)',
              '&:hover': { color: '#fff', background: 'rgba(232, 121, 160, 0.15)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Header */}
          <Typography sx={{ fontSize: '1.4rem', mb: 1 }}>🌸</Typography>

          {/* Login / Sign Up segmented toggle */}
          <Box
            sx={{
              display: 'flex',
              position: 'relative',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255, 182, 215, 0.12)',
              borderRadius: '14px',
              p: 0.4,
              mb: 3,
            }}
          >
            {/* Sliding active pill */}
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: mode === 'login' ? 4 : '50%',
                width: 'calc(50% - 4px)',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
                boxShadow: '0 0 12px rgba(232, 121, 160, 0.35)',
                transition: 'left 0.25s ease',
              }}
            />

            <Box
              onClick={() => switchMode('login')}
              role="button"
              sx={{
                position: 'relative',
                flex: 1,
                textAlign: 'center',
                py: 0.9,
                borderRadius: '11px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: mode === 'login' ? '#ffffff' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.2s ease',
                zIndex: 1,
              }}
            >
              Log In
            </Box>
            <Box
              onClick={() => switchMode('signup')}
              role="button"
              sx={{
                position: 'relative',
                flex: 1,
                textAlign: 'center',
                py: 0.9,
                borderRadius: '11px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: mode === 'signup' ? '#ffffff' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.2s ease',
                zIndex: 1,
              }}
            >
              Sign Up
            </Box>
          </Box>

          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#f1e9ff',
              mb: 0.5,
            }}
          >
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.45)',
              mb: 3,
            }}
          >
            {mode === 'login'
              ? 'Log in to keep tracking your anime.'
              : 'Join KyuuList to start your list.'}
          </Typography>

          {/* Form */}
          <Box
            component="form"
            onSubmit={mode === 'login' ? handleLogin : handleSignUp}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {mode === 'signup' && (
              <>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={inputStyles}
                  size="small"
                  required
                  fullWidth
                />
                <TextField
                  label="Handle"
                  placeholder="@yourhandle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  sx={inputStyles}
                  size="small"
                  required
                  fullWidth
                />
              </>
            )}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={inputStyles}
              size="small"
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={inputStyles}
              size="small"
              required
              fullWidth
              inputProps={{ minLength: 6 }}
            />

            {error && (
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  color: '#f87171',
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.25)',
                  borderRadius: '10px',
                  px: 1.5,
                  py: 1,
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                mt: 0.5,
                background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.88rem',
                textTransform: 'none',
                py: 1,
                borderRadius: '14px',
                boxShadow: '0 0 16px rgba(232, 121, 160, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
                  boxShadow: '0 0 24px rgba(232, 121, 160, 0.6)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(232, 121, 160, 0.25)',
                  color: 'rgba(255,255,255,0.5)',
                },
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.7)' }} />
              ) : mode === 'login' ? (
                'Log In'
              ) : (
                'Sign Up'
              )}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  )
}