import { createTheme } from '@mui/material/styles'

export const STATUS_COLORS: Record<string, string> = {
  wishlist: '#64748b',
  applied: '#38bdf8',
  phone_screen: '#a78bfa',
  interview: '#f59e0b',
  offer: '#10b981',
  rejected: '#f43f5e',
  accepted: '#22c55e',
  withdrawn: '#475569',
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#10b981' },
    secondary: { main: '#38bdf8' },
    error: { main: '#f43f5e' },
    warning: { main: '#f59e0b' },
    background: {
      default: '#0f1115',
      paper: '#171a21',
    },
    divider: 'rgba(148, 163, 184, 0.16)',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
})

export default theme
