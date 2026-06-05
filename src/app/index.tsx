import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';

const APP_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const TRANSLATIONS = {
  en: {
    title: 'Card Vendor App', singles: '🔍 Singles', sealed: '📦 Sealed', barter: '🤝 Barter',
    searchPlaceholder: 'Search card name...', search: 'Search', back: '← Back to results',
    backTrade: '← Back to trade', confirmVariant: '⚠ Confirm Print Variant',
    variantSubtitle: 'Price varies significantly by variant', rawCard: 'Raw Card', gradedCard: 'Graded Card',
    gradingCompany: 'Grading Company', grade: 'Grade', certNumber: 'Cert Number (optional)',
    certPlaceholder: 'Enter cert number...', lookup: 'Lookup', condition: 'Condition',
    marketPrice: 'Market Price', yourPrice: 'Your Price', priceSources: 'Price Sources',
    currencyConverter: 'Currency Converter', sealedLookup: 'Sealed Product Lookup',
    sealedPlaceholder: 'Search product name...', scanBarcode: '📷 Scan Barcode',
    barcodeNote: 'Available on mobile device', sealedCondition: 'Sealed Condition',
    addingTo: 'Adding to:', yourDeck: 'YOUR DECK', theirDeck: 'THEIR DECK',
    addCard: '+ Add Card', total: 'Total:', cleanTrade: '✅ Clean Trade',
    theyAdd: 'They add', youAdd: 'You add', cash: 'cash', clearTrade: '🗑 Clear Trade',
    noPrice: 'No price data available', phase2Note: '⚠ Full pricing for this language coming in Phase 2.',
    appLanguage: 'App Language', cardLanguage: 'Card Language', pointCamera: 'Point at card to identify',
    closeCamera: '✕ Close Camera', scanCard: '📷 Scan Card', listening: 'Listening...',
    variantConfirmed: '✓ Variant confirmed', premiumVariant: '⚠ Premium variant — verify carefully before pricing',
  },
  fr: {
    title: 'App Vendeur Cartes', singles: '🔍 Singles', sealed: '📦 Scellé', barter: '🤝 Échange',
    searchPlaceholder: 'Rechercher une carte...', search: 'Chercher', back: '← Retour aux résultats',
    backTrade: '← Retour à l\'échange', confirmVariant: '⚠ Confirmer la variante',
    variantSubtitle: 'Le prix varie selon la variante', rawCard: 'Carte brute', gradedCard: 'Carte gradée',
    gradingCompany: 'Société de notation', grade: 'Grade', certNumber: 'Numéro de certificat (optionnel)',
    certPlaceholder: 'Entrer le numéro...', lookup: 'Rechercher', condition: 'État',
    marketPrice: 'Prix du marché', yourPrice: 'Votre prix', priceSources: 'Sources de prix',
    currencyConverter: 'Convertisseur de devises', sealedLookup: 'Recherche produit scellé',
    sealedPlaceholder: 'Rechercher un produit...', scanBarcode: '📷 Scanner le code-barres',
    barcodeNote: 'Disponible sur mobile', sealedCondition: 'État du scellé',
    addingTo: 'Ajout à :', yourDeck: 'VOTRE DECK', theirDeck: 'LEUR DECK',
    addCard: '+ Ajouter carte', total: 'Total :', cleanTrade: '✅ Échange équilibré',
    theyAdd: 'Ils ajoutent', youAdd: 'Vous ajoutez', cash: 'en espèces', clearTrade: '🗑 Effacer l\'échange',
    noPrice: 'Aucune donnée de prix', phase2Note: '⚠ Prix complets pour cette langue en Phase 2.',
    appLanguage: 'Langue de l\'app', cardLanguage: 'Langue de la carte', pointCamera: 'Pointez vers la carte',
    closeCamera: '✕ Fermer la caméra', scanCard: '📷 Scanner la carte', listening: 'En écoute...',
    variantConfirmed: '✓ Variante confirmée', premiumVariant: '⚠ Variante premium — vérifiez avant de tarifer',
  },
  ja: {
    title: 'カード販売アプリ', singles: '🔍 シングル', sealed: '📦 未開封', barter: '🤝 トレード',
    searchPlaceholder: 'カード名を検索...', search: '検索', back: '← 結果に戻る',
    backTrade: '← トレードに戻る', confirmVariant: '⚠ バリアントを確認',
    variantSubtitle: 'バリアントによって価格が異なります', rawCard: '生カード', gradedCard: 'グレードカード',
    gradingCompany: 'グレード会社', grade: 'グレード', certNumber: '認証番号（任意）',
    certPlaceholder: '番号を入力...', lookup: '検索', condition: 'コンディション',
    marketPrice: '市場価格', yourPrice: 'あなたの価格', priceSources: '価格ソース',
    currencyConverter: '通貨換算', sealedLookup: '未開封品検索',
    sealedPlaceholder: '商品名を検索...', scanBarcode: '📷 バーコードスキャン',
    barcodeNote: 'モバイルで利用可能', sealedCondition: '未開封状態',
    addingTo: '追加先：', yourDeck: 'あなたのデッキ', theirDeck: '相手のデッキ',
    addCard: '+ カードを追加', total: '合計：', cleanTrade: '✅ 均等トレード',
    theyAdd: '相手が追加', youAdd: 'あなたが追加', cash: '現金', clearTrade: '🗑 トレードをクリア',
    noPrice: '価格データなし', phase2Note: '⚠ この言語の完全な価格はフェーズ2で。',
    appLanguage: 'アプリ言語', cardLanguage: 'カード言語', pointCamera: 'カードに向けてください',
    closeCamera: '✕ カメラを閉じる', scanCard: '📷 カードをスキャン', listening: '聞いています...',
    variantConfirmed: '✓ バリアント確認済み', premiumVariant: '⚠ プレミアムバリアント — 価格設定前に確認',
  },
  es: {
    title: 'App Vendedor Cartas', singles: '🔍 Singles', sealed: '📦 Sellado', barter: '🤝 Intercambio',
    searchPlaceholder: 'Buscar carta...', search: 'Buscar', back: '← Volver a resultados',
    backTrade: '← Volver al intercambio', confirmVariant: '⚠ Confirmar variante',
    variantSubtitle: 'El precio varía según la variante', rawCard: 'Carta sin graduar', gradedCard: 'Carta graduada',
    gradingCompany: 'Empresa de graduación', grade: 'Grado', certNumber: 'Número de certificado (opcional)',
    certPlaceholder: 'Ingresar número...', lookup: 'Buscar', condition: 'Condición',
    marketPrice: 'Precio de mercado', yourPrice: 'Tu precio', priceSources: 'Fuentes de precio',
    currencyConverter: 'Conversor de divisas', sealedLookup: 'Búsqueda producto sellado',
    sealedPlaceholder: 'Buscar producto...', scanBarcode: '📷 Escanear código de barras',
    barcodeNote: 'Disponible en móvil', sealedCondition: 'Condición sellado',
    addingTo: 'Añadiendo a:', yourDeck: 'TU MAZO', theirDeck: 'SU MAZO',
    addCard: '+ Añadir carta', total: 'Total:', cleanTrade: '✅ Intercambio equilibrado',
    theyAdd: 'Ellos añaden', youAdd: 'Tú añades', cash: 'en efectivo', clearTrade: '🗑 Limpiar intercambio',
    noPrice: 'Sin datos de precio', phase2Note: '⚠ Precios completos para este idioma en Fase 2.',
    appLanguage: 'Idioma de la app', cardLanguage: 'Idioma de la carta', pointCamera: 'Apunta hacia la carta',
    closeCamera: '✕ Cerrar cámara', scanCard: '📷 Escanear carta', listening: 'Escuchando...',
    variantConfirmed: '✓ Variante confirmada', premiumVariant: '⚠ Variante premium — verifica antes de fijar precio',
  },
  de: {
    title: 'Karten Händler App', singles: '🔍 Singles', sealed: '📦 Versiegelt', barter: '🤝 Tausch',
    searchPlaceholder: 'Kartenname suchen...', search: 'Suchen', back: '← Zurück zu Ergebnissen',
    backTrade: '← Zurück zum Tausch', confirmVariant: '⚠ Variante bestätigen',
    variantSubtitle: 'Preis variiert je nach Variante', rawCard: 'Rohe Karte', gradedCard: 'Bewertete Karte',
    gradingCompany: 'Bewertungsunternehmen', grade: 'Bewertung', certNumber: 'Zertifikatsnummer (optional)',
    certPlaceholder: 'Nummer eingeben...', lookup: 'Suchen', condition: 'Zustand',
    marketPrice: 'Marktpreis', yourPrice: 'Ihr Preis', priceSources: 'Preisquellen',
    currencyConverter: 'Währungsrechner', sealedLookup: 'Versiegeltes Produkt suchen',
    sealedPlaceholder: 'Produkt suchen...', scanBarcode: '📷 Barcode scannen',
    barcodeNote: 'Auf Mobilgerät verfügbar', sealedCondition: 'Versiegelter Zustand',
    addingTo: 'Hinzufügen zu:', yourDeck: 'IHR DECK', theirDeck: 'DEREN DECK',
    addCard: '+ Karte hinzufügen', total: 'Gesamt:', cleanTrade: '✅ Ausgeglichener Tausch',
    theyAdd: 'Sie fügen hinzu', youAdd: 'Sie fügen hinzu', cash: 'in bar', clearTrade: '🗑 Tausch löschen',
    noPrice: 'Keine Preisdaten', phase2Note: '⚠ Vollständige Preise für diese Sprache in Phase 2.',
    appLanguage: 'App-Sprache', cardLanguage: 'Kartensprache', pointCamera: 'Auf Karte richten',
    closeCamera: '✕ Kamera schließen', scanCard: '📷 Karte scannen', listening: 'Höre zu...',
    variantConfirmed: '✓ Variante bestätigt', premiumVariant: '⚠ Premium-Variante — vor Preisgestaltung prüfen',
  },
};

