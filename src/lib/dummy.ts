import type { TiredLesson, OkayLesson, FitLesson, ErzaehlLesson } from './types';

export const tiredLessons: TiredLesson[] = [
  {
    mode: 'muede',
    text: 'En el aeropuerto, María busca su maleta. Ve muchas maletas, pero la suya es roja con una etiqueta amarilla. Por fin la encuentra y sale corriendo hacia el taxi.',
    translation: 'Am Flughafen sucht María ihren Koffer. Sie sieht viele Koffer, aber ihrer ist rot mit einem gelben Etikett. Schließlich findet sie ihn und läuft zum Taxi.',
    vocab: [
      { es: 'el aeropuerto', de: 'der Flughafen' },
      { es: 'la maleta', de: 'der Koffer' },
      { es: 'la etiqueta', de: 'das Etikett' },
    ],
  },
  {
    mode: 'muede',
    text: 'El mercado huele a especias y flores frescas. Una señora mayor vende naranjas y limones. Los colores son brillantes bajo el sol de la mañana.',
    translation: 'Der Markt riecht nach Gewürzen und frischen Blumen. Eine ältere Frau verkauft Orangen und Zitronen. Die Farben leuchten unter der Morgensonne.',
    vocab: [
      { es: 'las especias', de: 'die Gewürze' },
      { es: 'la naranja', de: 'die Orange' },
      { es: 'brillante', de: 'strahlend / leuchtend' },
    ],
  },
  {
    mode: 'muede',
    text: 'Luis va al gimnasio tres veces a la semana. Le gusta correr en la cinta y levantar pesas. Después siempre toma una ducha fría.',
    translation: 'Luis geht dreimal pro Woche ins Fitnessstudio. Er läuft gerne auf dem Laufband und hebt Gewichte. Danach nimmt er immer eine kalte Dusche.',
    vocab: [
      { es: 'el gimnasio', de: 'das Fitnessstudio' },
      { es: 'la cinta', de: 'das Laufband' },
      { es: 'levantar pesas', de: 'Gewichte heben' },
    ],
  },
  {
    mode: 'muede',
    text: 'En el bosque hay silencio. Los árboles son altos y el aire huele a pino. Ana camina despacio y escucha los pájaros cantar.',
    translation: 'Im Wald herrscht Stille. Die Bäume sind hoch und die Luft riecht nach Kiefer. Ana geht langsam und hört den Vögeln beim Singen zu.',
    vocab: [
      { es: 'el bosque', de: 'der Wald' },
      { es: 'el pino', de: 'die Kiefer / die Pinie' },
      { es: 'los pájaros', de: 'die Vögel' },
    ],
  },
];

