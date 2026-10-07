import { Component, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
} from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';

interface Tip { icon: string; title: { el: string; en: string }; body: { el: string; en: string } }

@Component({
  selector: 'app-tips',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ state.t('tabTips') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="state.toggleLang()">{{ state.t('language') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @for (tip of tips; track tip.icon) {
        <ion-card>
          <ion-card-header><ion-card-title>{{ tip.icon }} {{ tip.title[state.lang()] }}</ion-card-title></ion-card-header>
          <ion-card-content>{{ tip.body[state.lang()] }}</ion-card-content>
        </ion-card>
      }

      <ion-card>
        <ion-card-header><ion-card-title>📏 Beaufort</ion-card-title></ion-card-header>
        <ion-card-content>
          <table>
            @for (b of beaufort; track b.n) {
              <tr><td><b>{{ b.n }}</b></td><td>{{ b.kmh }} km/h</td><td>{{ b.text[state.lang()] }}</td></tr>
            }
          </table>
        </ion-card-content>
      </ion-card>

      <p class="note">{{ state.t('dataNote') }}</p>
      <p class="note">{{ state.t($any('src_' + state.beachSource())) }} · {{ state.beaches().length }}</p>
    </ion-content>
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 4px 6px; border-bottom: 1px solid var(--ion-color-light); }
    .note { font-size: 11px; color: var(--ion-color-medium); }
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

  beaufort = [
    { n: 0, kmh: '<1', text: { el: 'Άπνοια', en: 'Calm' } },
    { n: 1, kmh: '1–5', text: { el: 'Σχεδόν άπνοια', en: 'Light air' } },
    { n: 2, kmh: '6–11', text: { el: 'Ασθενής', en: 'Light breeze' } },
    { n: 3, kmh: '12–19', text: { el: 'Λεπτός — μικρά κυματάκια', en: 'Gentle — small wavelets' } },
    { n: 4, kmh: '20–28', text: { el: 'Μέτριος — αφρισμένα κύματα', en: 'Moderate — whitecaps' } },
    { n: 5, kmh: '29–38', text: { el: 'Λαμπρός — κύμα, προσοχή', en: 'Fresh — waves, take care' } },
    { n: 6, kmh: '39–49', text: { el: 'Ισχυρός — όχι μπάνιο σε εκτεθειμένες ακτές', en: 'Strong — avoid exposed beaches' } },
    { n: 7, kmh: '50+', text: { el: 'Σφοδρός — μείνε στη στεριά', en: 'Near gale — stay ashore' } },
  ];
}
