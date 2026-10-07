import { Beach } from '../models';
import data from '../../../data/beaches.json';

/**
 * Ενσωματωμένα δεδομένα παραλιών.
 *
 * Η μόνη πηγή αλήθειας είναι το αρχείο data/beaches.json στη ρίζα του repo.
 * Η εφαρμογή το διαβάζει ζωντανά από το GitHub (βλ. config.ts), και αυτό εδώ είναι το
 * αντίγραφο που μπαίνει μέσα στην εφαρμογή για όταν δεν υπάρχει ίντερνετ.
 */
export const BEACHES: Beach[] = (data.beaches as (Beach & { active?: boolean })[]).filter((b) => b.active !== false);
