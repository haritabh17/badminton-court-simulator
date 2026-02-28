import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Dimensions, Animated, Text, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Switch, 
  Divider,
  List,
  Chip,
  Text as PaperText,
  IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMarkerCustomization, MarkerId, IconType } from '../context/MarkerCustomizationContext';
import { IconCustomizationModal } from './IconCustomizationModal';
import { SavedFormationsList } from './SavedFormationsList';
import { SavedFormation } from '../utils/formationStorage';

// Reusable component for player/shuttle items
interface MarkerItemProps {
  markerId: MarkerId;
  title: string;
  customizations: any;
  updateMarkerCustomization: (markerId: MarkerId, customization: any) => void;
}



function MarkerItem({ markerId, title, customizations, updateMarkerCustomization }: MarkerItemProps) {
  const customization = customizations[markerId];
  const [showIconCustomization, setShowIconCustomization] = useState(false);
  
  // Convert current color to hue value (0-360)
  const getHueFromColor = (color: string) => {
    // Handle white and black specially
    if (color === '#ffffff') return 0; // White - keep at red position but maintain white
    if (color === '#000000') return 0; // Black - keep at red position but maintain black
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Convert RGB to HSL
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return { h: h * 360, s, l };
    };

    const rgb = hexToRgb(color);
    if (!rgb) return 0;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.h;
  };
  
  const currentHue = getHueFromColor(customization.color);
  
  const updateColor = (hue: number) => {
    // Convert hue to hex color with full saturation and medium lightness
    const hueToHex = (h: number) => {
      const normalizedHue = h % 360;
      
      // Special handling for white/black - if we're at hue 0 and the current color is white/black, maintain it
      if (normalizedHue === 0) {
        const currentColor = customizations[markerId].color;
        if (currentColor === '#ffffff' || currentColor === '#000000') {
          return currentColor; // Keep the current white/black color
        }
      }
      
      const saturation = 1; // Full saturation for vibrant colors
      const lightness = 0.5; // Medium lightness for solid colors
      
      // Convert HSL to RGB
      const hueToRgb = (h: number, s: number, l: number) => {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (h < 60) {
          [r, g, b] = [c, x, 0];
        } else if (h < 120) {
          [r, g, b] = [x, c, 0];
        } else if (h < 180) {
          [r, g, b] = [0, c, x];
        } else if (h < 240) {
          [r, g, b] = [0, x, c];
        } else if (h < 300) {
          [r, g, b] = [x, 0, c];
        } else {
          [r, g, b] = [c, 0, x];
        }
        
        const toHex = (n: number) => {
          const hex = Math.round((n + m) * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      
      return hueToRgb(normalizedHue, saturation, lightness);
    };
    
    updateMarkerCustomization(markerId, { color: hueToHex(hue) });
  };
  
  return (
    <View style={styles.markerItemContainer}>
              <View style={styles.markerItemRow}>
          <TouchableOpacity
            onPress={() => markerId !== 'Shuttle' && setShowIconCustomization(true)}
            disabled={markerId === 'Shuttle'}
            style={[
              styles.markerPreview,
              {
                backgroundColor: customization.color,
                borderColor: customization.color === '#ffffff' ? '#000000' : 'white',
                width: Math.min(customization.size * 0.8, 45),
                height: Math.min(customization.size * 0.8, 45),
                borderRadius: Math.min(customization.size * 0.8, 45) / 2,
                opacity: markerId === 'Shuttle' ? 0.6 : 1,
              }
            ]}
          >
          {customization.iconType === 'icon' && (
            <MaterialCommunityIcons
              name={customization.icon as any}
              size={Math.min(customization.size * 0.8, 45) * 0.6}
              color={customization.color === '#ffffff' ? '#000000' : 'white'}
            />
          )}
          {customization.iconType === 'text' && (
            <Text style={[
              styles.textIcon,
              {
                fontSize: Math.min(customization.size * 0.8, 45) * 0.4,
                color: customization.color === '#ffffff' ? '#000000' : 'white'
              }
            ]}>
              {customization.icon}
            </Text>
          )}
          {customization.iconType === 'photo' && (
            <Image
              source={{ uri: customization.icon }}
              style={[
                styles.photoIcon,
                {
                  width: Math.min(customization.size * 0.8, 45) * 0.8,
                  height: Math.min(customization.size * 0.8, 45) * 0.8,
                  borderRadius: Math.min(customization.size * 0.8, 45) * 0.4,
                }
              ]}
            />
          )}
        </TouchableOpacity>
        <View style={styles.colorSliderContainer}>
          <View style={styles.colorSliderTrack}>
            <LinearGradient
              colors={['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.colorGradient}
            />
            <Slider
              style={styles.colorSlider}
              minimumValue={0}
              maximumValue={360}
              value={currentHue}
              onValueChange={(value) => updateColor(Math.round(value))}
              minimumTrackTintColor="transparent"
              maximumTrackTintColor="transparent"
              thumbStyle={{ backgroundColor: customization.color, borderWidth: 2, borderColor: '#000' }}
            />
          </View>
        </View>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={20}
            maximumValue={80}
            value={customization.size}
            onValueChange={(value) => updateMarkerCustomization(markerId, { size: Math.round(value) })}
            minimumTrackTintColor="#000000"
            maximumTrackTintColor="#000000"
            thumbStyle={{ backgroundColor: "#000000" }}
          />
        </View>
      </View>

      {markerId !== 'Shuttle' && (
        <IconCustomizationModal
          visible={showIconCustomization}
          onClose={() => setShowIconCustomization(false)}
          onSave={(type: IconType, value: string) => {
            updateMarkerCustomization(markerId, { 
              icon: value, 
              iconType: type 
            });
          }}
          currentValue={customization.icon}
          currentType={customization.iconType}
          markerId={markerId}
          currentColor={customization.color}
        />
      )}
    </View>
  );
}

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onLoadFormation?: (formation: SavedFormation) => void;
  refreshTrigger?: number;
}

export function SettingsPanel({ isVisible, onClose, onLoadFormation, refreshTrigger }: SettingsPanelProps) {
  const { customizations, updateMarkerCustomization, resetCustomizations } = useMarkerCustomization();
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  
  // Use a separate animated value for height to avoid conflicts
  const heightAnim = useRef(new Animated.Value(screenHeight * 0.5)).current;
  
  // Update height based on scroll with debouncing
  React.useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const newHeight = Math.max(
        screenHeight * 0.5,
        Math.min(screenHeight * 0.95, screenHeight * 0.5 + (value * 0.225))
      );
      heightAnim.setValue(newHeight);
    });
    
    return () => scrollY.removeListener(listener);
  }, [scrollY, heightAnim, screenHeight]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View style={[
          styles.bottomSheet,
          {
            height: heightAnim,
          }
        ]}>
          <View style={styles.header}>
            <Title style={styles.headerTitle}>Settings</Title>
          </View>
          <Animated.ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={32}
            bounces={false}
            decelerationRate="normal"
          >
        {onLoadFormation && (
          <SavedFormationsList
            onLoad={(formation) => {
              onLoadFormation(formation);
              onClose();
            }}
            refreshTrigger={refreshTrigger}
          />
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Title>Player Customization</Title>
            <Paragraph>Customize the appearance of players and shuttle</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Team 1</Title>
            <View style={styles.playerSection}>
              <MarkerItem
                markerId="P1"
                title="Player 1"
                customizations={customizations}
                updateMarkerCustomization={updateMarkerCustomization}
              />
              <MarkerItem
                markerId="P2"
                title="Player 2"
                customizations={customizations}
                updateMarkerCustomization={updateMarkerCustomization}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Team 2</Title>
            <View style={styles.playerSection}>
              <MarkerItem
                markerId="P3"
                title="Player 3"
                customizations={customizations}
                updateMarkerCustomization={updateMarkerCustomization}
              />
              <MarkerItem
                markerId="P4"
                title="Player 4"
                customizations={customizations}
                updateMarkerCustomization={updateMarkerCustomization}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Shuttle</Title>
            <MarkerItem
              markerId="Shuttle"
              title="Shuttlecock"
              customizations={customizations}
              updateMarkerCustomization={updateMarkerCustomization}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.buttonGroup}>
              <Button 
                mode="outlined" 
                onPress={resetCustomizations}
                icon="refresh"
                style={styles.actionButton}
              >
                Reset All
              </Button>
            </View>
          </Card.Content>
        </Card>
                        </Animated.ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  playerSection: {
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  markerItemContainer: {
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  markerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markerPreview: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorSliderContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  colorSliderTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  colorGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  colorSlider: {
    width: '100%',
    height: 30,
    position: 'absolute',
    top: -9,
  },
  sliderContainer: {
    width: 140,
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  slider: {
    width: 100,
    height: 30,
  },
  textIcon: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  photoIcon: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
}); 