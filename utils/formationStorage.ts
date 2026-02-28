import * as FileSystem from 'expo-file-system';
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

const FORMATIONS_DIR = `${FileSystem.documentDirectory}formations/`;
const INDEX_FILE = `${FORMATIONS_DIR}index.json`;

async function ensureDirectoryExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(FORMATIONS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(FORMATIONS_DIR, { intermediates: true });
  }
}

async function getIndex(): Promise<string[]> {
  try {
    const indexInfo = await FileSystem.getInfoAsync(INDEX_FILE);
    if (!indexInfo.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(INDEX_FILE);
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveIndex(ids: string[]): Promise<void> {
  await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify(ids));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export async function saveFormation(
  name: string,
  isDoubles: boolean,
  positionHistory: PositionHistoryEntry[],
  customizations: Customizations
): Promise<SavedFormation> {
  await ensureDirectoryExists();
  
  const formation: SavedFormation = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDoubles,
    positionHistory,
    customizations,
  };

  const filePath = `${FORMATIONS_DIR}${formation.id}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(formation));

  const index = await getIndex();
  index.unshift(formation.id);
  await saveIndex(index);

  return formation;
}

export async function loadFormation(id: string): Promise<SavedFormation | null> {
  try {
    const filePath = `${FORMATIONS_DIR}${id}.json`;
    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function listFormations(): Promise<SavedFormation[]> {
  await ensureDirectoryExists();
  const index = await getIndex();
  const formations: SavedFormation[] = [];

  for (const id of index) {
    const formation = await loadFormation(id);
    if (formation) {
      formations.push(formation);
    }
  }

  return formations;
}

export async function deleteFormation(id: string): Promise<void> {
  try {
    const filePath = `${FORMATIONS_DIR}${id}.json`;
    await FileSystem.deleteAsync(filePath, { idempotent: true });

    const index = await getIndex();
    const newIndex = index.filter(i => i !== id);
    await saveIndex(newIndex);
  } catch {
    // Silently handle deletion errors
  }
}

export async function renameFormation(id: string, newName: string): Promise<void> {
  const formation = await loadFormation(id);
  if (formation) {
    formation.name = newName;
    formation.updatedAt = new Date().toISOString();
    const filePath = `${FORMATIONS_DIR}${id}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(formation));
  }
}
