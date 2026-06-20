import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e879a0',       // sakura pink
      light: '#f472b6',
      dark: '#be4a7c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a78bfa',       // soft lavender
      light: '#c4b5fd',
      dark: '#7c5ce8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#120d1e',    // deep dark plum
      paper: '#1e1535',      // slightly lighter for cards/surfaces
    },
    text: {
      primary: '#f1e9ff',    // soft white with a lavender tint
      secondary: 'rgba(255,255,255,0.55)',
      disabled: 'rgba(255,255,255,0.3)',
    },
    divider: 'rgba(255, 182, 215, 0.12)',
    action: {
      hover: 'rgba(249, 168, 212, 0.08)',
      selected: 'rgba(167, 139, 250, 0.15)',
      focus: 'rgba(232, 121, 160, 0.2)',
    },
  },

  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h6: {
      fontWeight: 800,
      letterSpacing: '0.04em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.03em',
    },
  },

  shape: {
    borderRadius: 16,
  },

  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1a1025 0%, #1e1535 50%, #1a1025 100%)',
          borderBottom: '1px solid rgba(255, 182, 215, 0.15)',
          boxShadow: '0 2px 24px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
          boxShadow: '0 0 16px rgba(232, 121, 160, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
            boxShadow: '0 0 24px rgba(232, 121, 160, 0.6)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 182, 215, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#1e1535',
          border: '1px solid rgba(255, 182, 215, 0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        },
      },
    },
  },
})

export default theme