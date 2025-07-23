import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  Surface,
  Card,
  Button,
  Chip,
  Divider,
  Provider as PaperProvider,
  DefaultTheme,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    accent: '#1d4ed8',
  },
};

export default function Home({ navigation }) {
  const [selectedSection, setSelectedSection] = useState('anatomy');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-280));

  // Custom Burger Menu Component
  const BurgerMenu = () => {
    const menuItems = [
      { icon: 'home', label: 'Home', screen: 'Home' },
      { icon: 'camera', label: 'Eye Scan', screen: 'EyeScan' },
      { icon: 'account-circle', label: 'Profile', screen: 'Profile' },
    ];

    const openSidebar = () => {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    const closeSidebar = () => {
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSidebarVisible(false);
      });
    };

    const handleMenuPress = (screen) => {
      closeSidebar();
      if (screen !== 'Home') {
        navigation.navigate(screen);
      }
    };

    const handleLogout = () => {
      closeSidebar();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    };

    return (
      <>
        {/* Burger Menu Button */}
        <View style={styles.burgerContainer}>
          <TouchableOpacity onPress={openSidebar} style={styles.burgerButton}>
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
          </TouchableOpacity>
        </View>

        {/* Sidebar Modal */}
        <Modal
          animationType="none"
          transparent={true}
          visible={sidebarVisible}
          onRequestClose={closeSidebar}
        >
          {/* Overlay */}
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={closeSidebar}
          >
            {/* Sidebar */}
            <Animated.View 
              style={[
                styles.sidebar,
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              {/* Prevent close when touching inside sidebar */}
              <TouchableOpacity activeOpacity={1} style={styles.sidebarContent}>
                {/* Sidebar Header */}
                <LinearGradient
                  colors={['#1e3a8a', '#3b82f6']}
                  style={styles.sidebarHeader}
                >
                  <View style={styles.sidebarEyeIcon}>
                    <View style={styles.sidebarEyeOuter}>
                      <View style={styles.sidebarEyeInner}>
                        <View style={styles.sidebarPupil} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.sidebarTitle}>OptiScan</Text>
                  <Text style={styles.sidebarSubtitle}>Eye Health Monitor</Text>
                </LinearGradient>

                {/* Menu Items Container */}
                <View style={styles.menuContainer}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => handleMenuPress(item.screen)}
                      activeOpacity={0.7}
                    >
                      <IconButton
                        icon={item.icon}
                        size={22}
                        iconColor="#3b82f6"
                        style={styles.menuIcon}
                      />
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Logout Button - Fixed positioning */}
                <View style={styles.logoutContainer}>
                  <TouchableOpacity
                    style={styles.logoutItem}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <IconButton
                      icon="logout"
                      size={22}
                      iconColor="#ef4444"
                      style={styles.menuIcon}
                    />
                    <Text style={styles.logoutLabel}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  const eyeAnatomyData = [
    {
      part: 'Cornea',
      description: 'Clear front layer that focuses light into the eye',
      function: 'Primary focusing element, provides 65-75% of eye\'s focusing power',
      icon: 'eye-outline'
    },
    {
      part: 'Iris',
      description: 'Colored part of the eye that controls pupil size',
      function: 'Regulates amount of light entering the eye',
      icon: 'circle-outline'
    },
    {
      part: 'Pupil',
      description: 'Opening in the center of the iris',
      function: 'Allows light to enter the eye',
      icon: 'circle'
    },
    {
      part: 'Lens',
      description: 'Clear structure that changes shape to focus light',
      function: 'Fine-tunes focus for near and distant objects',
      icon: 'circle-outline'
    },
    {
      part: 'Retina',
      description: 'Light-sensitive tissue at the back of the eye',
      function: 'Converts light into electrical signals for the brain',
      icon: 'eye'
    },
    {
      part: 'Optic Nerve',
      description: 'Bundle of nerve fibers connecting eye to brain',
      function: 'Transmits visual information to the brain',
      icon: 'connection'
    }
  ];

  const eyeHealthTips = [
    {
      title: 'Regular Eye Exams',
      description: 'Get comprehensive eye exams every 1-2 years',
      importance: 'high',
      icon: 'medical-bag'
    },
    {
      title: '20-20-20 Rule',
      description: 'Every 20 minutes, look at something 20 feet away for 20 seconds',
      importance: 'medium',
      icon: 'clock-outline'
    },
    {
      title: 'Proper Lighting',
      description: 'Use adequate lighting when reading or working',
      importance: 'medium',
      icon: 'lightbulb-outline'
    },
    {
      title: 'UV Protection',
      description: 'Wear sunglasses with UV protection outdoors',
      importance: 'high',
      icon: 'sunglasses'
    },
    {
      title: 'Healthy Diet',
      description: 'Eat foods rich in omega-3s, vitamins C & E, zinc',
      importance: 'medium',
      icon: 'food-apple'
    },
    {
      title: 'Stay Hydrated',
      description: 'Drink plenty of water to maintain eye moisture',
      importance: 'low',
      icon: 'water'
    }
  ];

  const commonEyeConditions = [
    {
      name: 'Myopia (Nearsightedness)',
      prevalence: '42%',
      description: 'Difficulty seeing distant objects clearly',
      symptoms: ['Squinting', 'Eye strain', 'Headaches'],
    },
    {
      name: 'Hyperopia (Farsightedness)',
      prevalence: '25%',
      description: 'Difficulty seeing close objects clearly',
      symptoms: ['Eye strain', 'Fatigue', 'Blurred near vision'],
    },
    {
      name: 'Astigmatism',
      prevalence: '33%',
      description: 'Irregular cornea shape causing blurred vision',
      symptoms: ['Blurred vision', 'Eye strain', 'Distorted vision'],
    },
    {
      name: 'Dry Eyes',
      prevalence: '16%',
      description: 'Insufficient tear production or quality',
      symptoms: ['Burning', 'Itching', 'Redness', 'Light sensitivity'],
    }
  ];

  const renderAnatomySection = () => (
    <View>
      <Text variant="headlineSmall" style={styles.sectionTitle}>
        Eye Anatomy
      </Text>
      {eyeAnatomyData.map((item, index) => (
        <Card key={index} style={styles.anatomyCard} elevation={2}>
          <Card.Content>
            <View style={styles.anatomyHeader}>
              <IconButton 
                icon={item.icon} 
                size={24} 
                iconColor="#3b82f6"
                style={styles.anatomyIcon}
              />
              <Text variant="titleMedium" style={styles.anatomyTitle}>
                {item.part}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.anatomyDescription}>
              {item.description}
            </Text>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.anatomyFunction}>
              <Text style={styles.functionLabel}>Function: </Text>
              {item.function}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderHealthTipsSection = () => (
    <View>
      <Text variant="headlineSmall" style={styles.sectionTitle}>
        Eye Health Tips
      </Text>
      {eyeHealthTips.map((tip, index) => (
        <Card key={index} style={styles.tipCard} elevation={2}>
          <Card.Content>
            <View style={styles.tipHeader}>
              <IconButton 
                icon={tip.icon} 
                size={24} 
                iconColor={tip.importance === 'high' ? '#ef4444' : tip.importance === 'medium' ? '#f59e0b' : '#10b981'}
                style={styles.tipIcon}
              />
              <View style={styles.tipTitleContainer}>
                <Text variant="titleMedium" style={styles.tipTitle}>
                  {tip.title}
                </Text>
                <Chip 
                  mode="outlined" 
                  compact 
                  style={[styles.importanceChip, {
                    borderColor: tip.importance === 'high' ? '#ef4444' : tip.importance === 'medium' ? '#f59e0b' : '#10b981'
                  }]}
                  textStyle={{
                    color: tip.importance === 'high' ? '#ef4444' : tip.importance === 'medium' ? '#f59e0b' : '#10b981',
                    fontSize: 10
                  }}
                >
                  {tip.importance.toUpperCase()}
                </Chip>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.tipDescription}>
              {tip.description}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderConditionsSection = () => (
    <View>
      <Text variant="headlineSmall" style={styles.sectionTitle}>
        Common Eye Conditions
      </Text>
      {commonEyeConditions.map((condition, index) => (
        <Card key={index} style={styles.conditionCard} elevation={2}>
          <Card.Content>
            <View style={styles.conditionHeader}>
              <Text variant="titleMedium" style={styles.conditionName}>
                {condition.name}
              </Text>
              <Chip mode="flat" style={styles.prevalenceChip}>
                {condition.prevalence} affected
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.conditionDescription}>
              {condition.description}
            </Text>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.symptomsLabel}>
              Common Symptoms:
            </Text>
            <View style={styles.symptomsContainer}>
              {condition.symptoms.map((symptom, idx) => (
                <Chip 
                  key={idx} 
                  mode="outlined" 
                  compact 
                  style={styles.symptomChip}
                  textStyle={styles.symptomText}
                >
                  {symptom}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderTabButtons = () => (
    <Surface style={styles.tabContainer} elevation={1}>
      <Button
        mode={selectedSection === 'anatomy' ? 'contained' : 'outlined'}
        onPress={() => setSelectedSection('anatomy')}
        style={styles.tabButton}
        compact
      >
        Anatomy
      </Button>
      <Button
        mode={selectedSection === 'tips' ? 'contained' : 'outlined'}
        onPress={() => setSelectedSection('tips')}
        style={styles.tabButton}
        compact
      >
        Health Tips
      </Button>
      <Button
        mode={selectedSection === 'conditions' ? 'contained' : 'outlined'}
        onPress={() => setSelectedSection('conditions')}
        style={styles.tabButton}
        compact
      >
        Conditions
      </Button>
    </Surface>
  );

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        {/* Custom Burger Menu */}
        <BurgerMenu />

        {/* Header */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.eyeIcon}>
              <View style={styles.eyeOuter}>
                <View style={styles.eyeInner}>
                  <View style={styles.pupil} />
                </View>
              </View>
            </View>
            <Text style={styles.headerTitle}>Eye Health Guide</Text>
            <Text style={styles.headerSubtitle}>Learn about your vision</Text>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        {renderTabButtons()}

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedSection === 'anatomy' && renderAnatomySection()}
          {selectedSection === 'tips' && renderHealthTipsSection()}
          {selectedSection === 'conditions' && renderConditionsSection()}
        </ScrollView>

        {/* Quick Scan Button */}
        <Surface style={styles.quickScanContainer} elevation={4}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('EyeScan')}
            style={styles.quickScanButton}
            contentStyle={styles.quickScanContent}
            icon="camera-outline"
          >
            Start Eye Scan
          </Button>
        </Surface>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Burger Menu Styles
  burgerContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  burgerButton: {
    width: 30,
    height: 25,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  burgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  // Sidebar Styles - Fixed and Restructured
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarContent: {
    flex: 1,
    flexDirection: 'column',
  },
  sidebarHeader: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sidebarEyeIcon: {
    marginBottom: 10,
  },
  sidebarEyeOuter: {
    width: 50,
    height: 35,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarEyeInner: {
    width: 38,
    height: 24,
    backgroundColor: '#e0f2fe',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarPupil: {
    width: 10,
    height: 10,
    backgroundColor: '#1e3a8a',
    borderRadius: 5,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: '#e0f2fe',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  menuIcon: {
    margin: 0,
    marginRight: 15,
  },
  menuLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  // Fixed logout container styles
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
    paddingHorizontal: 10,
    paddingBottom: 20,
    marginTop: 'auto', // This pushes the logout to the bottom
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  logoutLabel: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
    flex: 1,
  },
  // Existing styles...
  header: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  eyeIcon: {
    marginBottom: 15,
  },
  eyeOuter: {
    width: 60,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  eyeInner: {
    width: 45,
    height: 28,
    backgroundColor: '#e0f2fe',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 15,
    height: 15,
    backgroundColor: '#1e3a8a',
    borderRadius: 7.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Anatomy Styles
  anatomyCard: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  anatomyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  anatomyIcon: {
    margin: 0,
    marginRight: 10,
  },
  anatomyTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    flex: 1,
  },
  anatomyDescription: {
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  anatomyFunction: {
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  functionLabel: {
    fontWeight: 'bold',
    color: '#1e40af',
  },
  // Health Tips Styles
  tipCard: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipIcon: {
    margin: 0,
    marginRight: 10,
  },
  tipTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    flex: 1,
  },
  importanceChip: {
    height: 25,
  },
  tipDescription: {
    color: '#64748b',
    lineHeight: 22,
  },
  // Conditions Styles
  conditionCard: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  conditionName: {
    color: '#1e40af',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  prevalenceChip: {
    backgroundColor: '#ddd6fe',
  },
  conditionDescription: {
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 10,
  },
  symptomsLabel: {
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    marginBottom: 5,
    borderColor: '#94a3b8',
  },
  symptomText: {
    fontSize: 12,
    color: '#475569',
  },
  // Quick Scan Button
  quickScanContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
  },
  quickScanButton: {
    borderRadius: 25,
  },
  quickScanContent: {
    height: 50,
  },
});