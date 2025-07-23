import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Visibility as EyeIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Assignment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Custom eye-focused theme
const eyeTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue for trust and medical
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#26a69a', // Teal for health and wellness
      light: '#4db6ac',
      dark: '#00695c',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const drawerWidth = 280;

function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'eye-tests', text: 'Eye Tests', icon: <EyeIcon /> },
    { id: 'users', text: 'Users', icon: <PeopleIcon /> },
    { id: 'analytics', text: 'Analytics', icon: <AnalyticsIcon /> },
    { id: 'reports', text: 'Reports', icon: <ReportIcon /> },
    { id: 'settings', text: 'Settings', icon: <SettingsIcon /> },
  ];

  // Sample data
  const stats = [
    { title: 'Total Tests', value: '2,847', change: '+12%', color: '#1976d2' },
    { title: 'Active Users', value: '1,293', change: '+8%', color: '#26a69a' },
    { title: 'Success Rate', value: '96.4%', change: '+2.1%', color: '#ff9800' },
    { title: 'Alerts', value: '23', change: '-5%', color: '#f44336' },
  ];

  const recentTests = [
    { id: 1, user: 'John Doe', test: 'Color Blindness', result: 'Normal', time: '2 mins ago' },
    { id: 2, user: 'Jane Smith', test: 'Eye Tracking', result: 'Abnormal', time: '5 mins ago' },
    { id: 3, user: 'Mike Johnson', test: 'Pupil Analysis', result: 'Normal', time: '8 mins ago' },
    { id: 4, user: 'Sarah Wilson', test: 'Color Blindness', result: 'Detected', time: '12 mins ago' },
  ];

  const drawer = (
    <Box>
      {/* Logo Section */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          <EyeIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            OptiScan
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin Dashboard
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={selectedTab === item.id}
              onClick={() => setSelectedTab(item.id)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: selectedTab === item.id ? 'primary.light' : 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: selectedTab === item.id ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedTab === item.id ? 600 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 2 }} />

      {/* User Profile */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <ListItemButton sx={{ borderRadius: 2 }}>
          <ListItemIcon>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              A
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary="Admin User"
            secondary="admin@optiscan.com"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
          <IconButton size="small">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
      </Box>
    </Box>
  );

  const DashboardContent = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: stat.change.startsWith('+') ? '#e8f5e8' : '#ffeaea',
                        color: stat.change.startsWith('+') ? '#2e7d32' : '#d32f2f',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: `${stat.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUpIcon sx={{ color: stat.color, fontSize: 30 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Tests */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Recent Eye Tests
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Test Type</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {test.user.charAt(0)}
                            </Avatar>
                            {test.user}
                          </Box>
                        </TableCell>
                        <TableCell>{test.test}</TableCell>
                        <TableCell>
                          <Chip
                            label={test.result}
                            size="small"
                            color={
                              test.result === 'Normal' ? 'success' :
                              test.result === 'Abnormal' ? 'error' : 'warning'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell color="text.secondary">{test.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box mt={3}>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Server Performance</Typography>
                  <Typography variant="body2" color="text.secondary">92%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={92}
                  sx={{ height: 8, borderRadius: 5 }}
                />
              </Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Database Health</Typography>
                  <Typography variant="body2" color="text.secondary">88%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={88}
                  sx={{ height: 8, borderRadius: 5 }}
                  color="secondary"
                />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">API Response</Typography>
                  <Typography variant="body2" color="text.secondary">95%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={95}
                  sx={{ height: 8, borderRadius: 5 }}
                  color="success"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <ThemeProvider theme={eyeTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {menuItems.find(item => item.id === selectedTab)?.text || 'Dashboard'}
            </Typography>
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                border: 'none',
                borderRight: '1px solid #e0e0e0',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          <DashboardContent />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default Dashboard;