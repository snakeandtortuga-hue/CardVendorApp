import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

export default function Index() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [anchorSource, setAnchorSource] = useState('tcgplayer');

  const searchCards = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedCard(null);
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${query}&pageSize=20`);
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const selectCard = (card) => {
    setSelectedCard(card);
    setAnchorSource('tcgplayer');
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
    if (source === 'pricecharting') return null;
    if (source === 'ebay_sold') return null;
    if (source === 'ebay_30day') return null;
    return null;
  };

  const getAnchorPrice = () => getPrice(selectedCard, anchorSource);

  const sourceLabel = {
    tcgplayer: 'TCGPlayer',
    pricecharting: 'PriceCharting',
    ebay_sold: 'eBay Sold',
    ebay_30day: 'eBay 30-Day',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Card Vendor App</Text>

      {!selectedCard ? (
        <>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Search card name..."
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity style={styles.button} onPress={searchCards}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
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
      ) : (
        <ScrollView>
          <TouchableOpacity onPress={() => setSelectedCard(null)}>
            <Text style={styles.back}>← Back to results</Text>
          </TouchableOpacity>
          <View style={styles.detailContainer}>
            <Image source={{ uri: selectedCard.images.large }} style={styles.largeImage} />
            <Text style={styles.cardName}>{selectedCard.name}</Text>
            <Text style={styles.cardSet}>{selectedCard.set.name} — #{selectedCard.number}</Text>

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{sourceLabel[anchorSource]} Market Price</Text>
              {getAnchorPrice() ? (
                <Text style={styles.price}>${getAnchorPrice().toFixed(2)}</Text>
              ) : (
                <Text style={styles.noPrice}>No price data available</Text>
              )}
            </View>

            <View style={styles.vendorBox}>
              <Text style={styles.vendorLabel}>Your Price (80%)</Text>
              {getAnchorPrice() ? (
                <Text style={styles.vendorPrice}>${(getAnchorPrice() * 0.8).toFixed(2)}</Text>
              ) : (
                <Text style={styles.noPrice}>—</Text>
              )}
            </View>

            <Text style={styles.sourcesTitle}>Price Sources</Text>
            <View style={styles.sourcesRow}>
              {['tcgplayer', 'pricecharting', 'ebay_sold', 'ebay_30day'].map((source) => (
                <TouchableOpacity
                  key={source}
                  style={[styles.sourceButton, anchorSource === source && styles.sourceButtonActive]}
                  onPress={() => setAnchorSource(source)}
                >
                  <Text style={[styles.sourceButtonText, anchorSource === source && styles.sourceButtonTextActive]}>
                    {sourceLabel[source]}
                  </Text>
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  searchRow: { flexDirection: 'row', marginBottom: 20 },
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
  largeImage: { width: 200, height: 280, borderRadius: 8, marginBottom: 15 },
  priceBox: { marginTop: 20, alignItems: 'center', backgroundColor: '#f8f8f8', padding: 15, borderRadius: 10, width: '100%' },
  priceLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#222' },
  noPrice: { fontSize: 16, color: '#999' },
  vendorBox: { marginTop: 10, alignItems: 'center', backgroundColor: '#fff3f3', padding: 15, borderRadius: 10, width: '100%' },
  vendorLabel: { fontSize: 14, color: '#e63946', marginBottom: 5 },
  vendorPrice: { fontSize: 32, fontWeight: 'bold', color: '#e63946' },
  sourcesTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start' },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  sourceButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minWidth: '45%', alignItems: 'center' },
  sourceButtonActive: { borderColor: '#e63946', backgroundColor: '#fff3f3' },
  sourceButtonText: { fontSize: 13, color: '#666' },
  sourceButtonTextActive: { color: '#e63946', fontWeight: 'bold' },
  sourcePrice: { fontSize: 15, fontWeight: 'bold', color: '#222', marginTop: 3 },
});