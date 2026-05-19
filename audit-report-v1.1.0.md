# Audit Report Hoy v1.1.0

## Zusammenfassung

| Feld | Wert |
|------|------|
| **Gesamtstatus** | 🟡 **GELB** |
| **Datum** | 2026-05-19 |
| **Branch** | `feature/v1.1.0-beginner-path-and-games` |
| **Letzter Commit** | `d1e09eb feat(v1.1.0): Anfänger-Pfad, Mini-Games, Spaced-Repetition, Wiederholen` |
| **package.json Version** | 1.1.0 ✓ |
| **Profil Version-String** | "Hoy v1.1.0" ✓ |
| **Build** | ✓ sauber (tsc + vite build, 0 Fehler) |
| **KRITISCH** | 5 |
| **WICHTIG** | 7 |
| **NICE-TO-HAVE** | 6 |

---

## Erfolgreich verifizierte Features

### v0.9.1 – Lern-Mechaniken
- ✅ `src/lib/stringUtils.ts` vorhanden: `normalize()`, `levenshtein()`, `isCloseMatch()`
- ✅ Levenshtein-Schwelle ≤ 1 korrekt implementiert
- ✅ Akzent-Normalisierung (á→a, é→e etc.) in `normalize()`
- ✅ `src/lib/vocabTracking.ts` vorhanden mit `recordVocabSeen()`, `recordVocabAnswer()`, `getVocabLevel()`, `getReviewableCount()`, `getVocabForReview()`
- ✅ VocabLevel-Logik: `timesSeen ≤ 1 → 'neu'`, `timesSeen ≥ 5 && ratio ≥ 0.7 → 'vertraut'`, sonst `'lerntief'`
- ✅ `resetAll()` in `storage.ts` löscht auch `VOCAB_TRACKING_STORAGE_KEY`
- ✅ `recordVocabSeen()` wird in `Lektion.tsx handleFinish()` aufgerufen
- ✅ `schluesselwort` in allen API-Schemas und Prompt-Anweisungen enthalten
- ✅ `api/luecken.ts` Edge Function vorhanden (POST, 2-Retry, AbortController)
- ✅ `api/reihenfolge.ts` Edge Function vorhanden (POST, 2-Retry, AbortController)

### v1.0.0 – Review & Games
- ✅ `SpielBildMatching.tsx` vorhanden: 8 Runden, Emoji 96px, 3 Antwortbuttons, Auto-Advance bei richtig
- ✅ `SpielWortPaare.tsx` vorhanden: 3×4 Grid, 6 Paare, Karten face-down
- ✅ `SpielLueckenFuellen.tsx` vorhanden: 5 Runden, /api/luecken, Levenshtein-Check
- ✅ `SpielReihenfolge.tsx` vorhanden: 5 Runden, /api/reihenfolge, Chips + Drop-Area + Prüfen
- ✅ `Wiederholen.tsx` vorhanden: 4 Spiele in 2×2 Grid, getVocabForReview(8)
- ✅ Route `/wiederholen` in `App.tsx` registriert
- ✅ Wiederholen-Button auf Heute-Seite: dashed border, disabled bei < 5 Vokabeln
- ✅ Wiederholen-Button auf Noch-eine-Screen nach Lektion

### v1.1.0 – Anfänger-Pfad
- ✅ `src/lib/anfaengerPfad.ts` vorhanden: `getAnfaengerPhase()`, `getDayInPfad()`, `isErzaehlModusVerfuegbar()`, `getModusKonfiguration()`
- ✅ Phase-Logik: inactive wenn !aktiv oder etappe > 1; phase1 < 3 Tage; phase2 < 7 Tage; phase3 sonst
- ✅ `Onboarding.tsx` setzt `anfaengerPfadStart` und `anfaengerPfadAktiv` bei Anfänger-Auswahl
- ✅ `UserData` in `types.ts` erweitert um `anfaengerPfadStart?` und `anfaengerPfadAktiv?`
- ✅ Erzähl-Modus gesperrt in Phase1 (`isErzaehlModusVerfuegbar()` → false)
- ✅ EnergyButton unterstützt `disabled` Prop mit `opacity-40 cursor-not-allowed`
- ✅ Pfad-Hinweis-Banner auf Heute (zumindest für phase1 und phase2)
- ✅ Phase-basiertes Routing in `Lektion.tsx handleFinishWithGame()`
- ✅ `anfaengerVokabular.ts` mit 30 Vokabeln (es, de, emoji)
- ✅ Keine verbotenen Mechaniken (Punkte, XP, Streaks, Konfetti, Sterne, Highscores)
- ✅ 0 `console.log` in `src/`
- ✅ 0 `any`-Typen in TypeScript
- ✅ Keine neuen npm-Dependencies hinzugefügt

