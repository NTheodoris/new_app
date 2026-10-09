import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/app-header.component';
import { AppState } from '../services/app-state.service';

import { Text } from '../models';

interface Tip { icon: string; title: Text; body: Text }

@Component({
  selector: 'app-tips',
  standalone: true,
  imports: [IonContent, AppHeaderComponent],
  template: `
    <app-header [title]="state.t('tabTips')" />
    <ion-content>
      <ul class="tips">
        @for (tip of tips; track tip.icon) {
          <li>
            <span class="ic" aria-hidden="true">{{ tip.icon }}</span>
            <div>
              <h2>{{ state.txt(tip.title) }}</h2>
              <p>{{ state.txt(tip.body) }}</p>
            </div>
          </li>
        }
      </ul>
      <p class="note">{{ state.t('dataNote') }}</p>
      <p class="note">{{ state.t($any('src_' + state.beachSource())) }} ({{ state.beaches().length }})</p>
      <p class="note"><a [href]="'https://ntheodoris.github.io/new_app/privacy.html#' + (state.lang() === 'el' ? 'el' : 'en')" target="_blank" rel="noopener">{{ state.t('privacy') }}</a></p>
    </ion-content>
  `,
  styles: [`
    .tips { list-style: none; margin: 8px 12px 0; padding: 4px 16px; background: var(--lg-surface); border-radius: 22px; }
    li { display: flex; gap: 14px; padding: 16px 0; }
    li + li { border-top: 1px solid var(--lg-line); }
    .ic { flex: none; width: 40px; height: 40px; border-radius: 12px; background: var(--lg-foam); display: grid; place-items: center; font-size: 20px; }
    h2 { margin: 0 0 4px; font-size: 17px; font-weight: 720; color: var(--lg-ink); letter-spacing: -0.01em; }
    p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--lg-ink); max-width: 62ch; }
    .note { font-size: 12px; color: var(--lg-muted); margin: 14px 16px 0; }
    .note:last-child { margin-bottom: 24px; }
    .note a { color: var(--lg-sea); font-weight: 600; }
  `],
})
export class TipsPage {
  state = inject(AppState);

