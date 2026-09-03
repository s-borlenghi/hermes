import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { API_BASE_URL } from '../api/client'

const STACK = [
  'Python',
  'FastAPI',
  'SQLAlchemy',
  'Alembic',
  'pytest',
  'React',
  'TypeScript',
  'MUI',
  'GitHub Actions',
]

export function Landing() {
  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, mb: 2 }}>
            Hermes
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 3, maxWidth: 620 }}>
            A job application tracker. FastAPI backend, React frontend, both actually deployed rather than just
            sitting in a repo. Register a real account, or look at the read-only demo below first.
          </Typography>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
            <Button variant="contained" component={RouterLink} to="/demo">
              View the demo
            </Button>
            <Button variant="outlined" component={RouterLink} to="/register">
              Create an account
            </Button>
            <Button variant="text" href={`${API_BASE_URL}/docs`} target="_blank" rel="noopener noreferrer">
              API docs
            </Button>
            <Button
              variant="text"
              href="https://github.com/s-borlenghi/hermes"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {STACK.map((item) => (
              <Chip key={item} label={item} size="small" variant="outlined" />
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Calling the API directly
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
          The demo page below is read-only. Registering a real account gets you a normal multi-tenant CRUD API — or
          skip the UI and call it yourself:
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2.5,
            overflowX: 'auto',
            fontSize: '0.82rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {`curl -X POST ${API_BASE_URL}/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "a-strong-password"}'

curl -X POST ${API_BASE_URL}/auth/login \\
  -d "username=you@example.com&password=a-strong-password"`}
        </Box>
      </Container>

      <Divider />

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          A few things about how it's put together
        </Typography>
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontWeight: 600 }} gutterBottom>
              Data is scoped per user
            </Typography>
            <Typography color="text.secondary">
              Companies, applications, and interview stages all belong to whoever created them. Ownership gets
              checked on every read and write, not just when something is created — one account can't see or edit
              another account's data by guessing an ID.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600 }} gutterBottom>
              The demo doesn't touch real data
            </Typography>
            <Typography color="text.secondary">
              The <code>/demo</code> page is backed by a separate, read-only set of endpoints tied to one fixed
              seeded account. Nobody browsing as a guest can read or modify anyone's real applications.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600 }} gutterBottom>
              Schema changes are migrations
            </Typography>
            <Typography color="text.secondary">
              The database schema is versioned with Alembic rather than recreated from the models on startup, so it
              behaves the way it would on a team where you can't just wipe the database between deploys.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600 }} gutterBottom>
              It's on a free tier, and it shows
            </Typography>
            <Typography color="text.secondary">
              The API sleeps after 15 minutes of inactivity on Render's free plan. If you loaded this recently, you
              probably saw a "waking up the server" screen before this page appeared — that's expected, not a bug.
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
