import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Text as PaperText } from 'react-native-paper';
import { PlayerMarker } from './PlayerMarker';
import { IconButton } from './IconButton';
import { useCourtPositions } from '../hooks/useCourtPositions';
import { PositionTrail } from './PositionTrail';
import { SettingsPanel } from './SettingsPanel';
import { useMarkerCustomization } from '../context/MarkerCustomizationContext';
import { SaveFormationModal } from './SaveFormationModal';
import { saveFormation, SavedFormation } from '../utils/formationStorage';

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
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { customizations, updateMarkerCustomization } = useMarkerCustomization();

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
    positionHistory,
    loadFormation,
    hasUnsavedChanges,
  } = useCourtPositions({ width: courtWidth, height: courtHeight });

  const handleSaveFormation = async (name: string) => {
    try {
      await saveFormation(name, isDoubles, positionHistory, customizations);
      setRefreshTrigger(prev => prev + 1);
      Alert.alert('Saved!', `"${name}" has been saved.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save formation.');
    }
  };

  const handleLoadFormation = (formation: SavedFormation) => {
    const doLoad = () => {
      loadFormation(formation.positionHistory, formation.isDoubles);
      // Restore customizations
      Object.entries(formation.customizations).forEach(([key, value]) => {
        updateMarkerCustomization(key as any, value);
      });
    };

    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes on the current court. Load anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Load', onPress: doLoad },
        ]
      );
    } else {
      doLoad();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.banner}>
        <Appbar.Action icon="menu" onPress={() => setIsMenuVisible(true)} />
        <Appbar.Content title="Badminton Court Simulator" />
        <Appbar.Action icon="content-save" onPress={() => setIsSaveModalVisible(true)} />
      </Appbar.Header>

      <View style={[styles.courtWrapper, { marginBottom: BUTTON_CONTAINER_HEIGHT }]}>
        <View 
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
        </View>
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
              </View>

      <SettingsPanel
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onLoadFormation={handleLoadFormation}
        refreshTrigger={refreshTrigger}
      />

      <SaveFormationModal
        visible={isSaveModalVisible}
        onClose={() => setIsSaveModalVisible(false)}
        onSave={handleSaveFormation}
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