---

## Kritische Probleme (KRITISCH)

### K-1: Müde-Modus Vocabulary-Level-Mapping INVERTIERT

**Datei:** `src/components/LessonView.tsx` — `TiredVocabStep`

**Problem:** Die Zuordnung von Vokabular-Leveln zu Übungstypen ist entgegen der Spezifikation implementiert:

| Level | Spec (korrekt) | Code (falsch) |
|-------|---------------|---------------|
| `neu` | FlipCard (Reveal, einfachste) | TypeVocabCard (schwierigste!) |
| `lerntief` | MCQ (Multiple Choice) | McqVocabCard ✓ |
| `vertraut` | TypeInput (schwierigste) | FlipCard (einfachste!) |

**Spec-Anforderung:** Neue Wörter sollen zuerst durch einfaches Aufdecken (FlipCard) kennengelernt werden; vertraute Wörter werden mit Tippen herausgefordert.

**Auswirkung:** Lernende sehen sofort die schwierigste Übung bei neuen Wörtern — kontraproduktiv für Lernerfolg.

---

### K-2: Phase2+Okay → Falsches Spiel

**Datei:** `src/pages/Lektion.tsx` — `handleFinishWithGame()`

**Problem:**
```
// Code:
if (phase === 'phase2' && mode === 'okay') → SpielReihenfolge

// Spec:
Phase2 + Okay → SpielLueckenFuellen
```

**Auswirkung:** Nutzer in Phase 2 sehen nach einer Okay-Lektion immer Satz-Reihenfolge statt Lücken-Füllen.

---

### K-3: `getAllTrackedVocab()` fehlt in `vocabTracking.ts`

**Datei:** `src/lib/vocabTracking.ts`

**Problem:** Die Funktion `getAllTrackedVocab()` ist laut Spezifikation erforderlich (wird für Profil-Seite "Deine Wörter" und Debug-Zwecke benötigt), ist aber nicht exportiert.

**Aktuell exportiert:** `recordVocabSeen`, `recordVocabAnswer`, `getVocabLevel`, `getReviewableCount`, `getVocabForReview`, `VOCAB_TRACKING_STORAGE_KEY`

**Fehlend:** `getAllTrackedVocab()` → gibt alle VocabEntry-Objekte zurück

**Auswirkung:** Andere Module können nicht auf alle getackten Vokabeln zugreifen; Funktion ist möglicherweise bereits an anderer Stelle erwartet.

---

### K-4: `SpielWortPaare` — keine `recordVocabAnswer()` Aufrufe

**Datei:** `src/components/SpielWortPaare.tsx`

**Problem:** Das Wort-Paare-Spiel ruft `recordVocabAnswer()` nirgendwo auf. Korrekte und falsche Paare werden nicht ins Spaced-Repetition-System übertragen.

**Auswirkung:** Spielfortschritt im Wort-Paare-Spiel fließt nicht in die Wiederholung ein; `getReviewableCount()` und `getVocabLevel()` werden nicht korrekt aktualisiert.

---

### K-5: Phase3-Hinweis-Banner fehlt auf Heute-Seite

**Datei:** `src/pages/Heute.tsx`

