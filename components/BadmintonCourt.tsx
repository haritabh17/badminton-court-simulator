import React, { useState, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Text as PaperText } from 'react-native-paper';
import { PlayerMarker } from './PlayerMarker';
import { IconButton } from './IconButton';
import { useCourtPositions } from '../hooks/useCourtPositions';
import { PositionTrail } from './PositionTrail';
import { SettingsPanel } from './SettingsPanel';
import { useMarkerCustomization } from '../context/MarkerCustomizationContext';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export default function BadmintonCourt() {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const BUTTON_CONTAINER_HEIGHT = 75;
  const BANNER_HEIGHT = 50;
  const availableHeight = screenHeight - 2.2*BUTTON_CONTAINER_HEIGHT - BANNER_HEIGHT;
  
  // Without rotation, use normal width/height mapping
  const courtWidth = screenWidth;      // Container width matches screen width
  const courtHeight = availableHeight; // Container height matches available height

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { customizations, updateMarkerCustomization } = useMarkerCustomization();
  const courtRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      if (!courtRef.current?.capture) return;
      const uri = await courtRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Formation',
        });
      } else {
        // Fallback: save to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Saved!', 'Formation saved to your gallery.');
        } else {
          Alert.alert('Permission needed', 'Please allow access to save the image.');
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share formation.');
    }
  };

  const handleSaveToGallery = async () => {
    try {
      if (!courtRef.current?.capture) return;
      const uri = await courtRef.current.capture();
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Saved!', 'Formation saved to your gallery.');
      } else {
        Alert.alert('Permission needed', 'Please allow access to save the image.');
      }
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save formation.');
    }
  };

  const {
    isDoubles,
    playerPositions,
    shuttlePosition,
    ghostPositions,
    updatePlayerPosition,
    updateShuttlePosition,
    handlePositionChangeComplete,
    toggleGameMode,
    resetPositions,
    undo,
    redo,
    canUndo,
    canRedo,
    showPlayerTrails,
    showShuttleTrail,
    togglePlayerTrails,
    toggleShuttleTrail,
  } = useCourtPositions({ width: courtWidth, height: courtHeight });

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.banner}>
        <Appbar.Action icon="menu" onPress={() => setIsMenuVisible(true)} />
        <Appbar.Content title="Badminton Court Simulator" />
      </Appbar.Header>

      <View style={[styles.courtWrapper, { marginBottom: BUTTON_CONTAINER_HEIGHT }]}>
        <ViewShot
          ref={courtRef}
          options={{ format: 'png', quality: 1.0 }}
          style={[
            styles.courtContainer, 
            { 
              width: courtWidth, 
              height: courtHeight,
            }
          ]}
        >
          <Image
            source={require('../assets/badminton-court.png')}
            style={styles.courtImage}
            resizeMode="stretch"
          />

          {showPlayerTrails && playerPositions.team1.map((pos, index) => (
            ghostPositions?.team1[index] && (
              <PositionTrail
                key={`trail-team1-${index}`}
                currentPosition={pos}
                ghostPosition={ghostPositions.team1[index]!}
                color={customizations[index === 0 ? 'P1' : 'P2'].color}
              />
            )
          ))}
          {showPlayerTrails && playerPositions.team2.map((pos, index) => (
            ghostPositions?.team2[index] && (
              <PositionTrail
                key={`trail-team2-${index}`}
                currentPosition={pos}
                ghostPosition={ghostPositions.team2[index]!}
                color={customizations[index === 0 ? 'P3' : 'P4'].color}
              />
            )
          ))}
          {showShuttleTrail && shuttlePosition && ghostPositions?.shuttle && (
            <PositionTrail
              currentPosition={shuttlePosition}
              ghostPosition={ghostPositions.shuttle}
              color={customizations.Shuttle.color}
            />
          )}

          {playerPositions.team1.map((pos, index) => (
            <PlayerMarker 
              key={`team1-${index}`}
              position={pos}
              color={customizations[index === 0 ? 'P1' : 'P2'].color}
              size={customizations[index === 0 ? 'P1' : 'P2'].size}
              isLeftHanded={customizations[index === 0 ? 'P1' : 'P2'].isLeftHanded}
              icon={customizations[index === 0 ? 'P1' : 'P2'].icon}
              iconType={customizations[index === 0 ? 'P1' : 'P2'].iconType}
              onPositionChange={(newPos) => updatePlayerPosition('team1', index, newPos)}
              onPositionStart={(newPos) => updatePlayerPosition('team1', index, newPos, true)}
              onPositionChangeComplete={handlePositionChangeComplete}
              onColorChange={(color) => updateMarkerCustomization(index === 0 ? 'P1' : 'P2', { color })}
              onSizeChange={(size) => updateMarkerCustomization(index === 0 ? 'P1' : 'P2', { size })}
              onIconChange={(icon) => updateMarkerCustomization(index === 0 ? 'P1' : 'P2', { icon })}
            />
          ))}
          {playerPositions.team2.map((pos, index) => (
            <PlayerMarker 
              key={`team2-${index}`}
              position={pos}
              color={customizations[index === 0 ? 'P3' : 'P4'].color}
              size={customizations[index === 0 ? 'P3' : 'P4'].size}
              isLeftHanded={customizations[index === 0 ? 'P3' : 'P4'].isLeftHanded}
              icon={customizations[index === 0 ? 'P3' : 'P4'].icon}
              iconType={customizations[index === 0 ? 'P3' : 'P4'].iconType}
              onPositionChange={(newPos) => updatePlayerPosition('team2', index, newPos)}
              onPositionStart={(newPos) => updatePlayerPosition('team2', index, newPos, true)}
              onPositionChangeComplete={handlePositionChangeComplete}
              onColorChange={(color) => updateMarkerCustomization(index === 0 ? 'P3' : 'P4', { color })}
              onSizeChange={(size) => updateMarkerCustomization(index === 0 ? 'P3' : 'P4', { size })}
              onIconChange={(icon) => updateMarkerCustomization(index === 0 ? 'P3' : 'P4', { icon })}
            />
          ))}

          <PlayerMarker
            position={shuttlePosition}
            color={customizations.Shuttle.color}
            size={customizations.Shuttle.size}
            icon={customizations.Shuttle.icon}
            iconType={customizations.Shuttle.iconType}
            onPositionChange={updateShuttlePosition}
            onPositionStart={(newPos) => updateShuttlePosition(newPos, true)}
            onPositionChangeComplete={handlePositionChangeComplete}
            onColorChange={(color) => updateMarkerCustomization('Shuttle', { color })}
            onSizeChange={(size) => updateMarkerCustomization('Shuttle', { size })}
            onIconChange={(icon) => updateMarkerCustomization('Shuttle', { icon })}
          />
        </ViewShot>
      </View>

      <View style={[styles.buttonContainer, { 
        height: BUTTON_CONTAINER_HEIGHT,
        bottom: 4
      }]}>
        {/* Left group: Game setup */}
        <View style={styles.buttonGroupContainer}>
          <PaperText variant="labelSmall" style={styles.buttonGroupLabel}>Game Setup</PaperText>
          <View style={styles.buttonGroup}>
            <IconButton
              icon="refresh"
              onPress={resetPositions}
            />
            <IconButton
              icon={isDoubles ? "account-group" : "account"}
              onPress={() => toggleGameMode(!isDoubles)}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Center group: History Navigation */}
        <View style={styles.buttonGroupContainer}>
          <PaperText variant="labelSmall" style={styles.buttonGroupLabel}>History</PaperText>
          <View style={styles.buttonGroup}>
            <IconButton
              icon="undo"
              onPress={undo}
              disabled={!canUndo}
            />
            <IconButton
              icon="redo"
              onPress={redo}
              disabled={!canRedo}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Right group: Trail Markers */}
        <View style={styles.buttonGroupContainer}>
          <PaperText variant="labelSmall" style={styles.buttonGroupLabel}>Trails</PaperText>
          <View style={styles.buttonGroup}>
            <IconButton
              icon="shoe-print"
              onPress={togglePlayerTrails}
              active={showPlayerTrails}
            />
            <IconButton
              icon="badminton"
              onPress={toggleShuttleTrail}
              active={showShuttleTrail}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Share group */}
        <View style={styles.buttonGroupContainer}>
          <PaperText variant="labelSmall" style={styles.buttonGroupLabel}>Share</PaperText>
          <View style={styles.buttonGroup}>
            <IconButton
              icon="share-variant"
              onPress={handleShare}
            />
            <IconButton
              icon="content-save"
              onPress={handleSaveToGallery}
            />
          </View>
        </View>
              </View>

      <SettingsPanel
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  courtContainer: {
    position: 'relative',
  },
  courtImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginHorizontal: 10,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  banner: {
    width: '100%',
    backgroundColor: '#ffffff',
  },
  buttonGroupLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  buttonGroupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
}); 