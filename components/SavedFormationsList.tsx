import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, FlatList } from 'react-native';
import { Card, Title, Text as PaperText, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SavedFormation, listFormations, deleteFormation } from '../utils/formationStorage';

interface SavedFormationsListProps {
  onLoad: (formation: SavedFormation) => void;
  refreshTrigger?: number;
}

export function SavedFormationsList({ onLoad, refreshTrigger }: SavedFormationsListProps) {
  const [formations, setFormations] = useState<SavedFormation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const loaded = await listFormations();
    setFormations(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshTrigger]);

  const handleDelete = (formation: SavedFormation) => {
    Alert.alert(
      'Delete Formation',
      `Delete "${formation.name}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFormation(formation.id);
            refresh();
          },
        },
      ]
    );
  };

  const handleLoad = (formation: SavedFormation) => {
    onLoad(formation);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (formations.length === 0 && !loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Saved Formations</Title>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-open-outline" size={40} color="#ccc" />
            <PaperText style={styles.emptyText}>No saved formations yet</PaperText>
            <PaperText style={styles.emptySubtext}>
              Tap the save icon in the top bar to save your current formation
            </PaperText>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Saved Formations</Title>
        {formations.map((formation, index) => (
          <View key={formation.id}>
            {index > 0 && <Divider style={styles.divider} />}
            <View style={styles.formationItem}>
              <View style={styles.formationIcon}>
                <MaterialCommunityIcons
                  name={formation.isDoubles ? 'account-group' : 'account'}
                  size={24}
                  color="#666"
                />
              </View>
              <View style={styles.formationInfo}>
                <PaperText style={styles.formationName}>{formation.name}</PaperText>
                <PaperText style={styles.formationDate}>
                  {formatDate(formation.updatedAt)} • {formation.positionHistory.length} steps
                </PaperText>
              </View>
              <View style={styles.formationActions}>
                <IconButton
                  icon="play-circle-outline"
                  size={24}
                  iconColor="#2196F3"
                  onPress={() => handleLoad(formation)}
                />
                <IconButton
                  icon="delete-outline"
                  size={24}
                  iconColor="#f44336"
                  onPress={() => handleDelete(formation)}
                />
              </View>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
  formationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  formationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formationInfo: {
    flex: 1,
  },
  formationName: {
    fontSize: 15,
    fontWeight: '600',
  },
  formationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  formationActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 4,
  },
});
