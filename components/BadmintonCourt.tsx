import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, Alert, Text, SafeAreaView, StatusBar, Platform } from 'react-native';
import { PlayerMarker } from './PlayerMarker';
import { useCourtPositions } from '../hooks/useCourtPositions';
import { PositionTrail } from './PositionTrail';
import { SettingsPanel } from './SettingsPanel';
import { useMarkerCustomization } from '../context/MarkerCustomizationContext';
import { SaveFormationModal } from './SaveFormationModal';
import { saveFormation, SavedFormation } from '../utils/formationStorage';

// Tab button using emoji (no icon font dependency)
function TabButton({ emoji, label, onPress, active, disabled }: {
  emoji: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, disabled && styles.tabButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Text style={{ fontSize: 20, opacity: disabled ? 0.3 : 1 }}>{emoji}</Text>
      <Text style={[
        styles.tabLabel,
        active && styles.tabLabelActive,
        disabled && styles.tabLabelDisabled,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BadmintonCourt() {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const TAB_BAR_HEIGHT = 56;
  const HEADER_HEIGHT = 56;
  const availableHeight = screenHeight - TAB_BAR_HEIGHT - HEADER_HEIGHT - 20;
  
  const courtWidth = screenWidth;
  const courtHeight = availableHeight;

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

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight, height: 56 + statusBarHeight }]}>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.headerButton}>
          <Text style={{ fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Badminton Court Simulator</Text>
          <Text style={{ fontSize: 10, color: '#999' }}>beta-11</Text>
        </View>
        <TouchableOpacity onPress={resetPositions} style={styles.headerButton}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Court */}
      <View style={styles.courtWrapper}>
        <View style={[styles.courtContainer, { width: courtWidth, height: courtHeight }]}>
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

      {/* FAB - Save Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsSaveModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 26, color: '#fff' }}>💾</Text>
      </TouchableOpacity>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton
          emoji={isDoubles ? "👥" : "👤"}
          label={isDoubles ? "Doubles" : "Singles"}
          onPress={() => toggleGameMode(!isDoubles)}
        />
        <TabButton
          emoji="↩️"
          label="Undo"
          onPress={undo}
          disabled={!canUndo}
        />
        <TabButton
          emoji="↪️"
          label="Redo"
          onPress={redo}
          disabled={!canRedo}
        />
        <TabButton
          emoji="👣"
          label="Trails"
          onPress={togglePlayerTrails}
          active={showPlayerTrails}
        />
        <TabButton
          emoji="⚙️"
          label="Settings"
          onPress={() => setIsMenuVisible(true)}
        />
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
    backgroundColor: '#f5f5f5',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  // Court
  courtWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtContainer: {
    position: 'relative',
  },
  courtImage: {
    width: '100%',
    height: '100%',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 76,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabButtonDisabled: {
    opacity: 0.4,
  },
  tabLabel: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#2196F3',
  },
  tabLabelDisabled: {
    color: '#ccc',
  },
});
