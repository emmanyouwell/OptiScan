import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Visibility as EyeIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Assignment as ReportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const drawerWidth = 280;

const AdminSideBar = ({
  mobileOpen,
  handleDrawerToggle,
  selectedTab,
  setSelectedTab,
}) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { id: 'eye-tests', text: 'Eye Tests', icon: <EyeIcon />, path: '/admin/eye-tests' },
    { id: 'users', text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { id: 'analytics', text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { id: 'reports', text: 'Reports', icon: <ReportIcon />, path: '/admin/reports' },
    { id: 'settings', text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const userObj = JSON.parse(userData);
        setUser(userObj);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  const handleMenuClick = (item) => {
    setSelectedTab(item.id);
    // Optional: Navigate to the route if you're using routing
    navigate(item.path);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={selectedTab === item.id}
              onClick={() => handleMenuClick(item)}
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

      <Divider />

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <ListItemButton sx={{ borderRadius: 2 }}>
          <ListItemIcon>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </Avatar>
          </ListItemIcon>
          <ListItemText onClick={handleLogout}
            primary={user?.username || 'Admin User'}
            // secondary={user?.email || 'admin@optiscan.com'}
            primaryTypographyProps={{ fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
          <IconButton size="small" onClick={handleLogout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
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
  );
};

export default AdminSideBar;