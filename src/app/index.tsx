import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

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

const LANGUAGES = [
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
  { code: 'USD', symbol: '$', flag: '🇺🇸', label: 'USD' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', label: 'EUR' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', label: 'GBP' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺', label: 'AUD' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦', label: 'CAD' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', label: 'JPY' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', label: 'CHF' },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷', label: 'KRW' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', label: 'CNY' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷', label: 'BRL' },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱', label: 'PLN' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪', label: 'SEK' },
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

const SCREENS = { SEARCH: 'search', CARD: 'card', SEALED: 'sealed', BARTER: 'barter', BARTER_SEARCH: 'barter_search' };

export default function Index() {
  const [screen, setScreen] = useState(SCREENS.SEARCH);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [anchorSource, setAnchorSource] = useState('tcgplayer');
  const [conditionIndex, setConditionIndex] = useState(5);
  const [percentage, setPercentage] = useState(80);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState('en');
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

  useEffect(() => {
    loadPercentage();
    fetchExchangeRates();
  }, []);

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

  const searchCards = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedCard(null);
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${query}&pageSize=20`);
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const searchBarterCards = async () => {
    if (!barterQuery.trim()) return;
    setBarterLoading(true);
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${barterQuery}&pageSize=20`);
      const data = await response.json();
      setBarterResults(data.data || []);
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
  const isPhase2Language = !['en', 'ja'].includes(language);

  const sourceLabel = {
    tcgplayer: 'TCGPlayer', pricecharting: 'PriceCharting',
    ebay_sold: 'eBay Sold', ebay_30day: 'eBay 30-Day',
    yahoo_japan: 'Yahoo Japan', mercari_japan: 'Mercari JP',
  };

  const availableSources = language === 'ja'
    ? ['yahoo_japan', 'mercari_japan', 'pricecharting']
    : ['tcgplayer', 'pricecharting', 'ebay_sold', 'ebay_30day'];

  const formatCurrency = (amount, code) => {
    if (amount === null) return 'N/A';
    if (code === 'JPY' || code === 'KRW') return `${CURRENCIES.find(c => c.code === code)?.symbol}${Math.round(amount).toLocaleString()}`;
    return `${CURRENCIES.find(c => c.code === code)?.symbol}${amount.toFixed(2)}`;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={[styles.tab, screen === SCREENS.SEARCH || screen === SCREENS.CARD ? styles.tabActive : null]} onPress={() => setScreen(SCREENS.SEARCH)}>
        <Text style={[styles.tabText, screen === SCREENS.SEARCH || screen === SCREENS.CARD ? styles.tabTextActive : null]}>🔍 Singles</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, screen === SCREENS.SEALED && styles.tabActive]} onPress={() => setScreen(SCREENS.SEALED)}>
        <Text style={[styles.tabText, screen === SCREENS.SEALED && styles.tabTextActive]}>📦 Sealed</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, (screen === SCREENS.BARTER || screen === SCREENS.BARTER_SEARCH) && styles.tabActive]} onPress={() => setScreen(SCREENS.BARTER)}>
        <Text style={[styles.tabText, (screen === SCREENS.BARTER || screen === SCREENS.BARTER_SEARCH) && styles.tabTextActive]}>🤝 Barter</Text>
      </TouchableOpacity>
    </View>
  );

  if (screen === SCREENS.BARTER_SEARCH) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Card Vendor App</Text>
        {renderTabBar()}
        <TouchableOpacity onPress={() => setScreen(SCREENS.BARTER)}>
          <Text style={styles.back}>← Back to trade</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Adding to: {barterTarget === 'my' ? 'Your Deck' : "Their Deck"}</Text>
        <Text style={styles.conditionTitle}>Condition</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((c, i) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.conditionButton, { backgroundColor: barterConditionIndex === i ? CONDITION_COLORS[i] : '#eee' }]}
              onPress={() => setBarterConditionIndex(i)}
            >
              <Text style={[styles.conditionText, { color: barterConditionIndex === i ? '#fff' : '#666' }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchRow}>
          <TextInput style={styles.input} placeholder="Search card name..." value={barterQuery} onChangeText={setBarterQuery} />
          <TouchableOpacity style={styles.button} onPress={searchBarterCards}>
            <Text style={styles.buttonText}>Search</Text>
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
        <Text style={styles.title}>Card Vendor App</Text>
        {renderTabBar()}
        <ScrollView>
          <View style={styles.barterContainer}>
            <View style={styles.deckColumn}>
              <Text style={styles.deckTitle}>YOUR DECK</Text>
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
                <Text style={styles.addCardButtonText}>+ Add Card</Text>
              </TouchableOpacity>
             <View style={styles.percentageRow}>
                <TouchableOpacity style={styles.percentageButton} onPress={() => setMyPercentage(Math.max(10, myPercentage - 1))}>
                  <Text style={styles.percentageButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.percentageValue}>{myPercentage}%</Text>
                <TouchableOpacity style={styles.percentageButton} onPress={() => setMyPercentage(Math.min(100, myPercentage + 1))}>
                  <Text style={styles.percentageButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.deckTotal}>Total: ${myTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.deckDivider} />

            <View style={styles.deckColumn}>
              <Text style={styles.deckTitle}>THEIR DECK</Text>
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
                <Text style={styles.addCardButtonText}>+ Add Card</Text>
              </TouchableOpacity>
           <View style={styles.percentageRow}>
                <TouchableOpacity style={styles.percentageButton} onPress={() => setTheirPercentage(Math.max(10, theirPercentage - 1))}>
                  <Text style={styles.percentageButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.percentageValue}>{theirPercentage}%</Text>
                <TouchableOpacity style={styles.percentageButton} onPress={() => setTheirPercentage(Math.min(100, theirPercentage + 1))}>
                  <Text style={styles.percentageButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.deckTotal}>Total: ${theirTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View style={[styles.deltaBox, delta === 0 ? styles.deltaClean : delta > 0 ? styles.deltaPos : styles.deltaNeg]}>
            {delta === 0 ? (
              <Text style={styles.deltaText}>✅ Clean Trade</Text>
            ) : delta > 0 ? (
              <Text style={styles.deltaText}>They add ${Math.abs(delta).toFixed(2)} cash</Text>
            ) : (
              <Text style={styles.deltaText}>You add ${Math.abs(delta).toFixed(2)} cash</Text>
            )}
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={() => { setMyDeck([]); setTheirDeck([]); }}>
            <Text style={styles.clearButtonText}>🗑 Clear Trade</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (screen === SCREENS.SEALED) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Card Vendor App</Text>
        {renderTabBar()}
        <ScrollView>
          <Text style={styles.sectionTitle}>Sealed Product Lookup</Text>
          <View style={styles.searchRow}>
            <TextInput style={styles.input} placeholder="Search product name..." value={sealedQuery} onChangeText={setSealedQuery} />
            <TouchableOpacity style={styles.button} onPress={async () => {
              if (!sealedQuery.trim()) return;
              setSealedLoading(true);
              setSealedProduct(null);
              await new Promise(r => setTimeout(r, 800));
              setSealedProduct({ name: sealedQuery, type: 'Booster Box', set: 'Unknown Set', note: 'PriceCharting API connection coming soon.' });
              setSealedLoading(false);
            }}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.barcodeButton}>
            <Text style={styles.barcodeButtonText}>📷 Scan Barcode</Text>
            <Text style={styles.barcodeNote}>Available on mobile device</Text>
          </TouchableOpacity>
          {sealedLoading && <ActivityIndicator size="large" color="#e63946" />}
          {sealedProduct && (
            <View style={styles.sealedResult}>
              <Text style={styles.sealedName}>{sealedProduct.name}</Text>
              <Text style={styles.sealedType}>{sealedProduct.type} — {sealedProduct.set}</Text>
              <Text style={styles.sectionTitle}>Sealed Condition</Text>
              <View style={styles.sealedConditionRow}>
                {SEALED_CONDITIONS.map((c, i) => (
                  <TouchableOpacity key={c.label} style={[styles.sealedCondButton, sealedConditionIndex === i && styles.sealedCondButtonActive]} onPress={() => setSealedConditionIndex(i)}>
                    <Text style={[styles.sealedCondText, sealedConditionIndex === i && styles.sealedCondTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>PriceCharting Market Price</Text>
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
      <Text style={styles.title}>Card Vendor App</Text>
      {renderTabBar()}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
        <View style={styles.languageRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity key={lang.code} style={[styles.langButton, language === lang.code && styles.langButtonActive]} onPress={() => setLanguage(lang.code)}>
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {isPhase2Language && <Text style={styles.phase2Note}>⚠ Full pricing for this language coming in Phase 2.</Text>}

      {screen === SCREENS.SEARCH && (
        <>
          <View style={styles.searchRow}>
            <TouchableOpacity style={[styles.micButton, listening && styles.micButtonActive]} onPress={startListening}>
              <Text style={styles.micIcon}>{listening ? '🔴' : '🎤'}</Text>
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Search card name..." value={query} onChangeText={setQuery} />
            <TouchableOpacity style={styles.button} onPress={searchCards}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {listening && <Text style={styles.listeningText}>Listening...</Text>}
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
            <Text style={styles.back}>← Back to results</Text>
          </TouchableOpacity>
          <View style={styles.detailContainer}>
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeText}>
                {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.label}
              </Text>
            </View>
            <Image source={{ uri: selectedCard.images.large }} style={styles.largeImage} />
            <Text style={styles.cardName}>{selectedCard.name}</Text>
            <Text style={styles.cardSet}>{selectedCard.set.name} — #{selectedCard.number}</Text>

            <View style={styles.gradedToggleRow}>
              <TouchableOpacity style={[styles.gradedToggle, !isGraded && styles.gradedToggleActive]} onPress={() => setIsGraded(false)}>
                <Text style={[styles.gradedToggleText, !isGraded && styles.gradedToggleTextActive]}>Raw Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gradedToggle, isGraded && styles.gradedToggleActive]} onPress={() => setIsGraded(true)}>
                <Text style={[styles.gradedToggleText, isGraded && styles.gradedToggleTextActive]}>Graded Card</Text>
              </TouchableOpacity>
            </View>

            {isGraded ? (
              <View style={styles.gradedBox}>
                <Text style={styles.sectionTitle}>Grading Company</Text>
                <View style={styles.graderRow}>
                  {GRADERS.map((g) => (
                    <TouchableOpacity key={g} style={[styles.graderButton, selectedGrader === g && styles.graderButtonActive]} onPress={() => setSelectedGrader(g)}>
                      <Text style={[styles.graderText, selectedGrader === g && styles.graderTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.sectionTitle}>Grade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.gradeRow}>
                    {getGrades().map((g) => (
                      <TouchableOpacity key={g} style={[styles.gradeButton, selectedGrade === g && styles.gradeButtonActive]} onPress={() => setSelectedGrade(g)}>
                        <Text style={[styles.gradeText, selectedGrade === g && styles.gradeTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.sectionTitle}>Cert Number (optional)</Text>
                <View style={styles.certRow}>
                  <TextInput style={styles.certInput} placeholder="Enter cert number..." value={certNumber} onChangeText={setCertNumber} keyboardType="numeric" />
                  <TouchableOpacity style={styles.certButton} onPress={lookupCert}>
                    {certLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.certButtonText}>Lookup</Text>}
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
                <Text style={styles.conditionTitle}>Condition</Text>
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
              <Text style={styles.priceLabel}>{sourceLabel[anchorSource]} Market Price</Text>
              {getAnchorPrice() ? <Text style={styles.price}>${getAnchorPrice().toFixed(2)}</Text> : <Text style={styles.noPrice}>No price data available</Text>}
            </View>

            <View style={styles.vendorBox}>
              <Text style={styles.vendorLabel}>Your Price ({percentage}% — {isGraded ? `${selectedGrader} ${selectedGrade}` : CONDITIONS[conditionIndex].label})</Text>
              {vendorPrice ? <Text style={styles.vendorPrice}>${vendorPrice.toFixed(2)}</Text> : <Text style={styles.noPrice}>—</Text>}
              <View style={styles.percentageRow}>
                <TouchableOpacity style={styles.percentageButton} onPress={() => savePercentage(Math.max(10, percentage - 1))}>
                  <Text style={styles.percentageButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.percentageValue}>{percentage}%</Text>
                <TouchableOpacity style={styles.percentageButton} onPress={() => savePercentage(Math.min(100, percentage + 1))}>
                  <Text style={styles.percentageButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {anchorPrice && (
              <View style={styles.currencyBox}>
                <Text style={styles.currencyTitle}>Currency Converter</Text>
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

            <Text style={styles.sourcesTitle}>Price Sources</Text>
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
  tabText: { fontSize: 13, color: '#e63946', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  languageScroll: { marginBottom: 10 },
  languageRow: { flexDirection: 'row', gap: 8, paddingBottom: 5 },
  langButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center' },
  langButtonActive: { borderColor: '#e63946', backgroundColor: '#fff3f3' },
  langFlag: { fontSize: 18, marginRight: 6 },
  langLabel: { fontSize: 13, color: '#666' },
  langLabelActive: { color: '#e63946', fontWeight: 'bold' },
  phase2Note: { fontSize: 12, color: '#f4a261', marginBottom: 10, textAlign: 'center' },
  searchRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  micButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  micButtonActive: { backgroundColor: '#ffd6d6' },
  micIcon: { fontSize: 18 },
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
  percentageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  percentageButton: { backgroundColor: '#e63946', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  percentageButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  percentageValue: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
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