const CONDITIONS = [
  { label: 'Poor', multiplier: 0.1 },
  { label: 'HP', multiplier: 0.25 },
  { label: 'MP', multiplier: 0.45 },
  { label: 'LP', multiplier: 0.65 },
  { label: 'GD', multiplier: 0.8 },
  { label: 'NM', multiplier: 0.9 },
  { label: 'Mint', multiplier: 1.0 },
];

const CONDITION_COLORS = ['#e63946', '#e63946', '#f4a261', '#f4a261', '#a8c686', '#4caf50', '#2e7d32'];

const CARD_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh-hant', label: 'Chinese (T)', flag: '🇹🇼' },
  { code: 'zh-hans', label: 'Chinese (S)', flag: '🇨🇳' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪' },
];

const GRADERS = ['PSA', 'BGS', 'CGC', 'Other'];
const PSA_GRADES = ['1', '1.5', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const BGS_GRADES = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];
const CGC_GRADES = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];

const SEALED_CONDITIONS = [
  { label: 'Sealed (Mint)', multiplier: 1.0 },
  { label: 'Sealed (Damaged)', multiplier: 0.7 },
  { label: 'Open', multiplier: 0.4 },
];

const VARIANTS = [
  { key: '1st_edition', label: '1st Edition', premium: true },
  { key: 'shadowless', label: 'Shadowless', premium: true },
  { key: 'unlimited', label: 'Unlimited', premium: false },
  { key: 'reverse_holo', label: 'Reverse Holo', premium: false },
  { key: 'holo_rare', label: 'Holo Rare', premium: false },
  { key: 'special_illustration', label: 'Special Illus. Rare', premium: true },
  { key: 'promo', label: 'Promo', premium: false },
];