**Problem:**
```tsx
// Code:
const showPfadHint = phase === 'phase1' || phase === 'phase2'

// Spec: auch Phase3 soll einen Hinweis zeigen:
// "Du wirst bald alle Lernmodi freischalten."
```

**Auswirkung:** Nutzer in Phase 3 (Tag 7–14) erhalten kein Feedback über ihren Fortschritt im Anfänger-Pfad.

---

## Mittlere Probleme (WICHTIG)

### W-1: TypeVocabCard zeigt falsche Richtung (ES→DE statt DE→ES)

**Datei:** `src/components/LessonView.tsx` — `TypeVocabCard`

**Problem:** TypeVocabCard zeigt das spanische Wort und fragt nach der deutschen Übersetzung. Die Spezifikation fordert für den `vertraut`-Level: zeige DE → Nutzer tippt ES.

**Auswirkung:** Die produktivste Übung (aktive Produktion von Spanisch) wird nie trainiert.

---

### W-2: „Ich weiß es nicht" Button fehlt in TypeVocabCard und FitVocabInput

**Dateien:** `src/components/LessonView.tsx` (TypeVocabCard), `src/components/LessonView.tsx` (FitVocabInput)

**Problem:** Laut Spezifikation soll bei Tippen-Übungen ein "Ich weiß es nicht"-Button vorhanden sein, der die Lösung aufdeckt ohne als falsch zu werten (oder als falsch wertet je nach Spec-Interpretation). Dieser Button fehlt komplett.

**Auswirkung:** Nutzer stecken bei unbekannten Wörtern fest oder müssen raten.

---

### W-3: SpielBildMatching Endscreen — keine Aktionsbuttons

**Datei:** `src/components/SpielBildMatching.tsx`

**Problem:** Der Endscreen zeigt "Schön gespielt. Du hast X von Y Wörtern richtig erkannt." aber keine Buttons für "Nochmal" oder "Zurück".

**Auswirkung:** Nutzer sind nach dem Spiel gefangen — kein Navigationspfad.

---

### W-4: SpielWortPaare Endscreen — keine Aktionsbuttons

**Datei:** `src/components/SpielWortPaare.tsx`

**Problem:** Der Endscreen zeigt "Alle Paare gefunden!" aber keine Buttons für "Nochmal" oder "Zurück".

**Auswirkung:** Nutzer sind nach dem Spiel gefangen — kein Navigationspfad.

---

### W-5: SpielLueckenFuellen Endscreen — keine Aktionsbuttons

**Datei:** `src/components/SpielLueckenFuellen.tsx`

**Problem:** Der Endscreen zeigt "Schön gespielt. Du hast X von Y Lücken richtig gefüllt." aber keine Buttons für "Nochmal" oder "Zurück".

**Auswirkung:** Nutzer sind nach dem Spiel gefangen — kein Navigationspfad.

---

### W-6: SpielReihenfolge Endscreen — keine Aktionsbuttons

**Datei:** `src/components/SpielReihenfolge.tsx`

**Problem:** Der Endscreen zeigt "Schön gespielt. X von Y Sätzen richtig." aber keine Buttons für "Nochmal" oder "Zurück".

**Auswirkung:** Nutzer sind nach dem Spiel gefangen — kein Navigationspfad.

---

### W-7: Wiederholen-Button deaktivierter Subtitle-Text weicht von Spec ab

**Datei:** `src/pages/Heute.tsx`

**Problem:**
```
// Code (deaktiviert):
"Noch zu wenig Vokabeln"

// Spec:
"Wird verfügbar, sobald du Vokabeln gelernt hast"
```

**Auswirkung:** Text ist kürzer und weniger erklärend als spezifiziert.

---

## Kleine Probleme (NICE-TO-HAVE)

### N-1: `console.error()` in `api/lektion.ts`

**Datei:** `api/lektion.ts`

**Problem:** Die Datei enthält `console.error()` Aufrufe in Retry-Logik und Fehlerbehandlung. Laut Codestil-Regeln soll kein `console.*` im finalen Code vorkommen (Regel bezieht sich auf `console.log`, aber `console.error` sollte ebenfalls vermieden werden).

