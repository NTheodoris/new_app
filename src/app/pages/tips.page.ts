import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/app-header.component';
import { AppState } from '../services/app-state.service';

interface Tip { icon: string; title: { el: string; en: string }; body: { el: string; en: string } }

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
              <h2>{{ tip.title[state.lang()] }}</h2>
              <p>{{ tip.body[state.lang()] }}</p>
            </div>
          </li>
        }
      </ul>
      <p class="note">{{ state.t('dataNote') }}</p>
      <p class="note">{{ state.t($any('src_' + state.beachSource())) }} ({{ state.beaches().length }})</p>
      <p class="note"><a [href]="'https://ntheodoris.github.io/new_app/privacy.html#' + state.lang()" target="_blank" rel="noopener">{{ state.t('privacy') }}</a></p>
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
      title: { el: 'Ο κανόνας του αέρα', en: 'The wind rule' },
      body: {
        el: 'Ψάξε παραλία στην αντίθετη πλευρά από εκεί που φυσάει. Με βοριά (μελτέμι) διάλεξε τη νότια ακτή: Βατερά, Πλωμάρι, Άγιο Ερμογένη, Σκάλα Ερεσού. Με νοτιά πήγαινε βόρεια: Πέτρα, Μόλυβο, Σκάλα Συκαμινέας.',
        en: 'Pick a beach on the opposite side from where the wind blows. With a northerly (meltemi) go south: Vatera, Plomari, Agios Ermogenis, Skala Eresou. With a southerly go north: Petra, Molyvos, Skala Sykamineas.',
      },
    },
    {
      icon: '🌬️',
      title: { el: 'Τι είναι το μελτέμι', en: 'What is the meltemi' },
      body: {
        el: 'Ξηρός βόρειος άνεμος του Αιγαίου, κυρίως Ιούλιο–Αύγουστο. Συνήθως δυναμώνει το μεσημέρι και πέφτει το βράδυ — γι’ αυτό τα πρωινά είναι συχνά πιο ήρεμα.',
        en: 'A dry northerly Aegean wind, mostly in July–August. It usually picks up around midday and drops in the evening — mornings are often calmer.',
      },
    },
    {
      icon: '🏞️',
      title: { el: 'Οι κόλποι σώζουν τη μέρα', en: 'The gulfs save the day' },
      body: {
        el: 'Οι κόλποι Καλλονής και Γέρας είναι κλειστοί, οπότε δεν σηκώνουν μεγάλο κύμα σχεδόν ποτέ. Η Σκάλα Καλλονής είναι ιδανική για μικρά παιδιά.',
        en: 'The gulfs of Kalloni and Gera are enclosed, so they rarely get big waves. Skala Kallonis is ideal for small children.',
      },
    },
    {
      icon: '⚠️',
      title: { el: 'Αέρας από στεριά = προσοχή', en: 'Offshore wind = caution' },
      body: {
        el: 'Όταν φυσάει από τη στεριά προς τη θάλασσα, τα νερά δείχνουν ήρεμα, αλλά φουσκωτά, στρώματα και κανό παρασύρονται εύκολα στα ανοιχτά. Η εφαρμογή σε προειδοποιεί.',
        en: 'When the wind blows from land to sea the water looks calm, but inflatables, airbeds and kayaks drift out quickly. The app warns you.',
      },
    },
    {
      icon: '♨️',
      title: { el: 'Θερμές πηγές', en: 'Hot springs' },
      body: {
        el: 'Η Λέσβος έχει πολλές: Εφταλού (δίπλα στη θάλασσα), Γέρα, Πολιχνίτος, Θερμή, Λισβόρι. Ιδανικές για συννεφιασμένη ή φθινοπωρινή μέρα.',
        en: 'Lesvos has many: Eftalou (right by the sea), Gera, Polichnitos, Thermi, Lisvori. Perfect for a cloudy or autumn day.',
      },
    },
    {
      icon: '🌅',
      title: { el: 'Ηλιοβασίλεμα', en: 'Sunset' },
      body: {
        el: 'Οι δυτικές παραλίες (Πέτρα, Άναξος, Μόλυβος, Σίγρι) έχουν το καλύτερο ηλιοβασίλεμα. Φίλτρο «Ηλιοβασίλεμα» στη λίστα.',
        en: 'West-facing beaches (Petra, Anaxos, Molyvos, Sigri) have the best sunsets. Use the "Sunset" filter in the list.',
      },
    },
    {
      icon: '🐟',
      title: { el: 'Γεύσεις μετά τη βουτιά', en: 'Tastes after a swim' },
      body: {
        el: 'Σαρδέλα Καλλονής, λαδοτύρι Μυτιλήνης, ούζο Πλωμαρίου και κολοκυθοανθοί γεμιστοί. Ρώτα για ψάρι της ημέρας στα ψαροχώρια.',
        en: 'Kalloni sardines, Mytilene ladotyri cheese, Plomari ouzo and stuffed courgette flowers. Ask for the catch of the day in fishing villages.',
      },
    },
    {
      icon: '🚗',
      title: { el: 'Αποστάσεις', en: 'Distances' },
      body: {
        el: 'Η Λέσβος είναι μεγάλη: Μυτιλήνη–Σκάλα Ερεσού ≈ 2 ώρες με αυτοκίνητο. Υπολόγισε τον χρόνο και βάλε βενζίνη πριν τα δυτικά χωριά.',
        en: 'Lesvos is big: Mytilene–Skala Eresou is ≈ 2 hours by car. Plan your time and fill up before heading to the western villages.',
      },
    },
  ];

}
