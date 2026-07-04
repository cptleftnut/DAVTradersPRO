# Design- & Layout-Dokumentation: Binance Trading Panel

Dette dokument beskriver designarkitekturen, de tilgængelige visuelle temaer og de strukturelle layout-konfigurationer, der er implementeret for at gøre handelsskærmen mere overskuelig, kontrast-bevidst og kognitivt aflastende for brugeren.

---

## 🎨 1. Farvetemaer (Visual Presets)
For at mindske øjentræthed (eye strain) under forskellige lysforhold understøtter dashboardet nu tre skræddersyede farvetemaer:

| Tema | Navn | Karakteristika | Ideel Anvendelse |
| :--- | :--- | :--- | :--- |
| **Obsidian** | `obsidian` | Det originale mørke cyber-tema med dybe sorte baggrunde (`bg-black/40`), neonfarvede detaljer og krystalklar kontrast i mørke omgivelser. | Standardtema, aften/nat-handel, lavt omgivende lys. |
| **Alpine** | `alpine` | En elegant, fuldstændigt lys brugerflade (`bg-slate-50` / `bg-white`) med bløde indigo accenter, mørkegrå tekst og delikate skygger. | Lyse rum, udendørs brug, forebyggelse af skærmrefleksioner. |
| **Nordic Sage** | `sage` | Et beroligende, organisk mørkt tema bygget op omkring dæmpede skovgrønne toner (`bg-[#111813]`) og salviegrønne rammer (`border-emerald-950`). | Lange trading-sessioner, reducerer kognitiv støj og anstrengelse af øjnene. |

---

## 🗂️ 2. Strukturelle Navigations-layouts
Med 13+ avancerede moduler (Backtester, Journal, AI Copilot, live feeds m.m.) kan den traditionelle vandrette række blive overvældende. Brugeren kan nu vælge mellem tre layouts via **Design Center**:

### A. Kategoriseret Menu (`grouped` - Anbefalet)
* **Koncept**: Opdeler alle 13 faner i 3 faste, logiske overskrifter:
  1. **📊 Overblik**: Dashboard, Historik, Min Pung, Alarmer, Dagbog.
  2. **📈 Analyse**: Korrelation, Live Data, Analyser, Scanner, Global Macro.
  3. **🧪 Strategi & Design**: Sammenlign, Test Forløb, AI Copilot, Design Center.
* **Fordel**: Reducerer den visuelle bredde og tillader hurtig filtrering af faner.

### B. Sidepanel Navigation (`sidebar`)
* **Koncept**: Flytter alle navigationsknapper til et diskret lodret panel på venstre side af skærmen.
* **Fordel**: Giver maksimal lodret plads til grafer, tabeller og ordrebøger. Inkluderer en indbygget, kompakt live-prisindikator i bunden af sidepanelet.

### C. Traditionel Række (`classic`)
* **Koncept**: Den originale horisontale scrollbar-liste, hvor alle moduler ligger på stribe med dynamiske farveikoner.
* **Fordel**: Velkendt, hurtig adgang hvis man har en ultrabred skærm.

---

## 🧬 3. Statistisk Portefølje Analyse (Korrelations-Matrix)
Vi har erstattet den tidligere *Quantum Mirror* med en fuldt funktionel og matematisk præcis **Korrelations-Matrix**:
* **Pearson-r Udregning**: Beregner live samvariation mellem top kryptoaktiver (BTC, ETH, SOL, AVAX, BNB, DOGE) baseret på det valgte antal historiske perioder (30, 60 eller 90 punkter) og tidsramme (1H, 4H, 1D).
* **Beta-koefficient (β)**: Beregner det enkelte aktivs relative følsomhed over for det valgte benchmark.
* **Scatter Plot med Regression**: Viser en lineær regressionslinje (line of best fit) i et recharts-plot til visuel identifikation af spreads.
* **Arbitrage & Hedging-rådgiver**: Giver dynamiske råd til, hvordan man sikrer sig mod markedsudsving ved at tage modgående positioner ud fra den aktuelle korrelations-styrke.

---

## ⚡ 4. Brugeroplevelse (UX) Finjusteringer
* **Hurtige Notifikationer**: Toast-beskeder (via `sonner`) forsvinder nu automatisk efter **1 sekund** (`duration={1000}`) for at holde handelsgrænsefladen fri for blokerende elementer.
* **Lokal Lagring**: Valg af både farvetema og navigations-layout gemmes automatisk i browserens `localStorage`, så indstillingerne overlever genindlæsninger.
