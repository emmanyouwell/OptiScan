import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AdminSideBar from '../layouts/AdminSideBar';

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

const AdminLayout = ({ children, pageTitle = 'Dashboard', initialTab = 'dashboard' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(initialTab);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'dashboard', text: 'Dashboard' },
    { id: 'eye-tests', text: 'Eye Tests' },
    { id: 'users', text: 'Users' },
    { id: 'analytics', text: 'Analytics' },
    { id: 'reports', text: 'Reports' },
    { id: 'settings', text: 'Settings' },
  ];

  // Get the current page title based on selected tab or use provided pageTitle
  const getCurrentPageTitle = () => {
    if (pageTitle !== 'Dashboard') {
      return pageTitle; // Use provided pageTitle if it's not the default
    }
    const currentMenuItem = menuItems.find(item => item.id === selectedTab);
    return currentMenuItem ? currentMenuItem.text : pageTitle;
  };

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
              {getCurrentPageTitle()}
            </Typography>
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <AdminSideBar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />

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
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AdminLayout;