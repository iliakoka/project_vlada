import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, push, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDXwtvpmV_5gQaGNX62_09WW-JH2O-A6G8',
  authDomain: 'project-v-metrics.firebaseapp.com',
  projectId: 'project-v-metrics',
  storageBucket: 'project-v-metrics.firebasestorage.app',
  messagingSenderId: '754811945497',
  appId: '1:754811945497:web:a32a41a4f11b0a2bc8a088',
  measurementId: 'G-6YBDD21X57',
  databaseURL: 'https://project-v-metrics-default-rtdb.firebaseio.com'
};

export interface KeystrokeSnapshot {
  timestamp: string;
  action: 'typing' | 'deleting' | 'cleared';
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly db: Database;

  constructor() {
    // Prevent re-initializing if already initialized (e.g. hot reload)
    this.app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];

    this.db = getDatabase(this.app);
  }

  /**
   * Pushes a single keystroke snapshot into:
   * /sessions/{sessionId}/typing_timeline/{auto_key}
   */
  pushKeystrokeSnapshot(sessionId: string, snapshot: KeystrokeSnapshot): void {
    const path = ref(this.db, `sessions/${sessionId}/typing_timeline`);
    push(path, snapshot).catch((err) => {
      console.error('[FirebaseService] Failed to push keystroke snapshot:', err);
    });
  }
}
