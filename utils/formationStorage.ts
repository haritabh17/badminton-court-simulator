import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customizations } from '../context/MarkerCustomizationContext';
import { PlayerPosition } from '../types/game';

export interface SavedFormation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDoubles: boolean;
  positionHistory: PositionHistoryEntry[];
  customizations: Customizations;
}

export interface PositionHistoryEntry {
  players: {
    team1: PlayerPosition[];
    team2: PlayerPosition[];
  };
  shuttle: PlayerPosition;
  ghostPositions: {
    team1: PlayerPosition[];
    team2: PlayerPosition[];
    shuttle: PlayerPosition;
  };
}

const FORMATIONS_KEY = '@courtsim_formations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

async function getAllFormations(): Promise<SavedFormation[]> {
  try {
    const data = await AsyncStorage.getItem(FORMATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function setAllFormations(formations: SavedFormation[]): Promise<void> {
  await AsyncStorage.setItem(FORMATIONS_KEY, JSON.stringify(formations));
}

export async function saveFormation(
  name: string,
  isDoubles: boolean,
  positionHistory: PositionHistoryEntry[],
  customizations: Customizations
): Promise<SavedFormation> {
  const formation: SavedFormation = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDoubles,
    positionHistory,
    customizations,
  };

  const formations = await getAllFormations();
  formations.unshift(formation);
  await setAllFormations(formations);

  return formation;
}

export async function loadFormation(id: string): Promise<SavedFormation | null> {
  const formations = await getAllFormations();
  return formations.find(f => f.id === id) || null;
}

export async function listFormations(): Promise<SavedFormation[]> {
  return getAllFormations();
}

export async function deleteFormation(id: string): Promise<void> {
  const formations = await getAllFormations();
  const filtered = formations.filter(f => f.id !== id);
  await setAllFormations(filtered);
}

export async function renameFormation(id: string, newName: string): Promise<void> {
  const formations = await getAllFormations();
  const formation = formations.find(f => f.id === id);
  if (formation) {
    formation.name = newName;
    formation.updatedAt = new Date().toISOString();
    await setAllFormations(formations);
  }
}
