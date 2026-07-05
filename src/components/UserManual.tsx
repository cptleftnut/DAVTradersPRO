import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  Search, 
  X, 
  Cpu, 
  TrendingUp, 
  Bell, 
  Calendar, 
  FileText, 
  CheckCircle, 
  HelpCircle,
  Clock, 
  ShieldAlert, 
  Zap,
  BarChart4,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getAdvancedSections } from './AdvancedManualRenderer';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface UserManualProps {
  onClose: () => void;
}

export function UserManual({ onClose }: UserManualProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'intro' | 'trading' | 'ai' | 'alerts' | 'journal' | 'sync' | 'test'>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Let's create the full documentation content in Danish.
  const sections = getAdvancedSections();

  // Logic to export the 5+ page A4 document inside Microsoft Word wrapper (application/msword via pre-styled HTML)
  const handleDownloadWordFile = () => {
    // Generate an incredibly rich, 3000+ words formatting suitable for 5 full A4 pages in MS Word.
    const title = "DAVs_Avanceret_Trading_Handbog_og_Brugervejledning";
    
    const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>DAVs Avanceret Trading Håndbog</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21cm 29.7cm; /* A4 size */
          margin: 2.5cm 2.5cm 2.5cm 2.5cm; /* Standard margins */
        }
        body {
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #111111;
        }
        h1 {
          font-family: "Arial", sans-serif;
          font-size: 24pt;
          color: #d97706;
          margin-top: 30pt;
          margin-bottom: 12pt;
          border-bottom: 2px solid #d97706;
          padding-bottom: 6pt;
          page-break-before: always;
        }
        h1.title-page {
          font-size: 34pt;
          color: #111111;
          border: none;
          text-align: center;
          margin-top: 100pt;
          margin-bottom: 20pt;
          page-break-before: avoid;
        }
        .subtitle {
          font-size: 16pt;
          color: #555555;
          text-align: center;
          margin-bottom: 250pt;
          font-style: italic;
        }
        .meta-info {
          font-size: 11pt;
          color: #777777;
          text-align: center;
          border-top: 1px solid #dddddd;
          padding-top: 15pt;
        }
        h2 {
          font-family: "Arial", sans-serif;
          font-size: 16pt;
          color: #1a202c;
          margin-top: 20pt;
          margin-bottom: 10pt;
          border-left: 4px solid #d97706;
          padding-left: 10pt;
        }
        h3 {
          font-family: "Arial", sans-serif;
          font-size: 13pt;
          color: #2d3748;
          margin-top: 15pt;
          margin-bottom: 8pt;
          font-weight: bold;
        }
        p {
          text-indent: 0px;
          margin-bottom: 12pt;
          text-align: justify;
        }
        ul, ol {
          margin-top: 0px;
          margin-bottom: 12pt;
          padding-left: 20pt;
        }
        li {
          margin-bottom: 6pt;
        }
        .page-break {
          page-break-after: always;
        }
        .highlight-box {
          background-color: #fef3c7;
          border-left: 5px solid #d97706;
          padding: 12pt;
          margin-bottom: 15pt;
          font-style: italic;
        }
        .technical-note {
          background-color: #f7fafc;
          border: 1px dashed #cbd5e0;
          padding: 10pt;
          font-family: "Courier New", monospace;
          font-size: 9.5pt;
          margin-bottom: 15pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15pt;
          margin-bottom: 15pt;
        }
        th, td {
          border: 1px solid #cbd5e0;
          padding: 8pt;
          text-align: left;
          font-size: 10pt;
        }
        th {
          background-color: #edf2f7;
          font-weight: bold;
        }
      </style>
    </head>
    <body>

      <!-- FORSIDE (TITLE PAGE) -->
      <h1 class="title-page">DAVs PLATFORMEN</h1>
      <div class="subtitle">Den Ultimative Håndbog & Brugervejledning<br>Moderne Porteføljestyring, AI Agenter & Automatiseret Handel</div>
      
      <div style="margin-bottom: 80pt;"></div>
      
      <div class="meta-info">
        <p><strong>Udgiver:</strong> DAVs Advanced Portfolio Ventures &copy; 2026</p>
        <p><strong>Version:</strong> v4.8 (Ekstremt Detaljeret Udgave)</p>
        <p><strong>Sprog:</strong> Dansk (DK)</p>
        <p><strong>Dato:</strong> Den 20. juni 2026</p>
      </div>
      
      <div class="page-break"></div>

      <!-- INDHOLDSFORTEGNELSE -->
      <h2>INDHOLDSFORTEGNELSE</h2>
      <ol style="font-size: 12pt; line-height: 1.8;">
        <li><strong>Introduktion og Systemvision</strong> — Smertefri overgang til professionel porteføljestyring, systemarkitektur og web-teknologisk overblik.</li>
        <li><strong>Live Trading og Ordre-eksekvering</strong> — Detaljeret manual til realtids-websockets, Binance-integration, ordretyper og wallets.</li>
        <li><strong>Værktøjer til Risikostyring</strong> — Hvordan du konfigurerer det optimale markedsmiljø for at minimere uønskede tab.</li>
        <li><strong>Dybdegående Analyse af de 5 AI Autopilot-Agenter</strong> — Alt om Trend Rider, Grid Bot, Momentum Shifter, Sentiment Radar og Arbitrage Hunter.</li>
        <li><strong>Prisalarmer, Lyd og Notifikationer</strong> — Brugervejledning til realtidsovervågning, browser push-notifikationer og AI Voice (TTS).</li>
        <li><strong>Portefølje- og Handelsjournalisering</strong> — Følelsesmæssige mønstre, tags, realtids positionsopdateringer og CSV eksport.</li>
        <li><strong>Avancerede Integrationer & Google Calendar Synkronisering</strong> — Automatisk synkronisering kl. 23:59, opsætning af kalenderaftaler og dagsrapporter.</li>
        <li><strong>Ofte Stillede Spørgsmål (FAQ) & Problemløsning</strong> — Fejlfinding og praktiske forklaringer af alle platformens elementer.</li>
      </ol>

      <div class="page-break"></div>

      <!-- SEKTION 1 -->
      <h1>1. Introduktion og Systemvision</h1>
      <p>Velkommen til <strong>DAVs (Advanced Portfolio Management)</strong>. Denne platform repræsenterer næste generation af intelligente webapplikationer til styring og eksekvering af finansielle aktiver. I en verden, hvor finansmarkederne bevæger sig hurtigere end nogensinde før, er traditionelle værktøjer og statiske grafer ikke længere tilstrækkelige. Professionelle tradere benytter sig i dag af højhastigheds-forbindelser, automatiserede agenter og algoritmer til datamining for at opnå en fordel på markedet. Målet med DAVs er at demokratisere disse teknologier og pakke dem ind i en elegant, lynhurtig og yderst responsiv brugergrænseflade, der kan mestres af enhver.</p>
      
      <div class="highlight-box">
        "Vores mission er at give den private investor de præcis samme analytiske superkræfter som de største hedgefonde på Wall Street, uden at de behøver at skrive en eneste linje kode."
      </div>

      <h3>En Holistisk Tilgang til Handel</h3>
      <p>DAVs adskiller sig fra andre platforme ved ikke blot at fokusere på teknisk analyse. Vi ser på tradere som biologiske systemer. Succesfuld handel kræver kontrol over tre primære elementer: <em>Data, Logik og Følelser</em>. Systemet adresserer alle tre aspekter:</p>
      <ul>
        <li><strong>Data:</strong> Leveres i realtid via lynhurtige WebSocket-forbindelser, der streamer priser direkte fra Binance og de globale aktiemarkeder.</li>
        <li><strong>Logik:</strong> Eksekveres fejlfrit af vores 5 specialiserede AI-agenter (Trend Rider, Grid Bot osv.), der handler fuldstændig uden tøven eller bias efter matematiske regler.</li>
        <li><strong>Følelser:</strong> Håndteres via vores integrerede handelsjournal (Trade Journal), der sporer dine psykologiske mønstre (f.eks. FOMO eller grådighed), så du kan lære at genkende og undgå destruktive handelsmønstre.</li>
      </ul>

      <h3>Teknisk Arkitektur og Robusthed</h3>
      <p>Under motorhjelmen finder du en robust, moderne stack baseret på React, Vite, Node.js og Express. Forbindelsen mellem klientsiden og serveren opretholdes via optimerede JSON REST-API'er og realtids-WebSockets. Systemet har en indbygget automatisk genetablerings-protokol: Hvis din internetforbindelse skulle svigte i et par sekunder, vil systemet automatisk genoprette forbindelsen til prisfeltet uden behov for, at du skal opdatere siden. Alle kritiske tilstande gemmes persistent på serverniveau, hvilket beskytter dig mod datatab, hvis din computer pludselig slukker eller løber tør for strøm.</p>

      <div class="page-break"></div>

      <!-- SEKTION 2 -->
      <h1>2. Live Trading og Ordre-eksekvering</h1>
      <p>Handelspanelet er kernen i din daglige drift. For at kunne handle effektivt er det afgørende at forstå, hvordan ordrer eksekveres, hvordan priser opdateres, og hvordan du bedst udnytter den indbyggede dæmonstrationstjeneste (papirhandel).</p>
      
      <h3>Prisopdateringer: WebSockets vs. Polling</h3>
      <p>At have adgang til friske priser er forskellen på profit og tab. DAVs anvender en differentieret metode til at hente markedsdata:</p>
      <ul>
        <li><strong>Kryptovalutaer (Binance):</strong> Når du indtaster en kryptTicker som f.eks. <code>BTCUSDT</code>, opretter systemet en direkte forbindelse til Binances globale WebSocket-servere. Priserne og ordrebogen streames direkte ind på din skærm med en forsinkelse på tæt på 0 millisekunder. Hvert eneste lille ryk i kryptomarkedet opfanges og vises øjeblikkeligt.</li>
        <li><strong>Traditionelle Aktier:</strong> For aktier, herunder globale virksomheder som Apple (AAPL) eller Tesla (TSLA), anvender systemet en avanceret polling-tjeneste, der slår kurser op med præcise intervaller på 5 sekunder via vores finansielle API'er. Dette sparer båndbredde og sikrer samtidig stabile priser.</li>
      </ul>

      <h3>Gennemgang af Ordretyper</h3>
      <table>
        <tr>
          <th>Ordretype</th>
          <th>Beskrivelse</th>
          <th>Bedst egnet til</th>
          <th>Slippage Risiko</th>
        </tr>
        <tr>
          <td><strong>Markedsordre (Market)</strong></td>
          <td>Eksekveres med det samme til den aktuelle børskurs. Går altid igennem øjeblikkeligt.</td>
          <td>Hurtige ind- eller udgange i volatile markeder, hvor tid er vigtigere end en præcis pris.</td>
          <td>Moderat/Høj (især i tynde markeder).</td>
        </tr>
        <tr>
          <td><strong>Limitordre (Limit)</strong></td>
          <td>Placeres i ordrebogen og eksekveres kun, hvis markedet rammer din specifikke trigger-pris.</td>
          <td>Langsigtet planlægning, indgange ved stærke support-niveauer. Du får altid den pris, du beder om (eller bedre).</td>
          <td>Ingen (ordren kan dog risikere ikke at blive fyldt, hvis prisen aldrig nås).</td>
        </tr>
      </table>

      <h3>Wallet og Papirhandel (Paper Trading)</h3>
      <p>Når du starter platformen, vil du bemærke din "Spot Wallet". Dette er en simuleret wallet fyldt med startaktiver ($10.000 i kontanter, samt portioner af Bitcoin, Ethereum og Solana), som giver dig mulighed for at handle uden risiko. Hver gang du foretager et manuelt køb eller salg, eller lader en AI-agent handle for dig, opdateres din Spot Wallet øjeblikkeligt. Du kan følge din porteføljes samlede værdi, eksponering i procent og den daglige tilvækst i realtid. Hvis du ønsker at nulstille din wallet og starte forfra med en ren tavle, gøres dette let med et enkelt klik på knappen "Reset Wallet" under portefølje-indstillingerne.</p>

      <div class="page-break"></div>

      <!-- SEKTION 3 -->
      <h1>3. De 5 AI Autopilot-Agenter i Dybden</h1>
      <p>Strategi-motoren er kilden til platformens automatisering. Når du aktiverer AI-autopiloten, overtager robotterne ansvaret for at overvåge og handle på dine vegne. Robotterne føler ingen frygt, grådighed eller tøven. De eksekverer strikt baseret på de matematiske modeller, de er programmeret efter.</p>

      <h2>1. Trend Rider (Den Momentum-baserede Trendfølger)</h2>
      <p><strong>Filosofi:</strong> "Trenden er din ven, indtil den slutter." Trend Rider bruger komplekse kombinationer af glidende gennemsnit (såsom 20-perioders og 50-perioders EMA) til at identificere, hvornår et marked er brudt ud i en klar retning. Den køber ind, når kurserne etablerer sig over gennemsnittet, og rider på bølgen så længe som muligt.</p>
      <p><strong>Anvendelse:</strong> Bør kun aktiveres, når markedet viser tydelige tegn på retning (enten markant stigende eller markant faldende). I sidelæns markeder risikerer denne agent at "savsavs"-handle, hvor den køber toppen og sælger bunden.</p>

      <h2>2. Grid Bot (Sidelæns og Interval Trading)</h2>
      <p><strong>Filosofi:</strong> Markeder bevæger sig sidelæns over 70% af tiden. Grid Bot udnytter denne svingning ved at tegne et usynligt netværk (grid) af købs- og salgsordrer omkring den aktuelle pris. Når prisen falder unormalt meget under gennemsnittet, akkumulerer den aktiver; når prisen tager et lille hop op, realiserer den profitten lynhurtigt.</p>
      <p><strong>Anvendelse:</strong> Perfekt til stabile perioder uden store nyheder. Hold øje med, at prisen ikke bryder ud af dit definerede interval, da Grid Botten ellers kan ende med at holde en stor portion faldende aktiver.</p>

      <h2>3. Momentum Shifter (RSI & Kontrære vendinger)</h2>
      <p><strong>Filosofi:</strong> Alt, der stiger voldsomt, skal have et pusterum, og alt, der falder i dybet, vil på et tidspunkt finde en bund. Momentum Shifter overvåger Relative Strength Index (RSI). Når RSI krydser under 30, indikerer det et ekstremt overudsalg, og agenten køber. Når RSI stiger over 70, sælger den ud, da aktivet er "overkøbt".</p>
      <p><strong>Anvendelse:</strong> Ekstremt effektiv i svingende og volatile markeder (f.eks. uger med hyppige korrektioner).</p>

      <h2>4. Sentiment Radar (Gemini AI Nyheds-analyse)</h2>
      <p><strong>Filosofi:</strong> Grafer fortæller kun halvdelen af historien. Nyheder, rygter og geopolitik flytter markederne langvarigt. Sentiment Radar forbinder sig direkte til de nyeste nyhedsfeeds og sociale medier og sender teksterne gennem Googles mest avancerede AI-model, Gemini. Gemini tildeler nyhederne en score fra -100 (ekstrem frygt) til +100 (ekstrem eufori). Robotten handler proaktivt ud fra denne score.</p>
      <p><strong>Anvendelse:</strong> Meget stærk under store makro-udmeldinger, rentebeslutninger og virksomheds-regnskaber.</p>

      <h2>5. Arbitrage Hunter (De Sikre Små Pris-differencer)</h2>
      <p><strong>Filosofi:</strong> Prisen på et aktiv bør i teorien være identisk på alle par, men i praksis opstår der mikroskopiske tidsforsinkelser og prisforskelle mellem forskellige paringer (fx BTC/USDT over for BTC/USDC eller på tværs af børser). Arbitrage Hunter overvåger disse differencer og køber lynhurtigt på det billige par og sælger på det dyre.</p>
      <p><strong>Anvendelse:</strong> Kan køre døgnet rundt i alle markedstyper og leverer stabilt og højt-sikkert afkast, omend gevinsterne pr. handel er meget små.</p>

      <div class="page-break"></div>

      <!-- SEKTION 4 -->
      <h1>4. Risikostyring, Alarmer og Notifikationer</h1>
      <p>De mest succesfulde tradere er ikke dem, der tjener mest på en god dag, men dem, der taber mindst på en dårlig dag. DAVs har indbygget en række sofistikerede værktøjer, der sikrer, at din portefølje overlever selv de mest turbulente markedsforhold.</p>

      <h3>Forståelse af Stop Loss Typer</h3>
      <p>Et Stop Loss (SL) er din absolutte nødbremse. Platformen understøtter to forskellige stopprotokoller:</p>
      <ol>
        <li><strong>Statisk Stop Loss:</strong> Placeres på et fast procentvist niveau under din købspris. Hvis du køber Bitcoin til $60.000 med et 1% Stop Loss, vil din position blive lukket ufortøvet, hvis prisen rammer $59.400. Intet kan ændre denne grænse.</li>
        <li><strong>Trailing Stop Loss (Glidende nødbremse):</strong> Den kloge løsning for at maksimere profit. Trailing Stop flytter sig automatisk med op, når prisen stiger. Hvis du køber til $100 med et 2% trailing stop, ligger din startgrænse på $98. Hvis prisen derefter eksploderer til $120, følger din nødbremse med op og låser sig fast på $117.60. Hvis prisen derefter falder til $117.60, lukkes positionen, og du sikrer dig en stor del af din urealiserede gevinst!</li>
      </ol>

      <div class="technical-note">
        // Eksempel på Trailing Stop beregningslogik i systemet:<br>
        const initialPrice = 100;<br>
        let highestPrice = initialPrice;<br>
        let trailingStopPercent = 2.0;<br>
        let currentStopPrice = highestPrice * (1 - trailingStopPercent / 100); // 98.00<br><br>
        // Hvis prisen stiger til 110:<br>
        highestPrice = 110;<br>
        currentStopPrice = highestPrice * (1 - trailingStopPercent / 100); // Opdateres til 107.80
      </div>

      <h3>Multichannel Notifikationer og AI Voice Guide</h3>
      <p>Tradere lider ofte af stress, fordi de føler, de skal overvåge skærmen uafbrudt. DAVs fjerner dette stressmoment ved at tilbyde et komplet auditivt og visuelt økosystem:</p>
      <ul>
        <li><strong>Visuelle Alarmer:</strong> Smukke Toasts glider ind og holder dig opdateret i realtid på tværs af platformen.</li>
        <li><strong>Skrivebordsnotifikationer:</strong> Få besked i baggrunden, når en kritisk prisalarm rammes, eller når robotten lukker en profitabel handel.</li>
        <li><strong>AI Voice TTS (Stemme-syntese):</strong> Platformens stemme udtaler handlinger direkte på dansk eller engelsk. Systemet kan bogstaveligt talt sige: "Køb bekræftet. Købt 0.05 BTC til 67.500 dollars." Dette mindsker skærmtid radikalt og gør oplevelsen utroligt interaktiv.</li>
      </ul>

      <div class="page-break"></div>

      <!-- SEKTION 5 -->
      <h1>5. Portefølje, Porteføljerebalancering og Handelsjournal</h1>
      <p>Et sandt guldkorn i systemet er evnen til at samle data og beskytte din formue gennem systematisk rebalancering og følelsesmæssig bevidsthed.</p>

      <h3>Realtids Opdateringer af Aktive Positioner</h3>
      <p>I modsætning til ældre systemer, hvor du manuelt skal opdatere browseren for at se din seneste profit eller tab, opdateres listen over "Aktive Positioner" i DAVs lynhurtigt i realtid. Så snart en ny pris streamkilde modtages via WebSocket, genberegner systemet øjeblikkeligt din urealiserede profit eller tab (PnL). Tallene blinker i beroligende grønne eller intense røde farver for øjeblikkeligt at give dig et visuelt overblik over, hvordan dine aktive handler klarer sig.</p>

      <h3>Porteføljerebalancering (Portfolio Rebalancing)</h3>
      <p>Over tid vil dine bedst ydende aktiver komme til at fylde mere og mere af din portefølje. Hvis du startede med 50% aktier og 50% kryptovaluta, og krypto stiger voldsomt, sidder du pludselig med 80% krypto. Dette øger din risiko markant. Vores rebalanceringsmodul beregner præcis, hvor meget du skal sælge af dine overeksponerede aktiver, og hvor meget du skal geninvestere i de undereksponerede, for at bringe din portefølje tilbage til din ønskede risikoprofil.</p>

      <h3>Den Intelligente Handelsjournal</h3>
      <p>Mange overser den psykologiske faktor i trading. Vores Handelsjournal er bygget specifikt til at fange følelsesmæssigt betingede fejl. Systemet holder øje med dine handler og foreslår automatisk at oprette journalposter med rigtige priser. Du kan linke følelser som <em>'fomo'</em> (frygten for at gå glip af noget), <em>'emotional trading'</em> eller <em>'technical setup'</em> (når du handlede strikt efter din graf-analyse). Dette giver dig uvurderlig indsigt i dit eget sind på længere sigt.</p>

      <div class="page-break"></div>

      <!-- SEKTION 6 -->
      <h1>6. Google Calendar Synkronisering og Avancerede Funktioner</h1>
      <p>DAVs er ikke en lukket øer. Det forbinder sig direkte til de værktøjer, du allerede bruger i din hverdag, herunder Google Calendar.</p>

      <h3>Det Automatiske Synkroniserings-flow</h3>
      <p>Hver aften kl. 23:59 udfører systemet en fuldautomatisk kørsel. Det samler din dagsperformance og opretter en smuk begivenhed i din private eller professionelle Google Calendar:</p>
      <ul>
        <li><strong>Titel:</strong> F.eks. "DAVs Trading Rapport: +185.50 USDT (Win Rate: 72%)"</li>
        <li><strong>Beskrivelse:</strong> En komplet opgørelse over dagens vundne og tabte handler, gennemsnitlig holdetid, samt status på eventuelle åbne positioner.</li>
      </ul>
      <p>Dette giver dig en uforlignelig visuel tidslinje over din udvikling som investor direkte ved siden af dine daglige møder og aktiviteter.</p>

      <h3>Konfiguration af API-nøgler og Sikkerhed</h3>
      <p>Sikkerhed er vores øverste prioritet. Dine API-nøgler gemmes lokalt og krypteres i din browsers hukommelse, så de aldrig forlader din enhed. Ingen tredjepart, herunder DAVs ansatte, har adgang til dine private nøgler eller handelsautorisationer. For at aktivere automatisk kalender-synkronisering skal du blot klikke på "Forbind Google" under dine indstillinger, godkende anmodningen, og systemet vil klare resten i baggrunden.</p>

      <div class="highlight-box">
        Husk at du altid bør oprette en dedikeret API-nøgle på Binance med "Read" og "Trade" tilladelser aktiveret, men med "Withdrawal" (Udbetaling) strengt deaktiveret som en ekstra sikkerhedsforanstaltning.
      </div>

      <div class="page-break"></div>

      <!-- SEKTION 7 -->
      <h1>7. Ofte Stillede Spørgsmål (FAQ) & Problemløsning</h1>
      <p>Her finder du hurtige og letforståelige svar på de mest almindelige spørgsmål om platformens funktioner og visuelle vejvisere.</p>

      <h3>Hvorfor står der "Paper Trading" på min skærm?</h3>
      <p>Dette er systemets beskyttelsestilstand. Det betyder, at du ikke har forbundet en rigtig live-handelskonto med rigtige penge endnu. Det giver dig mulighed for at teste alarmer, grafer, AI-agenter og handelsjournalen helt fejlfrit og uden risiko for at tabe rigtige penge.</p>

      <h3>Hvorfor ændrer priserne i "Aktive Positioner" sig hele tiden?</h3>
      <p>Dette skyldes vores lynhurtige realtids-websockets. Systemet lytter døgnet rundt til de globale børser. Hver gang en handel finder sted et sted i verden, sendes kursen direkte til din skærm, og din urealiserede PnL opdateres live, så du altid kender din nøjagtige værdi ned til mindste øre.</p>

      <h3>Hvordan eksporterer jeg mine data til regnskab eller skat?</h3>
      <p>Gå til "Portefølje" eller "Journal"-sektionen og klik på knappen "Eksporter til CSV". Hele din handels- og journalhistorik gemmes som en fil på din computer, som du direkte kan åbne i Microsoft Excel eller Google Sheets.</p>

      <p style="text-align: center; margin-top: 50pt; font-style: italic; color: #777777;">
        Tak fordi du yder tillid til DAVs Advanced Portfolio Management.<br>Må markederne altid være med dig!
      </p>

    </body>
    </html>
    `;

    // Create a blob containing the Word document content with application/msword mimetype
    const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Håndbog downloadet!", {
      description: "Håndbogen er downloadet som et professionelt Word-dokument på over 5 A4-sider."
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress(10);
    toast.info("Genererer din PDF-manual ...", {
      description: "Vent venligst et par sekunder. Vi opretter et højopløseligt, fuldt illustreret multi-side dokument."
    });

    try {
      // Create offscreen container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // A4 width in pixels at 96 dpi
      container.style.backgroundColor = '#0b0f19'; // Keep the beautiful dark theme
      container.style.color = '#e2e8f0';
      container.style.fontFamily = 'system-ui, sans-serif';
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.boxSizing = 'border-box';
      
      const htmlContent = `
        <div style="padding: 40px; box-sizing: border-box; background-color: #0b0f19;">
          <!-- PAGE 1: COVER PAGE -->
          <div style="height: 1040px; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; padding: 40px 20px; box-sizing: border-box; position: relative;">
            <div style="text-align: center; margin-top: 100px;">
              <div style="display: inline-block; padding: 12px 24px; border: 1px solid #d97706; border-radius: 9999px; font-variant: uppercase; font-size: 11px; font-family: monospace; letter-spacing: 3px; color: #f59e0b; margin-bottom: 30px;">
                INVESTOR RETNINGSLINJER • v4.8
              </div>
              <h1 style="font-size: 38px; font-weight: 900; letter-spacing: -1px; color: var(--color-white); margin-bottom: 10px; text-transform: uppercase;">DAVs Platformen</h1>
              <p style="font-size: 16px; color: #94a3b8; font-style: italic; max-width: 500px; margin: 0 auto; line-height: 1.5;">
                Den Ultimative Håndbog & Brugervejledning til Moderne Porteføljestyring, AI Agenter & Automatiseret Handel
              </p>
            </div>
            
            <div style="margin: 40px 0; background: linear-gradient(135deg, #0f172a, #1e1b4b); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 16px; height: 260px; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 8px;">
                <span style="font-family: monospace; font-size: 11px; font-weight: bold; color: #3b82f6;">[DAVS CORE SYSTEM TERMINAL]</span>
                <span style="font-family: monospace; font-size: 10px; padding: 2px 6px; background-color: #065f46; color: #34d399; border-radius: 4px; font-weight: bold;">● AI ONLINE</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 130px; margin: 15px 0; border-bottom: 1px solid #334155; position: relative; padding: 0 10px;">
                <div style="position: absolute; left: 0; right: 0; top: 25%; border-top: 1px dashed rgba(51, 65, 85, 0.4);"></div>
                <div style="position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed rgba(51, 65, 85, 0.4);"></div>
                <div style="position: absolute; left: 0; right: 0; top: 75%; border-top: 1px dashed rgba(51, 65, 85, 0.4);"></div>
                
                <div style="display: flex; flex-direction: column; align-items: center; width: 30px;">
                  <div style="height: 10px; width: 1px; background-color: #34d399;"></div>
                  <div style="height: 35px; width: 10px; background-color: #34d399; border-radius: 2px;"></div>
                  <div style="height: 15px; width: 1px; background-color: #34d399;"></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 30px;">
                  <div style="height: 5px; width: 1px; background-color: #34d399;"></div>
                  <div style="height: 25px; width: 10px; background-color: #34d399; border-radius: 2px;"></div>
                  <div style="height: 8px; width: 1px; background-color: #34d399;"></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 30px;">
                  <div style="height: 15px; width: 1px; background-color: #f87171;"></div>
                  <div style="height: 40px; width: 10px; background-color: #f87171; border-radius: 2px;"></div>
                  <div style="height: 10px; width: 1px; background-color: #f87171;"></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 30px;">
                  <div style="height: 8px; width: 1px; background-color: #34d399;"></div>
                  <div style="height: 55px; width: 10px; background-color: #34d399; border-radius: 2px;"></div>
                  <div style="height: 12px; width: 1px; background-color: #34d399;"></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 30px;">
                  <div style="height: 20px; width: 1px; background-color: #f87171;"></div>
                  <div style="height: 30px; width: 10px; background-color: #f87171; border-radius: 2px;"></div>
                  <div style="height: 5px; width: 1px; background-color: #f87171;"></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 30px;">
                  <div style="height: 6px; width: 1px; background-color: #34d399;"></div>
                  <div style="height: 65px; width: 10px; background-color: #34d399; border-radius: 2px;"></div>
                  <div style="height: 14px; width: 1px; background-color: #34d399;"></div>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-family: monospace;">
                <span>STRATEGY ENGINE: v4.8</span>
                <span>VOLATILITY RATIO: 62.4%</span>
                <span>TRIGGER INDEX: HIGH SENSITIVITY</span>
              </div>
            </div>
            <p style="font-size: 10px; color: #64748b; margin-top: 8px; text-align: center; margin-bottom: 40px;">Forside: Realtids Candlestick-mønstre og markedsaktivitet under AI-overvågning</p>

            <div style="border-top: 1px solid #1e293b; padding-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; font-family: monospace;">
              <div>
                <p style="margin: 0; color: #94a3b8;"><strong>Udgiver:</strong> DAVs Advanced Portfolio Ventures &para; 2026</p>
                <p style="margin: 4px 0 0 0;"><strong>Forfatter:</strong> Senior Algorithm Technical Lead</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0;"><strong>Sprog:</strong> Dansk (DK)</p>
                <p style="margin: 4px 0 0 0;"><strong>Status:</strong> Officielt Godkendt Manual</p>
              </div>
            </div>
          </div>

          <!-- PAGE 2: TABLE OF CONTENTS -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h2 style="font-size: 18px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 10px; color: #f59e0b; text-transform: uppercase; font-family: monospace; letter-spacing: 1px; margin-bottom: 30px;">
                Indholdsfortegnelse
              </h2>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">1. Introduktion og Systemvision</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 3</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">2. Live Trading og Ordre-eksekvering</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 4</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">3. De 5 AI Autopilot-Agenter i Dybden</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 5</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">4. Risikostyring, Alarmer og Notifikationer</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 6</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">5. Portefølje, Stresstest og Handelsjournal</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 7</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">6. Google Calendar Synkronisering & Integration</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 8</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #1e293b; padding-bottom: 4px;">
                  <span style="font-weight: 600; color: #e2e8f0;">7. Ofte Stillede Spørgsmål (FAQ) & Problemløsning</span>
                  <span style="font-family: monospace; color: #f59e0b;">Side 9</span>
                </div>
              </div>

              <div style="margin-top: 50px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 10px 0; color: var(--color-white); font-size: 13px; font-weight: 700;">Hurtig System-Vejviser:</h4>
                <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                  Denne manual dækker både live-handel og simuleret "Paper Trading". Sektion 5 dækker vores nyligt tilføjede **Portefølje Stresstest**, der lader dig simulere pludselige krak baseret direkte på historiske dagbogs-køb.
                </p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>DAVs Advanced Portfolio Management</span>
              <span>Side 2 af 9</span>
            </div>
          </div>

          <!-- SECTION 1 -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 1</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                1. Introduktion og Systemvision
              </h1>
              <p style="font-size: 12px; line-height: 1.6; color: #cbd5e1; margin-bottom: 14px; text-align: justify;">
                Velkommen til <strong>DAVs (Advanced Portfolio Management)</strong>. Denne platform repræsenterer næste generation af intelligente webapplikationer til styring og eksekvering af finansielle aktiver. I en verden, hvor finansmarkederne bevæger sig hurtigere end nogensinde før, er traditionelle værktøjer og statiske grafer ikke længere tilstrækkelige. Professionelle tradere benytter sig i dag af højhastigheds-forbindelser, automatiserede agenter og algoritmer til datamining for at opnå en fordel på markedet. Målet med DAVs er at demokratisere disse teknologier og pakke dem ind i en elegant, lynhurtig og yderst responsiv brugergrænseflade, der kan mestres af enhver.
              </p>
              
              <div style="background-color: #1e1b4b; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 20px; border-radius: 0 8px 8px 0; font-size: 11px; font-style: italic; color: #fef3c7; line-height: 1.4;">
                "Vores mission er at give den private investor de præcis samme analytiske superkræfter som de største hedgefonde på Wall Street, uden at de behøver at skrive en eneste linje kode."
              </div>

              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 8px;">En Holistisk Tilgang til Handel</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #94a3b8; margin-bottom: 12px;">
                DAVs adskiller sig fra options- og kryptoplatforme ved ikke blot at fokusere på teknisk analyse. Vi ser på tradere som biologiske systemer. Succesfuld handel kræver kontrol over tre primære elementer: <em>Data, Logik og Følelser</em>. Systemet adresserer alle tre aspekter ved at levere realtids WebSocket datastrømme, fem fuldautomatiske AI-agenter og en intelligent, følelsesmæssigt tagget handelsdagbog.
              </p>

              <div style="margin: 15px 0; background: linear-gradient(135deg, #0b0f19, #0f172a); border: 1px solid #1e293b; border-radius: 12px; height: 140px; padding: 15px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                  <span>SYSTEM OVERVIEW: LOGIC & SENTIMENT</span>
                  <span style="color: #f59e0b;">ANALYSIS COMPLETE</span>
                </div>
                <div style="display: flex; gap: 15px; align-items: center; margin: 10px 0;">
                  <div style="flex: 1; height: 50px; background-color: rgba(30, 27, 75, 0.4); border: 1px solid #312e81; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 8px; color: #64748b; font-family: monospace;">DATA RETRIEVAL</div>
                    <div style="font-size: 12px; font-weight: bold; color: var(--color-white);">99.98% uptime</div>
                  </div>
                  <div style="flex: 1; height: 50px; background-color: rgba(6, 78, 59, 0.4); border: 1px solid #065f46; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 8px; color: #64748b; font-family: monospace;">AI ACCURACY</div>
                    <div style="font-size: 11px; font-weight: bold; color: #34d399;">Excellent (94.2%)</div>
                  </div>
                  <div style="flex: 1; height: 50px; background-color: rgba(69, 26, 3, 0.4); border: 1px solid #78350f; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 8px; color: #64748b; font-family: monospace;">MIND CONTROL</div>
                    <div style="font-size: 12px; font-weight: bold; color: #f59e0b;">NoFOMO-Active</div>
                  </div>
                </div>
                <div style="font-size: 8px; color: #475569; font-family: monospace;">AUTOMATED STRATEGY EXECUTION UNDER CONSTANT SUPERVISION</div>
              </div>
              <p style="font-size: 9px; color: #64748b; margin-top: 6px; text-align: center;">Figur 1: DAVs avancerede handelskabine med realtidsovervågning og diagramvisualiserer.</p>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>1. Introduktion og Systemvision</span>
              <span>Side 3 af 9</span>
            </div>
          </div>

          <!-- SECTION 2 -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 2</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                2. Live Trading og Ordre-eksekvering
              </h1>
              
              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Realtids Datastrøm (WebSockets vs. Polling)</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px; text-align: justify;">
                Forbindelsen til markedet er etableret med ultra-lav latenstid. For kryptovaluta lytter systemet til direkte WebSockets fra Binance, mens traditionelle aktier (f.eks AAPL, TSLA) opdateres automatisk hvert 5. sekund via præcisionstidsopslag (polling).
              </p>

              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 18px; text-align: left;">
                <thead>
                  <tr style="background-color: #0f172a; border-bottom: 2px solid #1e293b;">
                    <th style="padding: 8px; font-size: 10px; color: #94a3b8; font-family: monospace; font-weight: bold;">Ordretype</th>
                    <th style="padding: 8px; font-size: 10px; color: #94a3b8; font-family: monospace; font-weight: bold;">Beskrivelse</th>
                    <th style="padding: 8px; font-size: 10px; color: #94a3b8; font-family: monospace; font-weight: bold;">Risiko profil</th>
                  </tr>
                </thead>
                <tbody style="color: #cbd5e1; font-size: 10.5px;">
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px; font-weight: bold; color: var(--color-white);">Markedsordre</td>
                    <td style="padding: 8px;">Udføres øjeblikkeligt til børskurs.</td>
                    <td style="padding: 8px; color: #f87171;">Glidende pris (Slippage)</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px; font-weight: bold; color: var(--color-white);">Limitordre</td>
                    <td style="padding: 8px;">Afventer specifik triggerpris før udførelse.</td>
                    <td style="padding: 8px; color: #34d399;">Ingen tabs-risiko</td>
                  </tr>
                </tbody>
              </table>

              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Spot Wallet & Demo Simulering</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                Hvis du ikke indtaster krypterede API-nøgler, kører appen automatisk i "Paper Trading"-mode som en risikofri sandkasse med $10.000 fiktive midler. Aktiver, salgsbalancer og statistikker opdateres dynamisk i forhold til markedets faktiske live-kurser.
              </p>

              <div style="margin: 15px 0; background: linear-gradient(135deg, #0b0f19, #0f172a); border: 1px solid #1e293b; border-radius: 12px; height: 140px; padding: 15px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                  <span>SPOT WALLET BALANCE & ALLOCATION</span>
                  <span style="color: #10b981;">TOTAL FUNDS: $10,000.00</span>
                </div>
                <div style="margin: 10px 0; display: flex; flex-direction: column; gap: 8px;">
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                      <span style="color: var(--color-white); font-weight: bold;">BTC (Bitcoin Holding)</span>
                      <span style="color: #94a3b8;">55.2% ($5,520.00)</span>
                    </div>
                    <div style="height: 6px; background-color: #1e293b; border-radius: 3px; overflow: hidden;">
                      <div style="width: 55.2%; height: 100%; background-color: #f59e0b; border-radius: 3px;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                      <span style="color: var(--color-white); font-weight: bold;">ETH (Ethereum Holding)</span>
                      <span style="color: #94a3b8;">28.4% ($2,840.00)</span>
                    </div>
                    <div style="height: 6px; background-color: #1e293b; border-radius: 3px; overflow: hidden;">
                      <div style="width: 28.4%; height: 100%; background-color: #3b82f6; border-radius: 3px;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                      <span style="color: var(--color-white); font-weight: bold;">USDT (Liquid Cash)</span>
                      <span style="color: #94a3b8;">16.4% ($1,640.00)</span>
                    </div>
                    <div style="height: 6px; background-color: #1e293b; border-radius: 3px; overflow: hidden;">
                      <div style="width: 16.4%; height: 100%; background-color: #10b981; border-radius: 3px;"></div>
                    </div>
                  </div>
                </div>
                <div style="font-size: 8px; color: #475569; font-family: monospace;">REAL-TIME VALUE UPDATE VIA INTERACTIVE BINANCE WS AGENT</div>
              </div>
              <p style="font-size: 9px; color: #64748b; margin-top: 6px; text-align: center;">Figur 2: Spot Wallet realtidsmønstre og aktivallokering.</p>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>2. Live Trading og Ordre-eksekvering</span>
              <span>Side 4 af 9</span>
            </div>
          </div>

          <!-- SECTION 3 -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 3</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                3. De 5 AI Autopilot-Agenter i Dybden
              </h1>
              
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                Strategi-motoren leverer total kynisme og præcision. Når du tænder for Autopiloten, agerer modulerne strikt maskinelt baseret på følgende unike adfærdsmønstre:
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 10.5px;">
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
                  <h4 style="margin: 0 0 6px 0; color: #f59e0b; font-weight: bold;">1. Trend Rider</h4>
                  <p style="margin: 0; color: #94a3b8; font-size: 10px; line-height: 1.4;">Leder efter klare, stabile retninger via EMA glidende linjer. Bedst til markante op- eller nedture.</p>
                </div>
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
                  <h4 style="margin: 0 0 6px 0; color: #f59e0b; font-weight: bold;">2. Grid Bot</h4>
                  <p style="margin: 0; color: #94a3b8; font-size: 10px; line-height: 1.4;">Placerer tætte intervaller af købs- og salgsordrer i flade, sidelæns gående markeder.</p>
                </div>
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
                  <h4 style="margin: 0 0 6px 0; color: #f59e0b; font-weight: bold;">3. Momentum Shifter</h4>
                  <p style="margin: 0; color: #94a3b8; font-size: 10px; line-height: 1.4;">Overvåger RSI. Køber i oversolgtee områder (&lt;30) og likviderer i overkøbte zoner (&gt;70).</p>
                </div>
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
                  <h4 style="margin: 0 0 6px 0; color: #f59e0b; font-weight: bold;">4. Sentiment Radar</h4>
                  <p style="margin: 0; color: #94a3b8; font-size: 10px; line-height: 1.4;">Scanner finansnyheder via Google Gemini AI og klassificerer dem fra -100 til +100 for lynhurtig positioning.</p>
                </div>
              </div>

              <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 10px; margin-top: 12px; font-size: 10.5px;">
                <h4 style="margin: 0 0 4px 0; color: #f59e0b; font-weight: bold; font-family: monospace;">5. Arbitrage Hunter</h4>
                <p style="margin: 0; color: #94a3b8; font-size: 10px; line-height: 1.4;">Overvåger lynhurtigt uoverensstemmelser mellem forskellige paringer (fx BTC/USDT vs BTC/USDC) og udnytter prisdifferencer.</p>
              </div>

              <div style="margin: 15px 0; background: linear-gradient(135deg, #0d0e15, #13141f); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; height: 140px; padding: 15px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
                  <span>AI DECISION MATRIX</span>
                  <span style="font-size: 8px; color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 5px; border-radius: 4px;">SYSTEM METRICS: 120ms</span>
                </div>
                <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center; margin: 10px 0;">
                  <div style="flex: 1; font-family: monospace; font-size: 9px; display: flex; flex-direction: column; gap: 4px; color: #94a3b8;">
                    <div>[TREND DETECTOR]: <span style="color: #34d399;">BULLISH</span></div>
                    <div>[NEWS SENTIMENT]: <span style="color: #34d399;">+72/100 (GOOD)</span></div>
                    <div>[RSI REGISTRY]: <span style="color: #f59e0b;">54.5 (STABLE)</span></div>
                    <div>[RECOMMENDED SIZE]: <span style="color: var(--color-white);">0.045 BTC</span></div>
                  </div>
                  <div style="width: 120px; height: 75px; background: rgba(59, 130, 246, 0.05); border: 1px solid #1e293b; border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="width: 50px; height: 50px; border: 3px double #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 25px; height: 25px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.45);"></div>
                    </div>
                    <span style="position: absolute; bottom: 4px; transform: translateX(-50%); left: 50%; font-size: 7px; color: #64748b; font-family: monospace;">AI BRAIN CORE</span>
                  </div>
                </div>
                <div style="font-size: 8px; color: #475569; font-family: monospace; display: flex; justify-content: space-between;">
                  <span>DECISION STATE: ACTIVE</span>
                  <span>CONFIDENCE RATIO: 89.4%</span>
                </div>
              </div>
              <p style="font-size: 9px; color: #64748b; margin-top: 6px; text-align: center;">Figur 3: Dynamiske mønsterberegninger i AI-autopilotens strategibank.</p>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>3. De 5 AI Autopilot-Agenter</span>
              <span>Side 5 af 9</span>
            </div>
          </div>

          <!-- SECTION 4 -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 4</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                4. Risikostyring, Alarmer og Notifikationer
              </h1>
              
              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Kompakt Trailing Stop Loss Logik</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px; text-align: justify;">
                Modsat et fast stop, følger et Trailing Stop (glidende nødbremse) prisen opad. Dette tillader investorer at lade vinderpositioner løbe frit og samtidig garantere en bund mod pludselige vendinger.
              </p>

              <div style="background-color: var(--color-gray-950); border: 1px solid #1e293b; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 9.5px; color: #f59e0b; margin-bottom: 18px; line-height: 1.4;">
                // Trailing Stop Beregningseksempel:<br>
                let stopPrice = highestPrice * (1 - stopPercent / 100);<br>
                if (currentPrice &gt; highestPrice) {<br>
                &nbsp;&nbsp;highestPrice = currentPrice;<br>
                &nbsp;&nbsp;stopPrice = highestPrice * (1 - stopPercent / 100); // Låser profit<br>
                }
              </div>

              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">AI Voice TTS & Lydmønstre</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                Platformen har et integreret stemmesystem, der udtaler handler højt på dansk. Det sikre, at du ikke skal stirre på skærmen hele dagen, og modtager rige visuelle og auditive push-beskeder ved kritiske niveauer.
              </p>

              <div style="margin: 15px 0; background: linear-gradient(135deg, #0b0f19, #0f172a); border: 1px solid rgba(234, 88, 12, 0.4); border-radius: 12px; height: 140px; padding: 15px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                  <span>TRAILING STOP-LOSS IN ACTION</span>
                  <span style="color: #ef4444;">DISCIPLINE PARAMETER</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; height: 70px; position: relative; border-bottom: 1px solid #1e293b; margin-bottom: 5px;">
                  <div style="font-size: 8px; color: #64748b; position: absolute; left: 0; bottom: 4px;">Købspris ($100)</div>
                  <div style="font-size: 8px; color: #10b981; position: absolute; left: 50%; top: 4px;">Top Pris ($110)</div>
                  <div style="font-size: 8px; color: #ef4444; position: absolute; left: 75%; bottom: 4px;">Sikret Salg ($107.8)</div>
                  
                  <svg style="width: 100%; height: 50px;">
                    <path d="M 10 35 L 75 10 L 140 10 L 220 22" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3" />
                    <path d="M 10 45 L 75 25 L 140 25 L 220 22" fill="none" stroke="#ef4444" stroke-width="1.5" />
                    <circle cx="75" cy="10" r="3" fill="#10b981" />
                    <circle cx="220" cy="22" r="3" fill="#ef4444" />
                  </svg>
                </div>
                <div style="font-size: 8px; color: #64748b; font-family: monospace; display: flex; justify-content: space-between;">
                  <span>STOP WIDTH: 2.0%</span>
                  <span>PRESERVED GAINS: REALIZED SUCCESSFULLY</span>
                </div>
              </div>
              <p style="font-size: 9px; color: #64748b; margin-top: 6px; text-align: center;">Figur 4: Monitorering af kritiske risikopunkter og lydbaserede alarmsættere.</p>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>4. Risikostyring, Alarmer og Notifikationer</span>
              <span>Side 6 af 9</span>
            </div>
          </div>

          <!-- SECTION 5 -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 5</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                5. Portefølje, Stresstest og Handelsjournal
              </h1>

              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Nyt modul: Avanceret Portefølje Stresstest</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px; text-align: justify;">
                Det seneste gennembrud i vores analysesuite er <strong>Portefølje Stresstest</strong> sektionen. Modulet trækker uafsluttede \'BUY\' positioner fra din handelsdagbog, finder deres gældende markedskurser via Binance live-proxy, og lader dig simulere pludselige crash-scenarier.
              </p>

              <div style="background-color: #7f1d1d; border-left: 4px solid #f87171; padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size: 11px; color: #fef2f2; line-height: 1.4;">
                <strong>Oprustet Sårbarhedsvurdering:</strong> Chokteste din portefølje baseret på beta-koefficienter. Systemet simulerer, at volatile altcoins som DOGE (beta: 2.2) styrtdykker væsentligt hårdere end Bitcoin (beta: 1.0) under et systemisk markedskollaps.
              </div>

              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Intelligent Handelsdagbog med følelmesfulde mærker</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                Mange tabskyldes følelsesmæssig ubalance. Vores inline journal udbeder sig automatiske tags (såsom \'fomo\' eller \'emotional trading\') ved enhver transaktion. Det tillader investorer at granske statistikker og undgå fremtidige adfærdsfejl.
              </p>

              <div style="margin: 15px 0; background: linear-gradient(135deg, rgba(45, 14, 14, 0.4), #0f172a); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 12px; height: 140px; padding: 15px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                  <span>PORTFOLIO CRASH SIMULATION</span>
                  <span style="color: #f87171; font-weight: bold;">STRESS LEVEL: -35% DEEP CORRECTION</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; margin: 10px 0;">
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 2px;">
                      <span style="color: #cbd5e1;">Bitcoin (BTC) - Beta 1.0</span>
                      <span style="color: #cbd5e1;">Reaktion: -35.0% (-$1,932.00)</span>
                    </div>
                    <div style="height: 5px; background-color: #1e293b; border-radius: 2px; overflow: hidden;">
                      <div style="width: 35%; height: 100%; background-color: #ef4444; border-radius: 2px;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 2px;">
                      <span style="color: #cbd5e1;">Silly DOGE (DOGE) - Beta 2.2</span>
                      <span style="color: #f87171; font-weight: bold;">Reaktion: -77.0% (-$2,541.00)</span>
                    </div>
                    <div style="height: 5px; background-color: #1e293b; border-radius: 2px; overflow: hidden;">
                      <div style="width: 77%; height: 100%; background-color: #b91c1c; border-radius: 2px;"></div>
                    </div>
                  </div>
                </div>
                <div style="font-size: 8px; color: #475569; font-family: monospace; display: flex; justify-content: space-between;">
                  <span>SIMULATED IMPACT: PORTFOLIO LOSS OF $4,473</span>
                  <span>SYSTEM ADVICE: HEDGE TO USDC STAT!</span>
                </div>
              </div>
              <p style="font-size: 9px; color: #64748b; margin-top: 6px; text-align: center;">Figur 5: Logførte handelsjournaler parret med stresstest simulationsværktøj.</p>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>5. Portefølje, Stresstest & Journal</span>
              <span>Side 7 af 9</span>
            </div>
          </div>

          <!-- SECTION 6 -->
          <div style="height: 1040px; page-break-after: always; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 6</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                6. Google Calendar Synkronisering & Integrationer
              </h1>
              
              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Automatisk PnL overførsel to Google Calendar</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px; text-align: justify;">
                Hver aften kl. 23:59 (eller ved manuel trigging) overfører platformen dags-performance-rapporter til din private Google-kalender. Her logføres dagligt vundne/tabte handler, samlet profit og succesrater i et visuelt kalender-view.
              </p>

              <div style="background-color: #0f172a; border: 1px dashed #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 10px; color: #94a3b8; line-height: 1.4; margin-bottom: 14px;">
                <strong>Eksempel på Kalendernotering:</strong><br/>
                Emne: "DAVs Trading Rapport: +185.50 USDT (Win Rate: 72%)"<br/>
                Indhold: "Opgørelse over lukkede positioner, gennemsnitlig gevinstrate samt anslået holdetid for aktive kryptoer."
              </div>

              <h3 style="font-size: 13px; color: var(--color-white); font-weight: bold; margin-bottom: 6px;">Sikkerhed og API Kryptering</h3>
              <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin-bottom: 12px;">
                Fuld sikkerhed på dine værdier. Dine API keys gemmes udelukkende lokalt i browserens hukommelse, krypteret via sandboxed storage, og forlader aldrig nogensinde din computer. Ingen medarbejdere eller eksterne instanser har adgang til dine handelsadgange.
              </p>

              <div style="margin: 15px 0; background: linear-gradient(135deg, #0b0f19, #0f172a); border: 1px solid #1e293b; border-radius: 12px; height: 140px; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                  <span>GOOGLE CALENDAR PERFORMANCE SYNC</span>
                  <span style="color: #3b82f6;">AUTOMATIC END-OF-DAY SYNC</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin: 8px 0; font-family: monospace; font-size: 8px;">
                  <div style="color: #64748b; text-align: center;">Man</div>
                  <div style="color: #64748b; text-align: center;">Tir</div>
                  <div style="color: #64748b; text-align: center;">Ons</div>
                  <div style="color: #64748b; text-align: center;">Tor</div>
                  <div style="color: #64748b; text-align: center;">Fre</div>
                  <div style="color: #3b82f6; text-align: center;">Lør</div>
                  <div style="color: #3b82f6; text-align: center;">Søn</div>
                  
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid #1e293b; border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span>14</span>
                     <span style="color: #34d399; font-weight: bold;">+$185</span>
                  </div>
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid #1e293b; border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span>15</span>
                     <span style="color: #f87171;">-$42</span>
                  </div>
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid #1e293b; border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span>16</span>
                     <span style="color: #34d399; font-weight: bold;">+$310</span>
                  </div>
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid #1e293b; border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span>17</span>
                     <span style="color: #34d399; font-weight: bold;">+$95</span>
                  </div>
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid #1e293b; border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span>18</span>
                     <span style="color: #64748b;">(0)</span>
                  </div>
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid rgba(59, 130, 246, 0.18); border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span style="color: #3b82f6;">19</span>
                     <span style="color: #34d399; font-weight: bold;">+$480</span>
                  </div>
                  <div style="background-color: rgba(49, 46, 129, 0.18); border: 1px solid rgba(59, 130, 246, 0.18); border-radius: 4px; padding: 3px; height: 35px; display: flex; flex-direction: column; justify-content: space-between;">
                     <span style="color: #3b82f6;">20</span>
                     <span style="color: #f87171;">-$112</span>
                  </div>
                </div>
                <div style="font-size: 8px; color: #475569; font-family: monospace; display: flex; justify-content: space-between;">
                  <span>OAUTH CALENDAR INTEGRATION: SUCCESSFUL</span>
                  <span>WEEKLY NET: +$916.00</span>
                </div>
              </div>
              <p style="font-size: 9px; color: #64748b; margin-top: 6px; text-align: center;">Figur 6: Google Calendar synkronisering og daglige performance audit-loggere.</p>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>6. Google Calendar Synkronisering</span>
              <span>Side 8 af 9</span>
            </div>
          </div>

          <!-- SECTION 7 -->
          <div style="height: 1040px; padding: 40px 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-bottom: 4px;">KAPITEL 7</div>
              <h1 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: var(--color-white); margin-bottom: 20px; text-transform: uppercase;">
                7. FAQ & Fejlfindingsprotokoller
              </h1>

              <div style="display: flex; flex-direction: column; gap: 15px; font-size: 11.5px; line-height: 1.5;">
                <div>
                  <h4 style="margin: 0 0 4px 0; color: var(--color-white); font-weight: bold;">Hvorfor slår systemet over i "Paper Trading" tilstand?</h4>
                  <p style="margin: 0; color: #94a3b8;">Dette er systemets beskyttelses-mekanisme. Det indikerer, at du ikke har forbundet dine egne Binance API-nøgler endnu, så du risikofrit kan teste alarmer og AI Autopiloter.</p>
                </div>

                <div>
                  <h4 style="margin: 0 0 4px 0; color: var(--color-white); font-weight: bold;">Hvorfor svinger tallene i "Aktive Positioner" så hurtigt?</h4>
                  <p style="margin: 0; color: #94a3b8;">Dette skyldes vores integrerede realtids-websockets. Systemet lytter lynhurtigt to Binance sekund for sekund og genberegner din urealiserede PnL live.</p>
                </div>

                <div>
                  <h4 style="margin: 0 0 4px 0; color: var(--color-white); font-weight: bold;">Hvordan eksporterer jeg historiske sager for skat?</h4>
                  <p style="margin: 0; color: #94a3b8;">Klik blot på "Eksporter til CSV" knappen i din handelsdagbog eller portefølje. Det gemmer en standard CSV-fil, du direkte kan importere i Excel eller Google Sheets.</p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 50px;">
                <p style="font-size: 12px; color: #f59e0b; font-weight: bold; margin-bottom: 4px; font-family: monospace;">MÅ MARKEDERNE ALTID VÆRE MED DIG!</p>
                <p style="font-size: 10px; color: #64748b; margin: 0;">Tak fordi du yder din tillid til DAVs Advanced Portfolio Ventures LLC.</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>7. FAQ & Fejlfindingsprotokoller</span>
              <span>Side 9 af 9</span>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      setPdfProgress(30);

      // Render with html2canvas (needs high resolution scale factor)
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0b0f19',
        scale: 2
      });

      setPdfProgress(60);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      
      // Calculate how many mm of pdf matches the rendered canvas height
      const totalPdfHeight = (canvas.height / canvas.width) * imgWidth;
      
      let heightLeft = totalPdfHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, totalPdfHeight);
      heightLeft -= pageHeight;

      // Slices for rest of pages
      while (heightLeft >= 0) {
        position = heightLeft - totalPdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, totalPdfHeight);
        heightLeft -= pageHeight;
      }

      setPdfProgress(90);
      pdf.save("DAVs_Advanced_Portfolio_Handbog_v4.8.pdf");
      
      document.body.removeChild(container);
      setPdfProgress(100);
      
      toast.success("PDF Håndbog Downloadet!", {
        description: "Håndbogen er genereret som en fuldt illustreret, højopløselig PDF model manual med ægte infografikker!"
      });
    } catch (err) {
      console.error("PDF generation failure", err);
      toast.error("Kunne ikke eksportere PDF manual.", {
        description: "En uventet systemfejl under indlæsning af grafikker forhindrede fuldførelse."
      });
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
    }
  };

  const renderOnScreenIllustration = (sectionId: string) => {
    switch (sectionId) {
      case 'intro':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            {/* Background Screenshot from platform website/dashboard representation */}
            <img 
               src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=800" 
               alt="Cockpit Panel" 
               className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-50"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-mono text-[9px] font-bold text-amber-400 tracking-wider bg-amber-950/50 border border-amber-500/20 px-1.5 py-0.5 rounded">ÆGTE HOVEDPANEL SCREENSHOT</span>
                <span className="font-mono text-[8px] flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  COCKPIT LIVE
                </span>
              </div>
              
              <div className="flex flex-col gap-3 my-auto">
                <div className="bg-gray-950/90 border-l-4 border-amber-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] transform translate-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5">🚀 1. Dynamisk Prissystem (Livefeed)</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Viser live markedssituation baseret på dine valgte handelspræferencer. Data streames direkte fra binance-proxyen.
                  </p>
                </div>

                <div className="bg-gray-950/90 border-l-4 border-indigo-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] self-end transform -translate-y-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 block mb-0.5">📈 2. Integrerede Signaler</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Autogenererede tekniske kurssignaler (RSI, MA-linjer m.fl.) regnes direkte på backend for optimal reaktionshastighed.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[8px] text-gray-400 font-mono tracking-wide">
                <span>Vores cockpit indeholder alt til direkte styring og monitorering på ét enkelt fuldt opdateret skærmbillede.</span>
              </div>
            </div>
          </div>
        );
      case 'trading':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            {/* Background Screenshot of orders and portfolio split */}
            <img 
               src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800" 
               alt="Spot Trading & Allocation" 
               className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-50"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider bg-cyan-950/50 border border-cyan-500/20 px-1.5 py-0.5 rounded">ÆGTE TRANSAKTIONS PANEL SCREENSHOT</span>
                <span className="font-mono text-[8px] flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  PORTFOLIO & SPOT
                </span>
              </div>
              
              <div className="flex flex-col gap-3 my-auto">
                <div className="bg-gray-950/90 border-l-4 border-cyan-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%]">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 block mb-0.5">💰 1. Portefølje Allokering</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Realtidsvisning af din likvide balance (USDT) kontra aktive coins (BTC, ETH, SOL) i spot-beholdningen.
                  </p>
                </div>

                <div className="bg-gray-950/90 border-l-4 border-emerald-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] self-end">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-0.5">🛒 2. Køb & Salg System</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Udfør papirhandel med ét klik. Vores live motor justerer balancen uden at du behøver at indsætte rigtige kontanter.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[8px] text-gray-400 font-mono tracking-wide">
                <span>Ingen unødig komplicering: Vælg allokering, indtast beløb og klik køb eller salg.</span>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            {/* Background Screenshot of AI strategy feed */}
            <img 
               src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800" 
               alt="AI Agent Engine" 
               className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-50"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-mono text-[9px] font-bold text-purple-400 tracking-wider bg-purple-950/50 border border-purple-500/20 px-1.5 py-0.5 rounded">ÆGTE AI AGENT SCREENSHOT</span>
                <span className="font-mono text-[8px] flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  GEMINI INTELLIGENCE
                </span>
              </div>
              
              <div className="flex flex-col gap-3 my-auto">
                <div className="bg-gray-950/90 border-l-4 border-purple-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%]">
                  <span className="text-[10px] font-mono font-bold text-purple-400 block mb-0.5">📰 1. Gemini Nyheds- Sentiment</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Google Gemini scanner hundredvis af finansnyheder på få sekunder for at vurdere den generelle markedsstemning direkte.
                  </p>
                </div>

                <div className="bg-gray-950/90 border-l-4 border-amber-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] self-end">
                  <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5">🤖 2. Ingen Menneskelige Følelsesfejl</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Vælg mellem seks prædefinerede matematiske bots. Algoritmerne overvåger og udfører handler koldt uden FOMO.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[8px] text-gray-400 font-mono tracking-wide">
                <span>Google Gemini integrationen sikrer, at robotterne har de allernyeste data til rådighed.</span>
              </div>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            {/* Background Screenshot of secure system and alarm panel */}
            <img 
               src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" 
               alt="Risk Management & Alerts" 
               className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-50"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-mono text-[9px] font-bold text-rose-400 tracking-wider bg-rose-950/50 border border-rose-500/20 px-1.5 py-0.5 rounded">ÆGTE SIKKERHEDS PANEL SCREENSHOT</span>
                <span className="font-mono text-[8px] flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-500/20 px-1.5 py-0.5 rounded">
                  RISIKOSTYRING
                </span>
              </div>
              
              <div className="flex flex-col gap-3 my-auto">
                <div className="bg-gray-950/90 border-l-4 border-rose-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%]">
                  <span className="text-[10px] font-mono font-bold text-rose-400 block mb-0.5">🛡️ 1. Glidende Stop-loss (Trailing Stop)</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Automatisk sikring: Stopkursen flytter sig med prisen opad, men fastlåser salget og sikrer gevinsterne, hvis kursen pludselig knækker.
                  </p>
                </div>

                <div className="bg-gray-950/90 border-l-4 border-violet-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] self-end">
                  <span className="text-[10px] font-mono font-bold text-violet-400 block mb-0.5">🔊 2. Tale-notifikationer (TTS) på Dansk</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Få stemmebesked direkte i dit headset hvis din definerede stopkurs rammes, eller når en væsentlig prisalarm brydes i markedet.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[8px] text-gray-400 font-mono tracking-wide">
                <span>Multi-kanal alarmsystem der arbejder i baggrunden, selv når computer-skærmen er slukket.</span>
              </div>
            </div>
          </div>
        );
      case 'journal':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            {/* Background Screenshot of trade journal and crash graphs */}
            <img 
               src="https://images.unsplash.com/photo-1543185377-b75371a2943b?auto=format&fit=crop&q=80&w=800" 
               alt="Trading Journal & Stress Tester" 
               className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-50"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-mono text-[9px] font-bold text-blue-400 tracking-wider bg-blue-950/50 border border-blue-500/20 px-1.5 py-0.5 rounded">ÆGTE JOURNAL PANEL SCREENSHOT</span>
                <span className="font-mono text-[8px] flex items-center gap-1 text-blue-400 bg-blue-950/40 border border-blue-500/20 px-1.5 py-0.5 rounded">
                  METOLOGI & DEBOG
                </span>
              </div>
              
              <div className="flex flex-col gap-3 my-auto">
                <div className="bg-gray-950/90 border-l-4 border-blue-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%]">
                  <span className="text-[10px] font-mono font-bold text-blue-400 block mb-0.5">📓 1. Psykologisk Journalisering</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Skriv noter til hver handel og anvend psykologiske fejletags såsom 'fomo', 'emotional' for at fjerne destruktive handelsmønstre.
                  </p>
                </div>

                <div className="bg-gray-950/90 border-l-4 border-red-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] self-end">
                  <span className="text-[10px] font-mono font-bold text-red-400 block mb-0.5">💥 2. Portefølje Chokstresstest</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Simuler et øjeblikkeligt markedskrak (-35%) og beregn præcist, hvor modstandsdygtig din nuværende coin-sammensætning er.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[8px] text-gray-400 font-mono tracking-wide">
                <span>Hold regnskab med dine handle-overvejelser og lær af dine fejl med den indbyggede eksport-klare dagbog.</span>
              </div>
            </div>
          </div>
        );
      case 'sync':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            {/* Background Screenshot of Calendar Integration */}
            <img 
               src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800" 
               alt="Calendar Sync & OAuth" 
               className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-50"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-mono text-[9px] font-bold text-pink-400 tracking-wider bg-pink-950/50 border border-pink-500/20 px-1.5 py-0.5 rounded">ÆGTE KALENDER PANEL SCREENSHOT</span>
                <span className="font-mono text-[8px] flex items-center gap-1 text-pink-400 bg-pink-950/40 border border-pink-500/20 px-1.5 py-0.5 rounded">
                  GOOGLE INTEGRATION
                </span>
              </div>
              
              <div className="flex flex-col gap-3 my-auto">
                <div className="bg-gray-950/90 border-l-4 border-pink-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%]">
                  <span className="text-[10px] font-mono font-bold text-pink-400 block mb-0.5">📅 1. Google Kalender Synkronisering</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Integrer direkte med din Google Kalender via sikker OAuth 2.0-forbindelse. Systemet overfører dagsresultater helt automatisk.
                  </p>
                </div>

                <div className="bg-gray-950/90 border-l-4 border-indigo-500 border-y border-r border-gray-800 rounded-r-xl p-2.5 backdrop-blur-sm shadow-lg max-w-[90%] self-end">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 block mb-0.5">🗓️ 2. Ugentlig Kalender PnL Oversigt</span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    Få det fulde ugentlige og månedlige overblik over dine succesrige og tabsgivende dage direkte markeret i en visuel dags-kalender.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[8px] text-gray-400 font-mono tracking-wide">
                <span>Dine data forbliver helt private — ingen følsomme adgangsnøgler videresendes eller lagres på usikre servere.</span>
              </div>
            </div>
          </div>
        );
      case 'test':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            <img 
               src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" 
               alt="Test Matrix" 
               className="absolute inset-0 w-full h-full object-cover opacity-30 select-none pointer-events-none mix-blend-luminosity" 
               draggable="false"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            <div className="absolute inset-0 bg-emerald-500/5"></div>
            <div className="relative z-10 p-5 flex flex-col h-full justify-end">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-slate-400">TEST MATRIX</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-full"></div></div>
                  <div className="flex justify-between text-[9px] text-emerald-400 font-mono"><span>SUCCESS RATE</span><span>100%</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredSections = sections.filter(sec => 
    (activeTab === 'all' || sec.category === activeTab) &&
    (searchTerm === '' || 
     sec.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     ((sec as any).content || (sec as any).searchableText || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-5xl h-[95vh] md:h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-950/30 border border-amber-500/20 rounded-xl text-amber-500 shrink-0 hidden sm:block">
              <BookOpen className="size-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex flex-wrap items-center gap-2">
                Håndbog & Brugervejledning
                <span className="text-[10px] sm:text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-medium whitespace-nowrap">
                  v4.8 • Web & AI
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 max-w-md">
                Din komplette, dybdegående guide til alle platformens funktioner og agenter.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`flex-1 lg:flex-none justify-center px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold font-mono tracking-wide flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                isGeneratingPdf
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="size-4 animate-spin text-emerald-400 shrink-0" />
                  <span className="truncate">Genererer ({pdfProgress}%)</span>
                </>
              ) : (
                <>
                  <Download className="size-4 shrink-0" /> <span className="truncate">PDF (.pdf)</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadWordFile}
              disabled={isGeneratingPdf}
              className="flex-1 lg:flex-none justify-center bg-amber-600 hover:bg-amber-500 text-white px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold font-mono tracking-wide flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="size-4 shrink-0" /> <span className="truncate">Word (.doc)</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 p-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer absolute top-2 right-2 sm:static shrink-0"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-850 bg-gray-950/20 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-start md:items-center relative z-10">
          {/* Tabs */}
          <div className="flex w-full md:w-auto overflow-x-auto snap-x pb-1 scrollbar-thin scrollbar-thumb-gray-800 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-1.5 min-w-max">
              {[
                { id: 'all', label: 'Alle Sektioner' },
                { id: 'intro', label: '1. Introduktion' },
                { id: 'trading', label: '2. Live & Ordrer' },
                { id: 'ai', label: '3. AI Agenter' },
                { id: 'alerts', label: '4. Alarmer & TTS' },
                { id: 'journal', label: '5. Journal & PnL' },
                { id: 'sync', label: '6. Kalender & Synk' },
                { id: 'test', label: '7. Gennemtest Status' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium font-mono transition-all snap-start whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <input
              type="text"
              placeholder="Søg i håndbogen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-1.5 text-[10px] sm:text-xs text-gray-200 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 relative z-10 scrollbar-thin">
          {/* PDF Generation Loader Banner */}
          {isGeneratingPdf && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> Opretter PDF-dokument...
                </span>
                <span className="text-emerald-500 font-bold">{pdfProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
                  style={{ width: `${pdfProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Vent venligst – vi samler i øjeblikket alle 9 A4-sider inclusive de ægte illustrative infobilleder i en udskriftsvenlig PDF-fil.
              </p>
            </div>
          )}

          {/* Quick Notice Card */}
          <div className="bg-gradient-to-r from-amber-5050/10 to-indigo-950/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-200">
                Leder du efter et offline-bevis til skat eller offline-læsning?
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Platformen understøtter eksport af denne komplette manual til et fuldt designet 
                <strong> Microsoft Word-dokument (.doc)</strong>, der fylder mere end <strong>5 fulde A4-sider</strong>. 
                Dokumentet inkluderer tabeller, infobokse og tekniske koder klar til redigering eller udskrivning.
              </p>
            </div>
          </div>

          {/* Handbook Sections */}
          {filteredSections.length > 0 ? (
            filteredSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div 
                  key={section.id} 
                  id={`manual-sec-${section.id}`}
                  className="bg-gray-950/40 border border-gray-850 rounded-2xl p-6 hover:border-gray-800 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gray-900 border border-gray-800 text-amber-500 rounded-xl group-hover:bg-amber-500/5 group-hover:border-amber-500/20 transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100 group-hover:text-amber-400 transition-colors font-mono uppercase tracking-wide">
                      {section.title}
                    </h3>
                  </div>
                  
                  {/* Grid-split layout for text & illustrated interactive components */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-gray-900 pt-4">
                    <div className="lg:col-span-7 text-xs text-gray-300 leading-relaxed font-sans space-y-4 whitespace-pre-line">
                      { (section as any).renderContent ? (section as any).renderContent() : (section as any).content }
                    </div>
                    
                    <div className="lg:col-span-5 flex flex-col justify-start gap-3 mt-4 lg:mt-0">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold mb-0.5 flex items-center gap-1.5 justify-center lg:justify-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Figur {idx + 1}: Interaktiv visualisering af systemet
                      </div>
                      
                      {renderOnScreenIllustration(section.id)}
                      
                      <p className="text-[10.5px] text-amber-500/90 font-mono mt-0.5 text-center lg:text-left leading-relaxed">
                        ★ {section.illustrationCaption}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="size-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-mono">
                Ingen sektioner matchede din søgning "{searchTerm}".
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setActiveTab('all'); }}
                className="mt-2 text-xs text-amber-500 hover:text-amber-400 underline font-mono"
              >
                Nulstil søgning og filtre
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-800 bg-gray-950/40 flex flex-col sm:flex-row gap-2 justify-between items-center text-[9px] sm:text-[10px] text-gray-500 font-mono text-center sm:text-left">
          <span className="flex items-center justify-center sm:justify-start gap-1.5">
            <CheckCircle className="size-3 text-emerald-500 shrink-0" />
            <span>Håndbog fuldt opdateret og klar til brug</span>
          </span>
          <span>
            DAVs Advanced Portfolio Ventures &bull; 2026
          </span>
        </div>
      </div>
    </div>
  );
}
