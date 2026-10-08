/**
 * Σύνδεση με το backend (Firebase / Cloud Firestore).
 *
 * Τις τιμές τις βρίσκεις στο Firebase Console:
 *   ⚙️ Project settings → General → Your apps → (η web εφαρμογή) → SDK setup and configuration → Config
 * Αντέγραψε apiKey, authDomain, projectId και appId.
 *
 * Αυτές οι τιμές ΔΕΝ είναι μυστικές: είναι φτιαγμένες για να μπαίνουν σε εφαρμογές.
 * Την ασφάλεια την κάνουν οι κανόνες του Firestore (firestore.rules): όλοι διαβάζουν,
 * μόνο ο διαχειριστής γράφει.
 *
 * Όσο μένουν κενές, η εφαρμογή διαβάζει τις παραλίες από το data/beaches.json στο GitHub.
 */
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

export const firebaseConfigured = () => !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

/** Εφεδρεία όταν δεν υπάρχει Firebase ή δεν απαντά. */
export const BEACHES_URL = 'https://raw.githubusercontent.com/NTheodoris/new_app/main/data/beaches.json';

/** Ονόματα συλλογών στο Firestore. */
export const BEACHES_COLLECTION = 'beaches';
/** Ένα έγγραφο με τον αριθμό έκδοσης: αλλάζει σε κάθε αποθήκευση από τη σελίδα διαχείρισης. */
export const META_DOC = 'meta/beaches';