export const okayLessons: OkayLesson[] = [
  {
    mode: 'okay',
    text: 'Pedro trabaja en una oficina en el centro de la ciudad. Cada mañana llega a las nueve y toma un café con sus compañeros. A las dos come en el restaurante de la esquina. Le gusta su trabajo, pero sueña con viajar a América del Sur.',
    translation: 'Pedro arbeitet in einem Büro im Stadtzentrum. Jeden Morgen kommt er um neun Uhr und trinkt einen Kaffee mit seinen Kollegen. Um zwei Uhr isst er im Restaurant an der Ecke. Er mag seine Arbeit, träumt aber davon, nach Südamerika zu reisen.',
    questions: [
      {
        question: 'Wo arbeitet Pedro?',
        options: ['In einem Café', 'In einer Schule', 'In einem Büro im Stadtzentrum'],
        correctIndex: 2,
      },
      {
        question: 'Wann kommt Pedro an?',
        options: ['Um acht Uhr', 'Um neun Uhr', 'Um zehn Uhr'],
        correctIndex: 1,
      },
      {
        question: 'Wovon träumt Pedro?',
        options: ['Von einem neuen Auto', 'Von einer Reise nach Südamerika', 'Von einem größeren Büro'],
        correctIndex: 1,
      },
    ],
  },
  {
    mode: 'okay',
    text: 'La familia García come junta los domingos. La abuela prepara paella y el abuelo trae el vino. Los niños ponen la mesa y los padres hablan de la semana. Es la tradición más importante de la familia.',
    translation: 'Die Familie García isst sonntags zusammen. Die Großmutter bereitet Paella zu und der Großvater bringt den Wein. Die Kinder decken den Tisch und die Eltern sprechen über die Woche. Es ist die wichtigste Tradition der Familie.',
    questions: [
      {
        question: 'Was kocht die Großmutter?',
        options: ['Tortilla', 'Paella', 'Gazpacho'],
        correctIndex: 1,
      },
      {
        question: 'Wer deckt den Tisch?',
        options: ['Die Eltern', 'Der Großvater', 'Die Kinder'],
        correctIndex: 2,
      },
      {
        question: 'Wann essen sie zusammen?',
        options: ['Samstags', 'Sonntags', 'Freitags'],
        correctIndex: 1,
      },
    ],
  },
  {
    mode: 'okay',
    text: 'El festival de música dura tres días. Hay bandas de rock, pop y flamenco. Los jóvenes vienen de toda España. Las entradas cuestan veinte euros y todo el mundo baila hasta la medianoche.',
    translation: 'Das Musikfestival dauert drei Tage. Es gibt Rock-, Pop- und Flamenco-Bands. Die Jugendlichen kommen aus ganz Spanien. Die Eintrittskarten kosten zwanzig Euro und alle tanzen bis Mitternacht.',
    questions: [
      {
        question: 'Wie lange dauert das Festival?',
        options: ['Einen Tag', 'Zwei Tage', 'Drei Tage'],
        correctIndex: 2,
      },
      {
        question: 'Was kostet eine Eintrittskarte?',
        options: ['Zehn Euro', 'Zwanzig Euro', 'Dreißig Euro'],
        correctIndex: 1,
      },
      {
        question: 'Welche Musikrichtungen gibt es?',
        options: ['Jazz und Blues', 'Rock, Pop und Flamenco', 'Klassik und Oper'],
        correctIndex: 1,
      },
    ],
  },
  {
    mode: 'okay',
    text: 'Carlos lee un libro cada semana. Le gustan las novelas de misterio y los libros de historia. En la biblioteca tiene más de doscientos libros. Su libro favorito es "Cien años de soledad" de García Márquez.',
    translation: 'Carlos liest jede Woche ein Buch. Er mag Kriminalromane und Geschichtsbücher. In seiner Bibliothek hat er mehr als zweihundert Bücher. Sein Lieblingsbuch ist "Hundert Jahre Einsamkeit" von García Márquez.',
    questions: [
      {
        question: 'Wie oft liest Carlos ein Buch?',
        options: ['Täglich', 'Wöchentlich', 'Monatlich'],
        correctIndex: 1,
      },
      {
        question: 'Wie viele Bücher hat er?',
        options: ['Mehr als hundert', 'Mehr als zweihundert', 'Mehr als dreihundert'],
        correctIndex: 1,
      },
      {
        question: 'Was ist sein Lieblingsbuch?',
        options: ['Don Quijote', 'Cien años de soledad', 'La sombra del viento'],
        correctIndex: 1,
      },
    ],
  },
];

