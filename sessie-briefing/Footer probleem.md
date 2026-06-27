# Footer i18n Probleem — Inbrief
## Datum: sessie 06

---

## Probleem

Op `route.html` en `wandelingen.html` toont de footer:
```
© common.footer.copyright
```
in plaats van:
```
© MyTrailWalks
```

Op `index.html` en `construction.html` werkt de footer correct.

---

## Symptomen

- Probleem consistent op `route.html` en `wandelingen.html`
- Werkt correct op `index.html` en `construction.html`
- Enkel verschil: `route.html` en `wandelingen.html` hebben een pagina-specifiek script (`route.js` / `wandelingen.js`) dat `await window.appReady` gebruikt
- Manueel `i18nModule.applyTranslations()` aanroepen in console geeft `undefined` terug maar werkt niet
- Manueel `document.querySelector("[data-i18n='common:footer.copyright']").textContent = i18nModule.t("common:footer.copyright")` werkt WEL
- `i18next.t("common:footer.copyright")` geeft correct `"MyTrailWalks"` terug
- `i18next.isInitialized` geeft `true`
- `i18next.getResourceBundle("nl", "common")` geeft correct object terug met `footer.copyright`
- Footer span HTML: `<span data-i18n="common:footer.copyright">common.footer.copyright</span>` — sleutel staat als tekstinhoud

---

## Uitgevoerde testen

| Test | Resultaat |
|------|-----------|
| `i18next.isInitialized` | `true` |
| `i18next.t("common:footer.copyright")` | `"MyTrailWalks"` ✓ |
| `i18next.getResourceBundle("nl", "common")` | Correct object ✓ |
| `i18nModule.applyTranslations()` in console | `undefined` — geen effect |
| Manueel `textContent` instellen | Werkt ✓ |
| Hard refresh (Shift+F5) | Geen effect |
| Cache buster toegevoegd aan `app.js` | Geen effect |

---

## Gewijzigde bestanden (zonder succes)

| Bestand | Wijziging | Resultaat |
|---------|-----------|-----------|
| `app.js` v3.1.0 | `common` namespace toegevoegd + `wandelingen`/`route` in `getPageNamespace()` | Geen effect |
| `app.js` v3.2.0 | `Promise.all` vervangen door sequentiële `await` + `applyTranslations(placeholder)` per component | Geen effect |
| `app.js` v3.3.0 | `setTimeout(() => i18nModule.applyTranslations(), 300)` toegevoegd als fallback | Geen effect |
| `wandelingen.js` | `getBasePath()` recursie verwijderd | Recursie opgelost, footer probleem blijft |
| `route.html` | Absolute paden + cache busters | Geen effect op footer |

---

## Vaststellingen

1. `applyTranslations()` werkt niet via console maar manueel instellen van `textContent` werkt wel
2. De footer span bevat de sleutel als tekst (`common.footer.copyright`) — dit betekent dat iets de span vult met de sleutel vóór of ná `applyTranslations()`
3. Op `index.html` en `construction.html` (zonder pagina-specifiek script) werkt het correct
4. `i18nModule.applyTranslations` in `i18n.js` controleert `if (value && value !== key)` — als de span al de sleutel als tekst bevat, is `value !== key` false en wordt de tekst NIET overschreven

---

## Waarschijnlijke oorzaak

**De span bevat de sleutel als initiële tekst.** `applyTranslations()` vergelijkt de vertaling met de sleutel — als ze gelijk zijn wordt niets gedaan. Maar de conditie `value !== key` vergelijkt `"MyTrailWalks"` met `"common:footer.copyright"` — die zijn niet gelijk dus dat is niet het probleem.

**Alternatief:** iets schrijft de sleutel als tekst in de span NADAT `applyTranslations()` al uitgevoerd is. Kandidaat: een tweede aanroep van `injectComponent` die de footer opnieuw injecteert zonder vertalingen toe te passen.

---

## Nog te onderzoeken

- Wordt `injectComponent("footer-placeholder")` meer dan één keer aangeroepen?
- Heeft `route.js` of `wandelingen.js` code die de footer DOM manipuleert?
- Is er een race condition tussen `appReady` en de pagina-specifieke scripts?