  tips: Tip[] = [
    {
      icon: '🧭',
      title: { el: 'Ο κανόνας του αέρα', en: 'The wind rule', de: 'Die Windregel', tr: "Rüzgâr kuralı" },
      body: {
        el: 'Ψάξε παραλία στην αντίθετη πλευρά από εκεί που φυσάει. Με βοριά (μελτέμι) διάλεξε τη νότια ακτή: Βατερά, Πλωμάρι, Άγιο Ερμογένη, Σκάλα Ερεσού. Με νοτιά πήγαινε βόρεια: Πέτρα, Μόλυβο, Σκάλα Συκαμινέας.',
        en: 'Pick a beach on the opposite side from where the wind blows. With a northerly (meltemi) go south: Vatera, Plomari, Agios Ermogenis, Skala Eresou. With a southerly go north: Petra, Molyvos, Skala Sykamineas.',
        de: "Such dir einen Strand auf der Seite, die dem Wind abgewandt ist. Bei Nordwind (Meltemi) in den Süden: Vatera, Plomari, Agios Ermogenis, Skala Eresou. Bei Südwind in den Norden: Petra, Molyvos, Skala Sykamineas.",
        tr: "Rüzgârın estiği yönün karşı tarafındaki bir plajı seçin. Poyrazda (meltem) güneye gidin: Vatera, Plomari, Agios Ermogenis, Skala Eresou. Kıble rüzgârında kuzeye gidin: Petra, Molyvos, Skala Sykamineas.",
      },
    },
    {
      icon: '🌬️',
      title: { el: 'Τι είναι το μελτέμι', en: 'What is the meltemi', de: 'Was ist der Meltemi', tr: "Meltem nedir" },
      body: {
        el: 'Ξηρός βόρειος άνεμος του Αιγαίου, κυρίως Ιούλιο–Αύγουστο. Συνήθως δυναμώνει το μεσημέρι και πέφτει το βράδυ — γι’ αυτό τα πρωινά είναι συχνά πιο ήρεμα.',
        en: 'A dry northerly Aegean wind, mostly in July–August. It usually picks up around midday and drops in the evening — mornings are often calmer.',
        de: "Ein trockener Nordwind in der Ägäis, vor allem im Juli und August. Er frischt meist gegen Mittag auf und flaut abends ab — morgens ist es deshalb oft ruhiger.",
        tr: "Ege’nin kuru kuzey rüzgârı, özellikle Temmuz–Ağustos’ta. Genellikle öğleye doğru kuvvetlenir, akşam diner — bu yüzden sabahlar çoğu zaman daha sakindir.",
      },
    },
    {
      icon: '🏞️',
      title: { el: 'Οι κόλποι σώζουν τη μέρα', en: 'The gulfs save the day', de: 'Die Golfe retten den Tag', tr: "Körfezler günü kurtarır" },
      body: {
        el: 'Οι κόλποι Καλλονής και Γέρας είναι κλειστοί, οπότε δεν σηκώνουν μεγάλο κύμα σχεδόν ποτέ. Η Σκάλα Καλλονής είναι ιδανική για μικρά παιδιά.',
        en: 'The gulfs of Kalloni and Gera are enclosed, so they rarely get big waves. Skala Kallonis is ideal for small children.',
        de: "Die Golfe von Kalloni und Gera sind fast geschlossen, deshalb gibt es dort kaum hohe Wellen. Skala Kallonis ist ideal für kleine Kinder.",
        tr: "Kalloni ve Gera körfezleri neredeyse kapalıdır, bu yüzden nadiren büyük dalga olur. Skala Kallonis küçük çocuklar için idealdir.",
      },
    },
    {
      icon: '⚠️',
      title: { el: 'Αέρας από στεριά = προσοχή', en: 'Offshore wind = caution', de: 'Ablandiger Wind = Vorsicht', tr: "Karadan rüzgâr = dikkat" },
      body: {
        el: 'Όταν φυσάει από τη στεριά προς τη θάλασσα, τα νερά δείχνουν ήρεμα, αλλά φουσκωτά, στρώματα και κανό παρασύρονται εύκολα στα ανοιχτά. Η εφαρμογή σε προειδοποιεί.',
        en: 'When the wind blows from land to sea the water looks calm, but inflatables, airbeds and kayaks drift out quickly. The app warns you.',
        de: "Wenn der Wind vom Land aufs Meer weht, sieht das Wasser ruhig aus, aber Luftmatratzen, Schwimmtiere und Kajaks treiben schnell hinaus. Die App warnt dich.",
        tr: "Rüzgâr karadan denize estiğinde deniz sakin görünür, ama şişme yataklar, şişme oyuncaklar ve kanolar hızla açığa sürüklenir. Uygulama sizi uyarır.",
      },
    },
    {
      icon: '♨️',
      title: { el: 'Θερμές πηγές', en: 'Hot springs', de: 'Heiße Quellen', tr: "Kaplıcalar" },
      body: {
        el: 'Η Λέσβος έχει πολλές: Εφταλού (δίπλα στη θάλασσα), Γέρα, Πολιχνίτος, Θερμή, Λισβόρι. Ιδανικές για συννεφιασμένη ή φθινοπωρινή μέρα.',
        en: 'Lesvos has many: Eftalou (right by the sea), Gera, Polichnitos, Thermi, Lisvori. Perfect for a cloudy or autumn day.',
        de: "Lesbos hat viele: Eftalou (direkt am Meer), Gera, Polichnitos, Thermi, Lisvori. Perfekt für einen bewölkten Tag oder im Herbst.",
        tr: "Midilli’de çok kaplıca var: Eftalou (denizin hemen yanında), Gera, Polichnitos, Thermi, Lisvori. Bulutlu ya da sonbahar günleri için ideal.",
      },
    },
    {
      icon: '🌅',
      title: { el: 'Ηλιοβασίλεμα', en: 'Sunset', de: 'Sonnenuntergang', tr: "Gün batımı" },
      body: {
        el: 'Οι δυτικές παραλίες (Πέτρα, Άναξος, Μόλυβος, Σίγρι) έχουν το καλύτερο ηλιοβασίλεμα. Φίλτρο «Ηλιοβασίλεμα» στη λίστα.',
        en: 'West-facing beaches (Petra, Anaxos, Molyvos, Sigri) have the best sunsets. Use the "Sunset" filter in the list.',
        de: "Die Strände im Westen (Petra, Anaxos, Molyvos, Sigri) haben die schönsten Sonnenuntergänge. Nutze den Filter „Sonnenuntergang“ in der Liste.",
        tr: "Batıya bakan plajlarda (Petra, Anaxos, Molyvos, Sigri) en güzel gün batımları olur. Listede “Gün batımı” filtresini kullanın.",
      },
    },
    {
      icon: '🐟',
      title: { el: 'Γεύσεις μετά τη βουτιά', en: 'Tastes after a swim', de: 'Genuss nach dem Baden', tr: "Denizden sonra lezzetler" },
      body: {
        el: 'Σαρδέλα Καλλονής, λαδοτύρι Μυτιλήνης, ούζο Πλωμαρίου και κολοκυθοανθοί γεμιστοί. Ρώτα για ψάρι της ημέρας στα ψαροχώρια.',
        en: 'Kalloni sardines, Mytilene ladotyri cheese, Plomari ouzo and stuffed courgette flowers. Ask for the catch of the day in fishing villages.',
        de: "Sardinen aus Kalloni, Ladotyri-Käse aus Mytilini, Ouzo aus Plomari und gefüllte Zucchiniblüten. Frag in den Fischerdörfern nach dem Fang des Tages.",
        tr: "Kalloni sardalyası, Midilli’nin ladotiri peyniri, Plomari uzosu ve kabak çiçeği dolması. Balıkçı köylerinde günün balığını sorun.",
      },
    },
    {
      icon: '🚗',
      title: { el: 'Αποστάσεις', en: 'Distances', de: 'Entfernungen', tr: "Mesafeler" },
      body: {
        el: 'Η Λέσβος είναι μεγάλη: Μυτιλήνη–Σκάλα Ερεσού ≈ 2 ώρες με αυτοκίνητο. Υπολόγισε τον χρόνο και βάλε βενζίνη πριν τα δυτικά χωριά.',
        en: 'Lesvos is big: Mytilene–Skala Eresou is ≈ 2 hours by car. Plan your time and fill up before heading to the western villages.',
        de: "Lesbos ist groß: Mytilini–Skala Eresou dauert mit dem Auto ≈ 2 Stunden. Plane genug Zeit ein und tanke, bevor du in die Dörfer im Westen fährst.",
        tr: "Midilli büyük bir ada: Midilli şehri–Skala Eresou arabayla ≈ 2 saat. Zamanınızı planlayın ve batıdaki köylere gitmeden önce yakıt alın.",
      },
    },
  ];

}
