import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import { NavLink, Outlet } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const navLinkSx = {
  color: 'text.secondary',
  fontWeight: 600,
  fontSize: '0.9rem',
  textDecoration: 'none',
  '&.active': { color: 'text.primary' },
}

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" color="transparent" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Hermes
          </Typography>
          <Stack direction="row" spacing={3} sx={{ flexGrow: 1 }}>
            <NavLink to="/app" end style={navLinkSx as never}>
              Dashboard
            </NavLink>
            <NavLink to="/app/applications" style={navLinkSx as never}>
              Applications
            </NavLink>
            <NavLink to="/app/companies" style={navLinkSx as never}>
              Companies
            </NavLink>
          </Stack>
          <Button
            size="small"
            startIcon={<MenuBookOutlinedIcon />}
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            API docs
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {user?.email}
          </Typography>
          <Button size="small" variant="outlined" onClick={logout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