export const fitLessons: FitLesson[] = [
  {
    mode: 'fit',
    dialog: [
      { speaker: 'Ana', es: '¿Sabes dónde está la estación de tren?', de: 'Weißt du, wo der Bahnhof ist?' },
      { speaker: 'Carlos', es: 'Sí, está a dos calles de aquí. Gira a la derecha en el semáforo.', de: 'Ja, er ist zwei Straßen von hier. Biege an der Ampel rechts ab.' },
      { speaker: 'Ana', es: '¿Cuánto tiempo se tarda caminando?', de: 'Wie lange läuft man dorthin?' },
      { speaker: 'Carlos', es: 'Unos diez minutos. No es muy lejos.', de: 'Etwa zehn Minuten. Es ist nicht sehr weit.' },
      { speaker: 'Ana', es: 'Perfecto, muchas gracias.', de: 'Perfekt, vielen Dank.' },
      { speaker: 'Carlos', es: 'De nada. ¡Buen viaje!', de: 'Gern geschehen. Gute Reise!' },
    ],
    vocab: [
      { es: 'la estación de tren', de: 'der Bahnhof' },
      { es: 'el semáforo', de: 'die Ampel' },
      { es: 'a la derecha', de: 'nach rechts' },
      { es: 'caminando', de: 'zu Fuß gehend' },
      { es: '¡Buen viaje!', de: 'Gute Reise!' },
    ],
  },
  {
    mode: 'fit',
    dialog: [
      { speaker: 'Camarero', es: '¿Qué van a tomar?', de: 'Was möchten Sie nehmen?' },
      { speaker: 'Elena', es: 'Para mí, una ensalada mixta y agua mineral, por favor.', de: 'Für mich einen gemischten Salat und Mineralwasser, bitte.' },
      { speaker: 'Marcos', es: 'Yo quiero el plato del día. ¿Qué hay hoy?', de: 'Ich möchte das Tagesgericht. Was gibt es heute?' },
      { speaker: 'Camarero', es: 'Hoy tenemos merluza con patatas y verduras.', de: 'Heute haben wir Seehecht mit Kartoffeln und Gemüse.' },
      { speaker: 'Marcos', es: 'Perfecto, lo pongo.', de: 'Perfekt, das nehme ich.' },
      { speaker: 'Camarero', es: '¿Algo más?', de: 'Noch etwas?' },
      { speaker: 'Elena', es: 'No, gracias. Solo la cuenta al final.', de: 'Nein, danke. Nur die Rechnung am Ende.' },
    ],
    vocab: [
      { es: 'el plato del día', de: 'das Tagesgericht' },
      { es: 'la merluza', de: 'der Seehecht' },
      { es: 'la ensalada mixta', de: 'der gemischte Salat' },
      { es: 'la cuenta', de: 'die Rechnung' },
      { es: 'el camarero', de: 'der Kellner' },
    ],
  },
  {
    mode: 'fit',
    dialog: [
      { speaker: 'Sofía', es: '¿Viste el partido anoche?', de: 'Hast du das Spiel gestern Abend gesehen?' },
      { speaker: 'Diego', es: 'Sí, ¡fue increíble! El gol en el último minuto...', de: 'Ja, es war unglaublich! Das Tor in der letzten Minute...' },
      { speaker: 'Sofía', es: 'No me lo puedo creer. El portero lo tenía todo controlado.', de: 'Ich kann es nicht glauben. Der Torwart hatte alles unter Kontrolle.' },
      { speaker: 'Diego', es: 'Así es el fútbol. Nunca sabes lo que va a pasar.', de: 'So ist Fußball. Man weiß nie, was passieren wird.' },
      { speaker: 'Sofía', es: '¿Vas a ver el próximo partido también?', de: 'Wirst du auch das nächste Spiel anschauen?' },
      { speaker: 'Diego', es: 'Por supuesto. ¡No me lo perdería por nada del mundo!', de: 'Natürlich. Das würde ich um nichts auf der Welt verpassen!' },
    ],
    vocab: [
      { es: 'el partido', de: 'das Spiel / das Match' },
      { es: 'el gol', de: 'das Tor' },
      { es: 'el portero', de: 'der Torwart' },
      { es: 'por supuesto', de: 'natürlich / selbstverständlich' },
      { es: 'el último minuto', de: 'die letzte Minute' },
    ],
  },
  {
    mode: 'fit',
    dialog: [
      { speaker: 'Miguel', es: '¿Qué película vemos esta noche?', de: 'Welchen Film schauen wir heute Abend?' },
      { speaker: 'Laura', es: 'Hay una nueva película de terror en el cine.', de: 'Es gibt einen neuen Horrorfilm im Kino.' },
      { speaker: 'Miguel', es: 'No me gustan las películas de terror. Prefiero la comedia.', de: 'Ich mag keine Horrorfilme. Ich bevorzuge Komödien.' },
      { speaker: 'Laura', es: 'De acuerdo. Entonces, ¿qué tal una película española?', de: 'Einverstanden. Was wäre dann mit einem spanischen Film?' },
      { speaker: 'Miguel', es: 'Me parece bien. Así practicamos el español también.', de: 'Das klingt gut. So üben wir auch Spanisch.' },
      { speaker: 'Laura', es: '¡Exacto! ¿A qué hora empieza?', de: 'Genau! Um wie viel Uhr fängt er an?' },
    ],
    vocab: [
      { es: 'la película', de: 'der Film' },
      { es: 'el cine', de: 'das Kino' },
      { es: 'el terror', de: 'der Horror' },
      { es: 'la comedia', de: 'die Komödie' },
      { es: 'de acuerdo', de: 'einverstanden / OK' },
    ],
  },
];

export const erzaehlDummy: ErzaehlLesson = {
  mode: 'erzaehl',
  saetze: [
    { es: 'Hoy he ido al gimnasio por primera vez.', de: 'Heute bin ich zum ersten Mal ins Fitnessstudio gegangen.' },
    { es: 'Después he comido pizza con mis amigos.', de: 'Danach habe ich mit meinen Freunden Pizza gegessen.' },
    { es: 'Por la noche he llamado a mi hermana.', de: 'Abends habe ich meine Schwester angerufen.' },
  ],
  vocab: [
    { es: 'por primera vez', de: 'zum ersten Mal' },
    { es: 'el gimnasio', de: 'das Fitnessstudio' },
    { es: 'después', de: 'danach / nachher' },
    { es: 'por la noche', de: 'abends / nachts' },
    { es: 'llamar', de: 'anrufen' },
  ],
};
