import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import AdminLayout from './AdminLayout';

function Dashboard() {

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

  return (
    <AdminLayout pageTitle="Dashboard">
      {/* <Box>

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
      </Box> */}
    </AdminLayout>
  );
}

export default Dashboard;