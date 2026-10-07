import { Beach } from '../models';

/**
 * Παραλίες της Λέσβου.
 *
 * facing   = προς ποια κατεύθυνση "κοιτάει" η παραλία (μοίρες, 0 = Βορράς, 90 = Ανατολή).
 *            Ο άνεμος που φυσάει ΑΠΟ αυτή την κατεύθυνση έρχεται από τη θάλασσα και φέρνει κύμα.
 * exposure = πόσο ανοιχτή είναι στο πέλαγος (1 = ανοιχτό πέλαγος, 0.3 = κλειστός κόλπος).
 *
 * Οι συντεταγμένες και οι προσανατολισμοί είναι κατά προσέγγιση και καλό είναι
 * να ελεγχθούν επί τόπου / σε χάρτη πριν από δημοσίευση.
 */
export const BEACHES: Beach[] = [
  // ---------- Βόρεια ακτή ----------
  {
    id: 'molyvos', lat: 39.3655, lon: 26.1725, facing: 265, exposure: 0.8,
    name: { el: 'Μόλυβος', en: 'Molyvos' }, area: { el: 'Μήθυμνα', en: 'Mithymna' },
    surface: 'pebbles', organized: true, tags: ['tavern', 'sunset', 'snorkel'],
    desc: {
      el: 'Στενή παραλία κάτω από το κάστρο, με καφέ και ταβέρνες. Βότσαλο και βράχια — πάρε παπούτσια θαλάσσης.',
      en: 'Narrow strip below the castle with cafés and tavernas. Pebbles and rocks — bring water shoes.',
    },
  },
  {
    id: 'delfinia', lat: 39.3520, lon: 26.1760, facing: 275, exposure: 0.8,
    name: { el: 'Δελφίνια (Μόλυβος)', en: 'Delfinia (Molyvos)' }, area: { el: 'Μήθυμνα', en: 'Mithymna' },
    surface: 'sand', organized: true, tags: ['family', 'sunset'],
    desc: {
      el: 'Αμμώδης οργανωμένη παραλία νότια του Μολύβου, περίπου 20 λεπτά με τα πόδια από την πόλη.',
      en: 'Organised sandy beach south of Molyvos, about a 20-minute walk from town.',
    },
  },
  {
    id: 'petra', lat: 39.3255, lon: 26.1785, facing: 290, exposure: 0.8,
    name: { el: 'Πέτρα', en: 'Petra' }, area: { el: 'Πέτρα', en: 'Petra' },
    surface: 'sand', organized: true, tags: ['family', 'tavern', 'sunset'],
    desc: {
      el: 'Μεγάλη αμμώδης παραλία μπροστά στο χωριό, με όλες τις παροχές. Ανέβα στην Παναγία τη Γλυκοφιλούσα για θέα.',
      en: 'Long sandy beach in front of the village with all amenities. Climb to the rock-top church for the view.',
    },
  },
  {
    id: 'anaxos', lat: 39.3125, lon: 26.1610, facing: 260, exposure: 0.8,
    name: { el: 'Άναξος', en: 'Anaxos' }, area: { el: 'Σκουτάρος', en: 'Skoutaros' },
    surface: 'mixed', organized: true, tags: ['family', 'sunset', 'quiet'],
    desc: {
      el: 'Ήσυχος κόλπος νότια της Πέτρας, με ρηχά νερά και υπέροχα ηλιοβασιλέματα.',
      en: 'Quiet bay south of Petra with shallow water and lovely sunsets.',
    },
  },
  {
    id: 'eftalou', lat: 39.3780, lon: 26.2250, facing: 10, exposure: 1,
    name: { el: 'Εφταλού', en: 'Eftalou' }, area: { el: 'Μήθυμνα', en: 'Mithymna' },
    surface: 'pebbles', organized: false, tags: ['hotspring', 'quiet', 'nudist'],
    desc: {
      el: 'Βοτσαλωτή ακτή με θερμές πηγές δίπλα στη θάλασσα. Εκτεθειμένη στους βοριάδες.',
      en: 'Pebbly coast with hot springs right by the sea. Exposed to northerly winds.',
    },
  },
  {
    id: 'skala-sykamineas', lat: 39.3720, lon: 26.3060, facing: 0, exposure: 1,
    name: { el: 'Σκάλα Συκαμινέας', en: 'Skala Sykamineas' }, area: { el: 'Συκαμινιά', en: 'Sykaminia' },
    surface: 'pebbles', organized: false, tags: ['tavern', 'quiet'],
    desc: {
      el: 'Γραφικό ψαροχώρι με το εκκλησάκι της Γοργόνας και ψαροταβέρνες πάνω στο κύμα.',
      en: 'Picturesque fishing harbour with the "Mermaid" chapel and seaside fish tavernas.',
    },
  },
  {
    id: 'tsonia', lat: 39.3170, lon: 26.3950, facing: 35, exposure: 1,
    name: { el: 'Τσόνια', en: 'Tsonia' }, area: { el: 'Κλειό', en: 'Klio' },
    surface: 'sand', organized: false, tags: ['tavern', 'quiet', 'snorkel'],
    desc: {
      el: 'Απομονωμένη παραλία με κοκκινωπή άμμο, πεντακάθαρα νερά και ψαροταβέρνα.',
      en: 'Remote beach with reddish sand, crystal-clear water and a fish taverna.',
    },
  },
  {
    id: 'aspropotamos', lat: 39.2880, lon: 26.3990, facing: 75, exposure: 1,
    name: { el: 'Ασπροπόταμος', en: 'Aspropotamos' }, area: { el: 'Μανταμάδος', en: 'Mantamados' },
    surface: 'sand', organized: false, tags: ['quiet'],
    desc: {
      el: 'Μεγάλη αμμουδιά με λίγες παροχές. Συνδύασέ τη με επίσκεψη στα κεραμεία του Μανταμάδου.',
      en: 'Long sandy stretch with few facilities. Combine it with the potteries of Mantamados.',
    },
  },
  {
    id: 'kalo-limani', lat: 39.3080, lon: 26.0750, facing: 0, exposure: 0.9,
    name: { el: 'Καλό Λιμάνι', en: 'Kalo Limani' }, area: { el: 'Σκαλοχώρι', en: 'Skalochori' },
    surface: 'sand', organized: false, tags: ['tavern', 'quiet'],
    desc: {
      el: 'Η παραλία των ντόπιων του Σκαλοχωρίου, με ψαροταβέρνα. Γεμίζει το απόγευμα.',
      en: 'The local beach of Skalochori with a fish taverna. Busy in the afternoon.',
    },
  },
  // ---------- Δυτική Λέσβος ----------
  {
    id: 'gavathas', lat: 39.3080, lon: 25.9950, facing: 330, exposure: 0.9,
    name: { el: 'Γαβαθάς', en: 'Gavathas' }, area: { el: 'Άντισσα', en: 'Antissa' },
    surface: 'sand', organized: true, tags: ['family', 'tavern', 'sunset'],
    desc: {
      el: 'Ρηχή αμμουδιά, ιδανική για οικογένειες. Η βόρεια πλευρά παίρνει περισσότερο αέρα.',
      en: 'Shallow sandy beach, great for families. The northern end catches more wind.',
    },
  },
  {
    id: 'lapsarna', lat: 39.2990, lon: 26.0250, facing: 345, exposure: 0.9,
    name: { el: 'Λάψαρνα', en: 'Lapsarna' }, area: { el: 'Άντισσα', en: 'Antissa' },
    surface: 'sand', organized: false, tags: ['quiet', 'family'],
    desc: {
      el: 'Ρηχή, ήσυχη αμμουδιά χωρίς παροχές. Με βοριά σηκώνει κύμα.',
      en: 'Shallow, quiet sandy beach with no facilities. Gets waves with northerly winds.',
    },
  },
  {
    id: 'kampos-antissas', lat: 39.2830, lon: 25.9700, facing: 320, exposure: 1,
    name: { el: 'Κάμπος Άντισσας', en: 'Kampos Antissas' }, area: { el: 'Άντισσα', en: 'Antissa' },
    surface: 'mixed', organized: false, tags: ['surf', 'quiet'],
    desc: {
      el: 'Μεγάλη, άγρια παραλία που αγαπούν οι σέρφερ. Προσοχή στα ρεύματα όταν φυσάει.',
      en: 'Long, wild beach loved by surfers. Beware of currents when it is windy.',
    },
  },
  {
    id: 'faneromeni', lat: 39.2330, lon: 25.8680, facing: 290, exposure: 1,
    name: { el: 'Φανερωμένη', en: 'Faneromeni' }, area: { el: 'Σίγρι', en: 'Sigri' },
    surface: 'sand', organized: false, tags: ['surf', 'sunset', 'family'],
    desc: {
      el: 'Μεγάλη αμμουδιά βόρεια του Σιγρίου, συχνά με αέρα και κρύο νερό. Η μικρή Φανερωμένη έχει ρηχά λιμνάκια για παιδιά.',
      en: 'Big sandy beach north of Sigri, often windy with cool water. Little Faneromeni has shallow pools for kids.',
    },
  },
  {
    id: 'sigri', lat: 39.2115, lon: 25.8540, facing: 250, exposure: 0.5,
    name: { el: 'Σίγρι', en: 'Sigri' }, area: { el: 'Σίγρι', en: 'Sigri' },
    surface: 'sand', organized: true, tags: ['family', 'tavern', 'sunset'],
    desc: {
      el: 'Προστατευμένη παραλία του χωριού με θέα στο κάστρο. Κοντά το Μουσείο Απολιθωμένου Δάσους.',
      en: 'Sheltered village beach with castle views. The Petrified Forest Museum is nearby.',
    },
  },
  {
    id: 'tsichliotas', lat: 39.1800, lon: 25.8780, facing: 240, exposure: 1,
    name: { el: 'Τσιχλιώτας', en: 'Tsichliotas' }, area: { el: 'Σίγρι – Ερεσός', en: 'Sigri – Eresos' },
    surface: 'mixed', organized: false, tags: ['quiet'],
    desc: {
      el: 'Απομακρυσμένη παραλία στον δρόμο Σιγρίου–Ερεσού, μέσα στο απολιθωμένο δάσος. Καμία παροχή.',
      en: 'Remote beach on the Sigri–Eresos road inside the petrified forest area. No facilities.',
    },
  },
  {
    id: 'skala-eresou', lat: 39.1370, lon: 25.9320, facing: 185, exposure: 1,
    name: { el: 'Σκάλα Ερεσού', en: 'Skala Eresou' }, area: { el: 'Ερεσός', en: 'Eresos' },
    surface: 'sand', organized: true, tags: ['family', 'tavern', 'nudist', 'sunset'],
    desc: {
      el: 'Για πολλούς η καλύτερη παραλία του νησιού: 2 χλμ. σκούρα άμμος, παραλιακά μπαράκια και ζωντανή ατμόσφαιρα.',
      en: 'For many the best beach on the island: 2 km of dark sand, beach bars and a lively vibe.',
    },
  },
  {
    id: 'tavari', lat: 39.0870, lon: 26.0770, facing: 200, exposure: 0.9,
    name: { el: 'Ταβάρι', en: 'Tavari' }, area: { el: 'Μεσότοπος', en: 'Mesotopos' },
    surface: 'mixed', organized: true, tags: ['tavern', 'family'],
    desc: {
      el: 'Ζεστά νερά, προστατευμένος όρμος και εξαιρετικές ψαροταβέρνες.',
      en: 'Warm water, a sheltered cove and excellent fish tavernas.',
    },
  },
  {
    id: 'podaras', lat: 39.0830, lon: 26.0580, facing: 190, exposure: 1,
    name: { el: 'Ποδαράς', en: 'Podaras' }, area: { el: 'Μεσότοπος', en: 'Mesotopos' },
    surface: 'sand', organized: false, tags: ['quiet', 'snorkel'],
    desc: {
      el: 'Απόμερη παραλία με πεντακάθαρα νερά και μια καντίνα.',
      en: 'Secluded beach with crystal-clear water and a snack bar.',
    },
  },
  {
    id: 'kroussos', lat: 39.0880, lon: 26.1050, facing: 180, exposure: 1,
    name: { el: 'Χρούσος', en: 'Chroussos' }, area: { el: 'Μεσότοπος', en: 'Mesotopos' },
    surface: 'sand', organized: false, tags: ['shade', 'family'],
    desc: {
      el: 'Ζεστά νερά και δέντρα για ίσκιο. Γεμίζει τα Σαββατοκύριακα του καλοκαιριού.',
      en: 'Warm water and trees for shade. Busy on summer weekends.',
    },
  },
  // ---------- Κόλπος Καλλονής ----------
  {
    id: 'skala-kallonis', lat: 39.2050, lon: 26.2150, facing: 180, exposure: 0.35,
    name: { el: 'Σκάλα Καλλονής', en: 'Skala Kallonis' }, area: { el: 'Καλλονή', en: 'Kalloni' },
    surface: 'sand', organized: true, tags: ['family', 'tavern', 'birds'],
    desc: {
      el: 'Πολύ ρηχά νερά μέσα στον κόλπο — ιδανική για μικρά παιδιά. Δοκίμασε σαρδέλα Καλλονής. Κοντά υπάρχουν αλυκές με φλαμίνγκο.',
      en: 'Very shallow water inside the gulf — ideal for small kids. Try the famous Kalloni sardines. Flamingos at the nearby salt pans.',
    },
  },
  {
    id: 'achladeri', lat: 39.1720, lon: 26.2570, facing: 210, exposure: 0.35,
    name: { el: 'Αχλαδερή (Αρχαία Πύρρα)', en: 'Achladeri (Ancient Pyrrha)' }, area: { el: 'Κόλπος Καλλονής', en: 'Gulf of Kalloni' },
    surface: 'pebbles', organized: false, tags: ['snorkel', 'tavern', 'quiet'],
    desc: {
      el: 'Βραχώδης ακτή με ψαροταβέρνα. Με μάσκα βλέπεις υπολείμματα της βυθισμένης αρχαίας Πύρρας.',
      en: 'Rocky shore with a fish taverna. Snorkel over remains of sunken ancient Pyrrha.',
    },
  },
  {
    id: 'nyfida', lat: 39.0430, lon: 26.1680, facing: 260, exposure: 0.5,
    name: { el: 'Νυφίδα', en: 'Nyfida' }, area: { el: 'Πολιχνίτος', en: 'Polichnitos' },
    surface: 'sand', organized: false, tags: ['tavern', 'family', 'sunset'],
    desc: {
      el: 'Ρηχή παραλία στην είσοδο του κόλπου Καλλονής, γνωστή για τις ψαροταβέρνες της.',
      en: 'Shallow beach at the mouth of the Gulf of Kalloni, known for its fish tavernas.',
    },
  },
  // ---------- Νότια ακτή ----------
  {
    id: 'vatera', lat: 38.9860, lon: 26.1950, facing: 190, exposure: 1,
    name: { el: 'Βατερά', en: 'Vatera' }, area: { el: 'Πολιχνίτος', en: 'Polichnitos' },
    surface: 'mixed', organized: true, tags: ['family', 'tavern'],
    desc: {
      el: 'Μία από τις μεγαλύτερες παραλίες της Ελλάδας (≈7 χλμ.). Πάντα βρίσκεις ήσυχο σημείο, ακόμη και τον Αύγουστο.',
      en: 'One of the longest beaches in Greece (≈7 km). Always room to spread out, even in August.',
    },
  },
  {
    id: 'tarti', lat: 38.9900, lon: 26.2760, facing: 180, exposure: 0.9,
    name: { el: 'Τάρτι', en: 'Tarti' }, area: { el: 'Πολιχνίτος', en: 'Polichnitos' },
    surface: 'sand', organized: true, tags: ['family', 'watersports'],
    desc: {
      el: 'Δημοφιλής οργανωμένη παραλία με θαλάσσια σπορ και αρκετές μικρότερες παραλίες τριγύρω.',
      en: 'Popular organised beach with water sports and several smaller coves nearby.',
    },
  },
  {
    id: 'melinta', lat: 38.9760, lon: 26.3150, facing: 200, exposure: 1,
    name: { el: 'Μελίντα', en: 'Melinta' }, area: { el: 'Πλωμάρι', en: 'Plomari' },
    surface: 'pebbles', organized: false, tags: ['tavern', 'quiet', 'snorkel'],
    desc: {
      el: 'Μικρός όρμος με βότσαλο, ταβέρνα και πολύ καθαρά νερά.',
      en: 'Small pebbly cove with a taverna and very clear water.',
    },
  },
  {
    id: 'plomari', lat: 38.9730, lon: 26.3680, facing: 180, exposure: 1,
    name: { el: 'Πλωμάρι', en: 'Plomari' }, area: { el: 'Πλωμάρι', en: 'Plomari' },
    surface: 'sand', organized: true, tags: ['snorkel', 'tavern'],
    desc: {
      el: 'Η παραλία της πόλης του ούζου. Βραχώδης βυθός, ιδανικός για μάσκα. Επίσκεψη σε αποστακτήριο ούζου!',
      en: 'The town beach of ouzo country. Rocky seabed, great for snorkelling. Visit an ouzo distillery!',
    },
  },
  {
    id: 'agios-isidoros', lat: 38.9670, lon: 26.3940, facing: 170, exposure: 1,
    name: { el: 'Άγιος Ισίδωρος', en: 'Agios Isidoros' }, area: { el: 'Πλωμάρι', en: 'Plomari' },
    surface: 'mixed', organized: true, tags: ['family', 'tavern'],
    desc: {
      el: 'Συνέχεια του Πλωμαρίου, με ξενοδοχεία και ταβέρνες. Γεμάτη το καλοκαίρι.',
      en: 'Continuation of Plomari with hotels and tavernas. Busy in summer.',
    },
  },
  // ---------- Νοτιοανατολικά / Μυτιλήνη ----------
  {
    id: 'agios-ermogenis', lat: 39.0285, lon: 26.5510, facing: 170, exposure: 0.9,
    name: { el: 'Άγιος Ερμογένης', en: 'Agios Ermogenis' }, area: { el: 'Λουτρά', en: 'Loutra' },
    surface: 'sand', organized: false, tags: ['snorkel', 'tavern', 'shade'],
    desc: {
      el: 'Πευκοδάσος ως τη θάλασσα και κρυστάλλινα νερά. Γεμίζει γρήγορα το καλοκαίρι.',
      en: 'Pine forest down to the sea and crystal-clear water. Fills up fast in summer.',
    },
  },
  {
    id: 'charamida', lat: 39.0310, lon: 26.5290, facing: 190, exposure: 0.9,
    name: { el: 'Χαραμίδα', en: 'Charamida' }, area: { el: 'Λουτρά', en: 'Loutra' },
    surface: 'pebbles', organized: true, tags: ['shade', 'tavern'],
    desc: {
      el: 'Μεγάλη βοτσαλωτή παραλία με δέντρα και πάρκινγκ — πιο ήσυχη εναλλακτική του Αγίου Ερμογένη.',
      en: 'Large pebbly beach with trees and parking — a quieter alternative to Agios Ermogenis.',
    },
  },
  {
    id: 'airport', lat: 39.0600, lon: 26.6000, facing: 90, exposure: 0.9,
    name: { el: 'Παραλία Αεροδρομίου', en: 'Airport Beach' }, area: { el: 'Κράτηγος', en: 'Kratigos' },
    surface: 'sand', organized: false, tags: ['quiet'],
    desc: {
      el: 'Βολική για βουτιά αμέσως μετά την πτήση. Δες τα αεροπλάνα να προσγειώνονται.',
      en: 'Handy for a swim right after your flight. Watch the planes land.',
    },
  },
  {
    id: 'tsamakia', lat: 39.0960, lon: 26.5640, facing: 120, exposure: 0.8,
    name: { el: 'Τσαμάκια (Μυτιλήνη)', en: 'Tsamakia (Mytilene)' }, area: { el: 'Μυτιλήνη', en: 'Mytilene' },
    surface: 'sand', organized: true, tags: ['family', 'tavern'],
    desc: {
      el: 'Η παραλία της πόλης, κάτω από το κάστρο της Μυτιλήνης. Οργανωμένη, με είσοδο.',
      en: 'The town beach below Mytilene castle. Organised, with an entrance fee.',
    },
  },
  {
    id: 'gera-springs', lat: 39.0430, lon: 26.4800, facing: 200, exposure: 0.3,
    name: { el: 'Λουτρά Γέρας', en: 'Gera Hot Springs' }, area: { el: 'Κόλπος Γέρας', en: 'Gulf of Gera' },
    surface: 'pebbles', organized: false, tags: ['hotspring', 'quiet'],
    desc: {
      el: 'Θερμές πηγές στον κλειστό κόλπο της Γέρας — σχεδόν πάντα ήρεμα νερά.',
      en: 'Hot springs in the enclosed Gulf of Gera — almost always calm water.',
    },
  },
  {
    id: 'skala-mistegnon', lat: 39.2180, lon: 26.4990, facing: 90, exposure: 0.9,
    name: { el: 'Σκάλα Μιστεγνών', en: 'Skala Mistegnon' }, area: { el: 'Μιστεγνά', en: 'Mistegna' },
    surface: 'mixed', organized: false, tags: ['tavern', 'quiet'],
    desc: {
      el: 'Ήσυχο ψαροχώρι με πολλές ταβέρνες πάνω στη θάλασσα. Προστατεύεται από τους δυτικούς ανέμους.',
      en: 'Quiet fishing village with plenty of seafront tavernas. Sheltered from westerly winds.',
    },
  },
];
