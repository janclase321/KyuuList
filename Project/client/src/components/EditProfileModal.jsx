import { useState, useEffect } from 'react'
import Modal from '@mui/material/Modal'
import Fade from '@mui/material/Fade'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import { useAuth } from '../context/AuthContext.jsx'
import { updateUserProfile } from '../services/api.js'

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
 * EditProfileModal
 * Lets the logged-in user update their bio and avatar URL.
 * Writes directly to the `users` Supabase table (profile data,
 * not auth data — no password changes here).
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSaved: (updatedProfile) => void — called after a successful save
 *             so the profile page can update its local state immediately
 */
export default function EditProfileModal({ open, onClose, onSaved }) {
  const { user, profile, refreshProfile } = useAuth()

  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync fields with the current profile whenever the modal opens
  useEffect(() => {
    if (open && profile) {
      setBio(profile.bio ?? '')
      setAvatarUrl(profile.avatar ?? '')
      setError('')
    }
  }, [open, profile])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      const updated = await updateUserProfile(user.id, {
        bio: bio.trim(),
        avatar: avatarUrl.trim(),
      })

      // Refresh the global auth context so the navbar avatar updates too
      await refreshProfile()
      onSaved?.({ ...profile, ...updated })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Fade in={open}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 420,
            mx: 2,
            borderRadius: '20px',
            background: '#1a1228',
            border: '1px solid rgba(255, 182, 215, 0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            outline: 'none',
            p: 3.5,
          }}
        >
          <IconButton
            onClick={onClose}
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

          <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#f1e9ff', mb: 0.5 }}>
            Edit Profile
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', mb: 3 }}>
            Changes apply to your public profile immediately.
          </Typography>

          {/* Avatar preview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              src={avatarUrl || profile?.avatar}
              alt="Preview"
              sx={{
                width: 64,
                height: 64,
                border: '2px solid rgba(249, 168, 212, 0.3)',
                flexShrink: 0,
              }}
            />
            <TextField
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              sx={{ ...inputStyles, flex: 1 }}
              size="small"
              fullWidth
            />
          </Box>

          <TextField
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            multiline
            rows={3}
            inputProps={{ maxLength: 280 }}
            helperText={`${bio.length} / 280`}
            sx={{
              ...inputStyles,
              mb: 2,
              '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.3)', textAlign: 'right' },
            }}
            fullWidth
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
                mb: 2,
              }}
            >
              {error}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button
              onClick={onClose}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                '&:hover': { color: '#fff' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(232, 121, 160, 0.25)',
                  color: 'rgba(255,255,255,0.4)',
                },
              }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : 'Save'}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  )
}