const SCREENS = { SEARCH: 'search', CARD: 'card', SEALED: 'sealed', BARTER: 'barter', BARTER_SEARCH: 'barter_search', SETTINGS: 'settings' };

export default function Index() {
  const [screen, setScreen] = useState(SCREENS.SEARCH);
  const [appLang, setAppLang] = useState('en');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [anchorSource, setAnchorSource] = useState('tcgplayer');
  const [conditionIndex, setConditionIndex] = useState(5);
  const [percentage, setPercentage] = useState(80);
  const [listening, setListening] = useState(false);
  const [cardLanguage, setCardLanguage] = useState('en');
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [selectedGrader, setSelectedGrader] = useState('PSA');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [certNumber, setCertNumber] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState(null);
  const [sealedQuery, setSealedQuery] = useState('');
  const [sealedProduct, setSealedProduct] = useState(null);
  const [sealedConditionIndex, setSealedConditionIndex] = useState(0);
  const [sealedLoading, setSealedLoading] = useState(false);
  const [myDeck, setMyDeck] = useState([]);
  const [theirDeck, setTheirDeck] = useState([]);
  const [barterTarget, setBarterTarget] = useState('my');
  const [barterQuery, setBarterQuery] = useState('');
  const [barterResults, setBarterResults] = useState([]);
  const [barterLoading, setBarterLoading] = useState(false);
  const [barterConditionIndex, setBarterConditionIndex] = useState(5);
  const [myPercentage, setMyPercentage] = useState(80);
  const [theirPercentage, setTheirPercentage] = useState(80);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedVariant, setSelectedVariant] = useState(null);

  const t = TRANSLATIONS[appLang];

  useEffect(() => {
    loadPercentage();
    fetchExchangeRates();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const lang = await AsyncStorage.getItem('app_language');
      if (lang) setAppLang(lang);
      const cardLang = await AsyncStorage.getItem('card_language');
      if (cardLang) setCardLanguage(cardLang);
    } catch (e) {}
  };

  const saveAppLang = async (lang) => {
    setAppLang(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const saveCardLanguage = async (lang) => {
    setCardLanguage(lang);
    await AsyncStorage.setItem('card_language', lang);
  };

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results[0]) setQuery(event.results[0].transcript);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    searchCards();
  });

  const startListening = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) { alert('Microphone permission required.'); return; }
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false });
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) { alert('Camera permission required.'); return; }
    }
    setCameraOpen(true);
  };

  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data.rates) setExchangeRates(data.rates);
    } catch (error) { console.error('Failed to fetch exchange rates', error); }
    setRatesLoading(false);
  };

  const convertPrice = (usdPrice, currencyCode) => {
    if (!usdPrice || !exchangeRates[currencyCode]) return null;
    return usdPrice * exchangeRates[currencyCode];
  };

  const loadPercentage = async () => {
    try {
      const value = await AsyncStorage.getItem('vendor_percentage');
      if (value !== null) setPercentage(Number(value));
    } catch (error) { console.log('No saved percentage'); }
  };

  const savePercentage = async (newPercentage) => {
    setPercentage(newPercentage);
    await AsyncStorage.setItem('vendor_percentage', String(newPercentage));
  };

  const fetchAllCards = async (searchQuery) => {
    let allCards = [];
    let page = 1;
    let totalCount = 0;
    do {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(searchQuery)}*&pageSize=250&page=${page}&orderBy=name`
      );
      const data = await response.json();
      totalCount = data.totalCount || 0;
      allCards = [...allCards, ...(data.data || [])];
      page++;
    } while (allCards.length < totalCount && page <= 20);
    return allCards;
  };

  const searchCards = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedCard(null);
    try {
      const allCards = await fetchAllCards(query);
      setResults(allCards);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const searchBarterCards = async () => {
    if (!barterQuery.trim()) return;
    setBarterLoading(true);
    try {
      const allCards = await fetchAllCards(barterQuery);
      setBarterResults(allCards);
    } catch (error) { console.error(error); }
    setBarterLoading(false);
  };

  const getCardPrice = (card) => {
    if (!card.tcgplayer || !card.tcgplayer.prices) return 0;
    const prices = card.tcgplayer.prices;
    if (prices.holofoil) return prices.holofoil.market || 0;
    if (prices.normal) return prices.normal.market || 0;
    if (prices.reverseHolofoil) return prices.reverseHolofoil.market || 0;
    return 0;
  };

  const addToDeck = (card) => {
    const price = getCardPrice(card);
    const condMult = CONDITIONS[barterConditionIndex].multiplier;
    const pct = barterTarget === 'my' ? myPercentage : theirPercentage;
    const entry = {
      id: `${card.id}_${Date.now()}`,
      card,
      conditionIndex: barterConditionIndex,
      condition: CONDITIONS[barterConditionIndex].label,
      price,
      vendorPrice: price * (pct / 100) * condMult,
    };
    if (barterTarget === 'my') setMyDeck(prev => [...prev, entry]);
    else setTheirDeck(prev => [...prev, entry]);
    setScreen(SCREENS.BARTER);
    setBarterQuery('');
    setBarterResults([]);
  };

  const removeFromDeck = (deck, id) => {
    if (deck === 'my') setMyDeck(prev => prev.filter(e => e.id !== id));
    else setTheirDeck(prev => prev.filter(e => e.id !== id));
  };

  const getDeckTotal = (deck) => deck.reduce((sum, e) => sum + e.vendorPrice, 0);
  const myTotal = getDeckTotal(myDeck);
  const theirTotal = getDeckTotal(theirDeck);
  const delta = myTotal - theirTotal;

  const selectCard = (card) => {
    setSelectedCard(card);
    setAnchorSource('tcgplayer');
    setConditionIndex(5);
    setIsGraded(false);
    setCertNumber('');
    setCertResult(null);
    setSelectedVariant(null);
    setScreen(SCREENS.CARD);
  };

  const lookupCert = async () => {
    if (!certNumber.trim()) return;
    setCertLoading(true);
    setCertResult(null);
    await new Promise(r => setTimeout(r, 800));
    setCertResult({ message: `${selectedGrader} cert lookup requires API agreement. Grade ${selectedGrade} recorded manually.` });
    setCertLoading(false);
  };

  const getGrades = () => {
    if (selectedGrader === 'PSA') return PSA_GRADES;
    if (selectedGrader === 'BGS') return BGS_GRADES;
    return CGC_GRADES;
  };

  const getPrice = (card, source) => {
    if (source === 'tcgplayer') {
      if (!card.tcgplayer || !card.tcgplayer.prices) return null;
      const prices = card.tcgplayer.prices;
      if (prices.holofoil) return prices.holofoil.market;
      if (prices.normal) return prices.normal.market;
      if (prices.reverseHolofoil) return prices.reverseHolofoil.market;
      return null;
    }
    return null;
  };

  const getAnchorPrice = () => getPrice(selectedCard, anchorSource);
  const conditionMultiplier = isGraded ? 1.0 : CONDITIONS[conditionIndex].multiplier;
  const anchorPrice = selectedCard ? getAnchorPrice() : null;
  const vendorPrice = anchorPrice ? anchorPrice * (percentage / 100) * conditionMultiplier : null;
  const isPhase2Language = !['en', 'ja'].includes(cardLanguage);

  const sourceLabel = {
    tcgplayer: 'TCGPlayer', pricecharting: 'PriceCharting',
    ebay_sold: 'eBay Sold', ebay_30day: 'eBay 30-Day',
    yahoo_japan: 'Yahoo Japan', mercari_japan: 'Mercari JP',
  };

  const availableSources = cardLanguage === 'ja'
    ? ['yahoo_japan', 'mercari_japan', 'pricecharting']
    : ['tcgplayer', 'pricecharting', 'ebay_sold', 'ebay_30day'];

  const formatCurrency = (amount, code) => {
    if (amount === null) return 'N/A';
    if (code === 'JPY' || code === 'KRW') return `${CURRENCIES.find(c => c.code === code)?.symbol}${Math.round(amount).toLocaleString()}`;
    return `${CURRENCIES.find(c => c.code === code)?.symbol}${amount.toFixed(2)}`;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={[styles.tab, (screen === SCREENS.SEARCH || screen === SCREENS.CARD) && styles.tabActive]} onPress={() => setScreen(SCREENS.SEARCH)}>
        <Text style={[styles.tabText, (screen === SCREENS.SEARCH || screen === SCREENS.CARD) && styles.tabTextActive]}>{t.singles}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, screen === SCREENS.SEALED && styles.tabActive]} onPress={() => setScreen(SCREENS.SEALED)}>
        <Text style={[styles.tabText, screen === SCREENS.SEALED && styles.tabTextActive]}>{t.sealed}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, (screen === SCREENS.BARTER || screen === SCREENS.BARTER_SEARCH) && styles.tabActive]} onPress={() => setScreen(SCREENS.BARTER)}>
        <Text style={[styles.tabText, (screen === SCREENS.BARTER || screen === SCREENS.BARTER_SEARCH) && styles.tabTextActive]}>{t.barter}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, screen === SCREENS.SETTINGS && styles.tabActive]} onPress={() => setScreen(SCREENS.SETTINGS)}>
        <Text style={[styles.tabText, screen === SCREENS.SETTINGS && styles.tabTextActive]}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );

  if (screen === SCREENS.SETTINGS) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t.title}</Text>
        {renderTabBar()}
        <ScrollView>
          <Text style={styles.sectionTitle}>{t.appLanguage}</Text>
          <View style={styles.settingsLangGrid}>
            {APP_LANGUAGES.map((lang) => (
              <TouchableOpacity key={lang.code} style={[styles.settingsLangButton, appLang === lang.code && styles.settingsLangButtonActive]} onPress={() => saveAppLang(lang.code)}>
                <Text style={styles.settingsLangFlag}>{lang.flag}</Text>
                <Text style={[styles.settingsLangLabel, appLang === lang.code && styles.settingsLangLabelActive]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionTitle}>{t.cardLanguage}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.languageRow}>
              {CARD_LANGUAGES.map((lang) => (
                <TouchableOpacity key={lang.code} style={[styles.langButton, cardLanguage === lang.code && styles.langButtonActive]} onPress={() => saveCardLanguage(lang.code)}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langLabel, cardLanguage === lang.code && styles.langLabelActive]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {isPhase2Language && <Text style={styles.phase2Note}>{t.phase2Note}</Text>}
        </ScrollView>
      </View>
    );
  }

  if (screen === SCREENS.BARTER_SEARCH) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t.title}</Text>
        {renderTabBar()}
        <TouchableOpacity onPress={() => setScreen(SCREENS.BARTER)}>
          <Text style={styles.back}>{t.backTrade}</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>{t.addingTo} {barterTarget === 'my' ? t.yourDeck : t.theirDeck}</Text>
        <Text style={styles.conditionTitle}>{t.condition}</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((c, i) => (
            <TouchableOpacity key={c.label} style={[styles.conditionButton, { backgroundColor: barterConditionIndex === i ? CONDITION_COLORS[i] : '#eee' }]} onPress={() => setBarterConditionIndex(i)}>
              <Text style={[styles.conditionText, { color: barterConditionIndex === i ? '#fff' : '#666' }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchRow}>
          <TextInput style={styles.input} placeholder={t.searchPlaceholder} value={barterQuery} onChangeText={setBarterQuery} />
          <TouchableOpacity style={styles.button} onPress={searchBarterCards}>
            <Text style={styles.buttonText}>{t.search}</Text>
          </TouchableOpacity>
        </View>
        {barterLoading && <ActivityIndicator size="large" color="#e63946" />}
        <FlatList
          data={barterResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => addToDeck(item)}>
              <View style={styles.card}>
                <Image source={{ uri: item.images.small }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardSet}>{item.set.name}</Text>
                  <Text style={styles.cardNumber}>#{item.number} — ${getCardPrice(item).toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (screen === SCREENS.BARTER) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t.title}</Text>
        {renderTabBar()}
        <ScrollView>
          <View style={styles.barterContainer}>
            <View style={styles.deckColumn}>
              <Text style={styles.deckTitle}>{t.yourDeck}</Text>
              {myDeck.map((entry) => (
                <View key={entry.id} style={styles.deckCard}>
                  <Image source={{ uri: entry.card.images.small }} style={styles.deckCardImage} />
                  <View style={styles.deckCardInfo}>
                    <Text style={styles.deckCardName} numberOfLines={1}>{entry.card.name}</Text>
                    <Text style={styles.deckCardCond}>{entry.condition}</Text>
                    <Text style={styles.deckCardPrice}>${entry.vendorPrice.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromDeck('my', entry.id)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addCardButton} onPress={() => { setBarterTarget('my'); setScreen(SCREENS.BARTER_SEARCH); }}>
                <Text style={styles.addCardButtonText}>{t.addCard}</Text>
              </TouchableOpacity>
              <Text style={styles.percentageValue}>{myPercentage}%</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>10%</Text>
                <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={1} value={myPercentage} onValueChange={(val) => setMyPercentage(val)} minimumTrackTintColor="#e63946" maximumTrackTintColor="#ccc" thumbTintColor="#e63946" />
                <Text style={styles.sliderLabel}>100%</Text>
              </View>
              <Text style={styles.deckTotal}>{t.total} ${myTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.deckDivider} />
            <View style={styles.deckColumn}>
              <Text style={styles.deckTitle}>{t.theirDeck}</Text>
              {theirDeck.map((entry) => (
                <View key={entry.id} style={styles.deckCard}>
                  <Image source={{ uri: entry.card.images.small }} style={styles.deckCardImage} />
                  <View style={styles.deckCardInfo}>
                    <Text style={styles.deckCardName} numberOfLines={1}>{entry.card.name}</Text>
                    <Text style={styles.deckCardCond}>{entry.condition}</Text>
                    <Text style={styles.deckCardPrice}>${entry.vendorPrice.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromDeck('their', entry.id)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addCardButton} onPress={() => { setBarterTarget('their'); setScreen(SCREENS.BARTER_SEARCH); }}>
                <Text style={styles.addCardButtonText}>{t.addCard}</Text>
              </TouchableOpacity>
              <Text style={styles.percentageValue}>{theirPercentage}%</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>10%</Text>
                <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={1} value={theirPercentage} onValueChange={(val) => setTheirPercentage(val)} minimumTrackTintColor="#e63946" maximumTrackTintColor="#ccc" thumbTintColor="#e63946" />
                <Text style={styles.sliderLabel}>100%</Text>
              </View>
              <Text style={styles.deckTotal}>{t.total} ${theirTotal.toFixed(2)}</Text>
            </View>
          </View>
          <View style={[styles.deltaBox, delta === 0 ? styles.deltaClean : delta > 0 ? styles.deltaPos : styles.deltaNeg]}>
            {delta === 0 ? (
              <Text style={styles.deltaText}>{t.cleanTrade}</Text>
            ) : delta > 0 ? (
              <Text style={styles.deltaText}>{t.theyAdd} ${Math.abs(delta).toFixed(2)} {t.cash}</Text>
            ) : (
              <Text style={styles.deltaText}>{t.youAdd} ${Math.abs(delta).toFixed(2)} {t.cash}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={() => { setMyDeck([]); setTheirDeck([]); }}>
            <Text style={styles.clearButtonText}>{t.clearTrade}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (screen === SCREENS.SEALED) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t.title}</Text>
        {renderTabBar()}
        <ScrollView>
          <Text style={styles.sectionTitle}>{t.sealedLookup}</Text>
          <View style={styles.searchRow}>
            <TextInput style={styles.input} placeholder={t.sealedPlaceholder} value={sealedQuery} onChangeText={setSealedQuery} />
            <TouchableOpacity style={styles.button} onPress={async () => {
              if (!sealedQuery.trim()) return;
              setSealedLoading(true);
              setSealedProduct(null);
              await new Promise(r => setTimeout(r, 800));
              setSealedProduct({ name: sealedQuery, type: 'Booster Box', set: 'Unknown Set', note: 'PriceCharting API connection coming soon.' });
              setSealedLoading(false);
            }}>
              <Text style={styles.buttonText}>{t.search}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.barcodeButton}>
            <Text style={styles.barcodeButtonText}>{t.scanBarcode}</Text>
            <Text style={styles.barcodeNote}>{t.barcodeNote}</Text>
          </TouchableOpacity>
          {sealedLoading && <ActivityIndicator size="large" color="#e63946" />}
          {sealedProduct && (
            <View style={styles.sealedResult}>
              <Text style={styles.sealedName}>{sealedProduct.name}</Text>
              <Text style={styles.sealedType}>{sealedProduct.type} — {sealedProduct.set}</Text>
              <Text style={styles.sectionTitle}>{t.sealedCondition}</Text>
              <View style={styles.sealedConditionRow}>
                {SEALED_CONDITIONS.map((c, i) => (
                  <TouchableOpacity key={c.label} style={[styles.sealedCondButton, sealedConditionIndex === i && styles.sealedCondButtonActive]} onPress={() => setSealedConditionIndex(i)}>
                    <Text style={[styles.sealedCondText, sealedConditionIndex === i && styles.sealedCondTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{t.marketPrice}</Text>
                <Text style={styles.noPrice}>{sealedProduct.note}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      {renderTabBar()}

      {screen === SCREENS.SEARCH && (
        <>
          {cameraOpen ? (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing="back">
                <View style={styles.cameraOverlay}>
                  <View style={styles.cameraFrame} />
                  <Text style={styles.cameraHint}>{t.pointCamera}</Text>
                  <TouchableOpacity style={styles.cameraClose} onPress={() => setCameraOpen(false)}>
                    <Text style={styles.cameraCloseText}>{t.closeCamera}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraScanButton} onPress={() => { setCameraOpen(false); alert('Camera card recognition coming in final build.'); }}>
                    <Text style={styles.cameraScanButtonText}>{t.scanCard}</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>
          ) : (
            <View style={styles.searchRow}>
              <TouchableOpacity style={[styles.micButton, listening && styles.micButtonActive]} onPress={startListening}>
                <Text style={styles.micIcon}>{listening ? '🔴' : '🎤'}</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} placeholder={t.searchPlaceholder} value={query} onChangeText={setQuery} />
              <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
                <Text style={styles.micIcon}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={searchCards}>
                <Text style={styles.buttonText}>{t.search}</Text>
              </TouchableOpacity>
            </View>
          )}
          {listening && <Text style={styles.listeningText}>{t.listening}</Text>}
          {loading && <ActivityIndicator size="large" color="#e63946" />}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectCard(item)}>
                <View style={styles.card}>
                  <Image source={{ uri: item.images.small }} style={styles.cardImage} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardSet}>{item.set.name}</Text>
                    <Text style={styles.cardNumber}>#{item.number}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {screen === SCREENS.CARD && selectedCard && (
        <ScrollView>
          <TouchableOpacity onPress={() => setScreen(SCREENS.SEARCH)}>
            <Text style={styles.back}>{t.back}</Text>
          </TouchableOpacity>
          <View style={styles.detailContainer}>
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeText}>
                {CARD_LANGUAGES.find(l => l.code === cardLanguage)?.flag} {CARD_LANGUAGES.find(l => l.code === cardLanguage)?.label}
              </Text>
            </View>
            <Image source={{ uri: selectedCard.images.large }} style={styles.largeImage} />
            <Text style={styles.cardName}>{selectedCard.name}</Text>
            <Text style={styles.cardSet}>{selectedCard.set.name} — #{selectedCard.number}</Text>

            <View style={styles.variantBox}>
              <Text style={styles.variantTitle}>{t.confirmVariant}</Text>
              <Text style={styles.variantSubtitle}>{t.variantSubtitle}</Text>
              <View style={styles.variantGrid}>
                {VARIANTS.map((variant) => (
                  <TouchableOpacity key={variant.key} style={[styles.variantButton, selectedVariant === variant.key && styles.variantButtonActive, variant.premium && selectedVariant !== variant.key && styles.variantButtonPremium]} onPress={() => setSelectedVariant(variant.key)}>
                    {variant.premium && <Text style={styles.variantPremiumBadge}>★ </Text>}
                    <Text style={[styles.variantLabel, selectedVariant === variant.key && styles.variantLabelActive]}>{variant.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedVariant && (
                <View style={styles.variantSelected}>
                  <Text style={styles.variantSelectedText}>
                    {['1st_edition', 'shadowless', 'special_illustration'].includes(selectedVariant) ? t.premiumVariant : t.variantConfirmed}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.gradedToggleRow}>
              <TouchableOpacity style={[styles.gradedToggle, !isGraded && styles.gradedToggleActive]} onPress={() => setIsGraded(false)}>
                <Text style={[styles.gradedToggleText, !isGraded && styles.gradedToggleTextActive]}>{t.rawCard}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gradedToggle, isGraded && styles.gradedToggleActive]} onPress={() => setIsGraded(true)}>
                <Text style={[styles.gradedToggleText, isGraded && styles.gradedToggleTextActive]}>{t.gradedCard}</Text>
              </TouchableOpacity>
            </View>

            {isGraded ? (
              <View style={styles.gradedBox}>
                <Text style={styles.sectionTitle}>{t.gradingCompany}</Text>
                <View style={styles.graderRow}>
                  {GRADERS.map((g) => (
                    <TouchableOpacity key={g} style={[styles.graderButton, selectedGrader === g && styles.graderButtonActive]} onPress={() => setSelectedGrader(g)}>
                      <Text style={[styles.graderText, selectedGrader === g && styles.graderTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.sectionTitle}>{t.grade}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.gradeRow}>
                    {getGrades().map((g) => (
                      <TouchableOpacity key={g} style={[styles.gradeButton, selectedGrade === g && styles.gradeButtonActive]} onPress={() => setSelectedGrade(g)}>
                        <Text style={[styles.gradeText, selectedGrade === g && styles.gradeTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.sectionTitle}>{t.certNumber}</Text>
                <View style={styles.certRow}>
                  <TextInput style={styles.certInput} placeholder={t.certPlaceholder} value={certNumber} onChangeText={setCertNumber} keyboardType="numeric" />
                  <TouchableOpacity style={styles.certButton} onPress={lookupCert}>
                    {certLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.certButtonText}>{t.lookup}</Text>}
                  </TouchableOpacity>
                </View>
                {certResult && (
                  <View style={styles.certResult}>
                    <Text style={styles.certResultText}>⚠ {certResult.message}</Text>
                  </View>
                )}
                <View style={styles.gradeSummary}>
                  <Text style={styles.gradeSummaryText}>{selectedGrader} {selectedGrade}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.conditionContainer}>
                <Text style={styles.conditionTitle}>{t.condition}</Text>
                <View style={styles.conditionRow}>
                  {CONDITIONS.map((c, i) => (
                    <TouchableOpacity key={c.label} style={[styles.conditionButton, { backgroundColor: conditionIndex === i ? CONDITION_COLORS[i] : '#eee' }]} onPress={() => setConditionIndex(i)}>
                      <Text style={[styles.conditionText, { color: conditionIndex === i ? '#fff' : '#666' }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{sourceLabel[anchorSource]} {t.marketPrice}</Text>
              {getAnchorPrice() ? <Text style={styles.price}>${getAnchorPrice().toFixed(2)}</Text> : <Text style={styles.noPrice}>{t.noPrice}</Text>}
            </View>

            <View style={styles.vendorBox}>
              <Text style={styles.vendorLabel}>{t.yourPrice} ({percentage}% — {isGraded ? `${selectedGrader} ${selectedGrade}` : CONDITIONS[conditionIndex].label})</Text>
              {vendorPrice ? <Text style={styles.vendorPrice}>${vendorPrice.toFixed(2)}</Text> : <Text style={styles.noPrice}>—</Text>}
              <Text style={styles.percentageValue}>{percentage}%</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>10%</Text>
                <Slider style={styles.slider} minimumValue={10} maximumValue={100} step={1} value={percentage} onValueChange={(val) => savePercentage(val)} minimumTrackTintColor="#e63946" maximumTrackTintColor="#ccc" thumbTintColor="#e63946" />
                <Text style={styles.sliderLabel}>100%</Text>
              </View>
            </View>

            {anchorPrice && (
              <View style={styles.currencyBox}>
                <Text style={styles.currencyTitle}>{t.currencyConverter}</Text>
                {ratesLoading ? <ActivityIndicator size="small" color="#e63946" /> : (
                  <View style={styles.currencyGrid}>
                    {CURRENCIES.filter(c => c.code !== 'USD').map((currency) => {
                      const converted = convertPrice(anchorPrice, currency.code);
                      return (
                        <View key={currency.code} style={styles.currencyItem}>
                          <Text style={styles.currencyFlag}>{currency.flag}</Text>
                          <Text style={styles.currencyCode}>{currency.code}</Text>
                          <Text style={styles.currencyAmount}>{formatCurrency(converted, currency.code)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {isPhase2Language && <Text style={styles.phase2Note}>{t.phase2Note}</Text>}

            <Text style={styles.sourcesTitle}>{t.priceSources}</Text>
            <View style={styles.sourcesRow}>
              {availableSources.map((source) => (
                <TouchableOpacity key={source} style={[styles.sourceButton, anchorSource === source && styles.sourceButtonActive]} onPress={() => setAnchorSource(source)}>
                  <Text style={[styles.sourceButtonText, anchorSource === source && styles.sourceButtonTextActive]}>{sourceLabel[source]}</Text>
                  <Text style={[styles.sourcePrice, anchorSource === source && styles.sourceButtonTextActive]}>
                    {getPrice(selectedCard, source) ? `$${getPrice(selectedCard, source).toFixed(2)}` : 'N/A'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  tabBar: { flexDirection: 'row', marginBottom: 15, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e63946' },
  tab: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#e63946' },
  tabText: { fontSize: 12, color: '#e63946', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  settingsLangGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  settingsLangButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', minWidth: '45%' },
  settingsLangButtonActive: { borderColor: '#e63946', backgroundColor: '#fff3f3' },
  settingsLangFlag: { fontSize: 24, marginRight: 8 },
  settingsLangLabel: { fontSize: 14, color: '#444', fontWeight: 'bold' },
  settingsLangLabelActive: { color: '#e63946' },
  languageRow: { flexDirection: 'row', gap: 8, paddingBottom: 5 },
  langButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center' },
  langButtonActive: { borderColor: '#e63946', backgroundColor: '#fff3f3' },
  langFlag: { fontSize: 18, marginRight: 6 },
  langLabel: { fontSize: 13, color: '#666' },
  langLabelActive: { color: '#e63946', fontWeight: 'bold' },
  phase2Note: { fontSize: 12, color: '#f4a261', marginVertical: 10, textAlign: 'center' },
  searchRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  micButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  micButtonActive: { backgroundColor: '#ffd6d6' },
  micIcon: { fontSize: 18 },
  cameraButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  cameraFrame: { width: 200, height: 140, borderWidth: 2, borderColor: '#fff', borderRadius: 8, marginTop: 20 },
  cameraHint: { color: '#fff', fontSize: 14, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  cameraClose: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cameraCloseText: { color: '#fff', fontWeight: 'bold' },
  cameraScanButton: { backgroundColor: '#e63946', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  cameraScanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listeningText: { textAlign: 'center', color: '#e63946', marginBottom: 10, fontWeight: 'bold' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginRight: 10 },
  button: { backgroundColor: '#e63946', padding: 10, borderRadius: 8, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', marginBottom: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10 },
  cardImage: { width: 60, height: 84, borderRadius: 4 },
  cardInfo: { marginLeft: 10, justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardSet: { fontSize: 13, color: '#666' },
  cardNumber: { fontSize: 13, color: '#999' },
  detailContainer: { alignItems: 'center' },
  back: { color: '#e63946', marginBottom: 15, fontSize: 16 },
  languageBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  languageBadgeText: { fontSize: 13, color: '#444' },
  largeImage: { width: 200, height: 280, borderRadius: 8, marginBottom: 15 },
  variantBox: { width: '100%', backgroundColor: '#fffbf0', borderWidth: 1, borderColor: '#f4a261', borderRadius: 10, padding: 15, marginVertical: 15 },
  variantTitle: { fontSize: 15, fontWeight: 'bold', color: '#c77b2e', marginBottom: 4 },
  variantSubtitle: { fontSize: 12, color: '#999', marginBottom: 12 },
  variantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  variantButtonActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  variantButtonPremium: { borderColor: '#f4a261' },
  variantPremiumBadge: { fontSize: 10, color: '#f4a261' },
  variantLabel: { fontSize: 12, color: '#444', fontWeight: 'bold' },
  variantLabelActive: { color: '#fff' },
  variantSelected: { marginTop: 10, backgroundColor: '#fff3cd', padding: 8, borderRadius: 6 },
  variantSelectedText: { fontSize: 12, color: '#856404' },
  gradedToggleRow: { flexDirection: 'row', marginVertical: 15, borderWidth: 1, borderColor: '#e63946', borderRadius: 8, overflow: 'hidden', width: '100%' },
  gradedToggle: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  gradedToggleActive: { backgroundColor: '#e63946' },
  gradedToggleText: { fontSize: 14, color: '#e63946', fontWeight: 'bold' },
  gradedToggleTextActive: { color: '#fff' },
  gradedBox: { width: '100%', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 10 },
  graderRow: { flexDirection: 'row', gap: 8 },
  graderButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  graderButtonActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  graderText: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  graderTextActive: { color: '#fff' },
  gradeRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  gradeButton: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  gradeButtonActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  gradeText: { fontSize: 13, color: '#666', fontWeight: 'bold' },
  gradeTextActive: { color: '#fff' },
  certRow: { flexDirection: 'row', gap: 8 },
  certInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  certButton: { backgroundColor: '#e63946', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  certButtonText: { color: '#fff', fontWeight: 'bold' },
  certResult: { marginTop: 8, backgroundColor: '#fff3cd', padding: 10, borderRadius: 8 },
  certResultText: { fontSize: 12, color: '#856404' },
  gradeSummary: { marginTop: 12, backgroundColor: '#e63946', padding: 12, borderRadius: 8, alignItems: 'center' },
  gradeSummaryText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  conditionContainer: { marginTop: 10, width: '100%' },
  conditionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  conditionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  conditionButton: { padding: 8, borderRadius: 6, alignItems: 'center', minWidth: 40 },
  conditionText: { fontSize: 12, fontWeight: 'bold' },
  priceBox: { marginTop: 20, alignItems: 'center', backgroundColor: '#f8f8f8', padding: 15, borderRadius: 10, width: '100%' },
  priceLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#222' },
  noPrice: { fontSize: 16, color: '#999' },
  vendorBox: { marginTop: 10, alignItems: 'center', backgroundColor: '#fff3f3', padding: 15, borderRadius: 10, width: '100%' },
  vendorLabel: { fontSize: 14, color: '#e63946', marginBottom: 5 },
  vendorPrice: { fontSize: 32, fontWeight: 'bold', color: '#e63946' },
  percentageValue: { fontSize: 18, fontWeight: 'bold', marginVertical: 6, color: '#e63946' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 4 },
  slider: { flex: 1, height: 40 },
  sliderLabel: { fontSize: 11, color: '#999', width: 35, textAlign: 'center' },
  currencyBox: { marginTop: 20, width: '100%', backgroundColor: '#f8f8f8', padding: 15, borderRadius: 10 },
  currencyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyItem: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 8, minWidth: '22%', borderWidth: 1, borderColor: '#eee' },
  currencyFlag: { fontSize: 20, marginBottom: 2 },
  currencyCode: { fontSize: 11, color: '#666', marginBottom: 2 },
  currencyAmount: { fontSize: 13, fontWeight: 'bold', color: '#222' },
  sourcesTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start' },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  sourceButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minWidth: '45%', alignItems: 'center' },
  sourceButtonActive: { borderColor: '#e63946', backgroundColor: '#fff3f3' },
  sourceButtonText: { fontSize: 13, color: '#666' },
  sourceButtonTextActive: { color: '#e63946', fontWeight: 'bold' },
  sourcePrice: { fontSize: 15, fontWeight: 'bold', color: '#222', marginTop: 3 },
  barcodeButton: { borderWidth: 2, borderColor: '#e63946', borderRadius: 8, borderStyle: 'dashed', padding: 20, alignItems: 'center', marginBottom: 20 },
  barcodeButtonText: { fontSize: 18, color: '#e63946', fontWeight: 'bold' },
  barcodeNote: { fontSize: 12, color: '#999', marginTop: 4 },
  sealedResult: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 15 },
  sealedName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  sealedType: { fontSize: 14, color: '#666', marginBottom: 10 },
  sealedConditionRow: { flexDirection: 'column', gap: 8, marginBottom: 15 },
  sealedCondButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', alignItems: 'center' },
  sealedCondButtonActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  sealedCondText: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  sealedCondTextActive: { color: '#fff' },
  barterContainer: { flexDirection: 'row', gap: 10 },
  deckColumn: { flex: 1 },
  deckTitle: { fontSize: 13, fontWeight: 'bold', color: '#e63946', marginBottom: 10, textAlign: 'center' },
  deckCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 8, padding: 6, marginBottom: 6 },
  deckCardImage: { width: 36, height: 50, borderRadius: 4 },
  deckCardInfo: { flex: 1, marginLeft: 6 },
  deckCardName: { fontSize: 11, fontWeight: 'bold' },
  deckCardCond: { fontSize: 10, color: '#666' },
  deckCardPrice: { fontSize: 11, color: '#e63946', fontWeight: 'bold' },
  removeBtn: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
  addCardButton: { borderWidth: 1, borderColor: '#e63946', borderRadius: 8, borderStyle: 'dashed', padding: 8, alignItems: 'center', marginTop: 6 },
  addCardButtonText: { color: '#e63946', fontWeight: 'bold', fontSize: 13 },
  deckTotal: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 8, color: '#222' },
  deckDivider: { width: 1, backgroundColor: '#eee' },
  deltaBox: { marginTop: 20, padding: 20, borderRadius: 12, alignItems: 'center' },
  deltaClean: { backgroundColor: '#d4edda' },
  deltaPos: { backgroundColor: '#fff3cd' },
  deltaNeg: { backgroundColor: '#fff3f3' },
  deltaText: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  clearButton: { marginTop: 15, marginBottom: 30, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  clearButtonText: { color: '#999', fontWeight: 'bold' },
});