**Schwere:** Niedrig — betrifft nur Server-Logs, keine Funktionalität.

---

### N-2: Wiederholen-Button Border weicht von Spec ab

**Datei:** `src/pages/Heute.tsx`

**Problem:**
```
// Code:
border: '1.5px dashed #C0BAB4'

// Spec:
border: '1px dashed #E0DBD6'
```

**Auswirkung:** Optisch leicht abweichend — dicker und dunklerer Rand.

---

### N-3: Phase1 Okay-Sublabel weicht von Spec ab

**Datei:** `src/lib/anfaengerPfad.ts`

**Problem:**
```
// Code:
okay (phase1): "Wörter lernen + kleines Spiel"

// Spec:
okay (phase1): "Bilder erkennen"
```

---

### N-4: Phase1 Fit-Sublabel weicht von Spec ab

**Datei:** `src/lib/anfaengerPfad.ts`

**Problem:**
```
// Code:
fit (phase1): "Vokabeln mit Bildern kennenlernen"

// Spec:
fit (phase1): "Wörter zusammen finden"
```

---

### N-5: Phase2 Okay-Sublabel weicht von Spec ab

**Datei:** `src/lib/anfaengerPfad.ts`

**Problem:**
```
// Code:
okay (phase2): "Lektion + Wörter in Reihenfolge"

// Spec:
okay (phase2): "Lücken füllen"
```

---

### N-6: Erzähl-gesperrt Sublabel weicht von Spec ab

**Datei:** `src/lib/anfaengerPfad.ts`

**Problem:**
```
// Code:
erzaehl (gesperrt): "Noch nicht freigeschaltet"

// Spec:
erzaehl (gesperrt): "Bald verfügbar"
```

---

## Empfehlung für nächsten Schritt

**Priorität 1 — KRITISCH, vor Release beheben:**

1. **K-1** (Level-Mapping): `LessonView.tsx` TiredVocabStep — switch-Zweige umkehren: `neu → FlipCard`, `lerntief → McqVocabCard`, `vertraut → TypeVocabCard`
2. **K-2** (Phase2+Okay): `Lektion.tsx` handleFinishWithGame — `SpielReihenfolge` → `SpielLueckenFuellen`
3. **K-3** (getAllTrackedVocab): `vocabTracking.ts` — Funktion hinzufügen und exportieren
4. **K-4** (WortPaare Tracking): `SpielWortPaare.tsx` — `recordVocabAnswer()` bei korrektem/falschem Match aufrufen
5. **K-5** (Phase3 Banner): `Heute.tsx` — `showPfadHint` Bedingung auf `phase !== 'inactive'` erweitern; Phase3-spezifischen Text hinzufügen

**Priorität 2 — WICHTIG, kurz nach Release:**

6. **W-1 + W-2**: TypeVocabCard Richtung korrigieren (DE→ES) und "Ich weiß es nicht" Button hinzufügen
7. **W-3 bis W-6**: Alle 4 Spiel-Endscreens mit "Nochmal" und "Zurück" Buttons ausstatten
8. **W-7**: Subtitle-Text des deaktivierten Wiederholen-Buttons angleichen

**Priorität 3 — NICE-TO-HAVE, nächster Iterations-Zyklus:**

9. N-1 bis N-6: Sublabels angleichen, console.error entfernen, Border-Farbe korrigieren

---

## Build-Status

```
✅ tsc --noEmit     → 0 Fehler, 0 Warnungen
✅ vite build       → Bundle erfolgreich
✅ TypeScript strict → keine 'any' Typen
✅ console.log src/ → 0 Vorkommen
✅ Neue Dependencies → keine hinzugefügt
✅ Verbotene Mechaniken → keine (XP, Streaks, Konfetti etc.)
```

---

*Audit durchgeführt am 2026-05-19 auf Branch `feature/v1.1.0-beginner-path-and-games`, Commit `d1e09eb`.*
*Keine Code-Änderungen, keine Commits, keine Branches wurden während des Audits vorgenommen.*
