// ✅ screens/FavoritesScreen.tsx - muestra favoritos reales, navega a detalles y permite quitar
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useRecipeContext } from '../context/RecipeContext';
import { useUserContext } from '../context/UserContext';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRatingCache } from '../context/RatingCacheContext';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const FavoritesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'RecipeDetails'>>();
  const { favorites, toggleFavorite, isFavorite, refreshFavorites } = useRecipeContext();
  const { user } = useUserContext();
  const [refreshing, setRefreshing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Estado para forzar actualizaciones
  const ratingCache = useRatingCache(); // 👈 Usar el hook de cache de valoraciones
  const { alertState, showLoginAlert, showPreventiveLimitAlert, showFavoritesLimitAlert, hideAlert, showAlert } = useCustomAlert();

  // Función para cargar valoraciones de favoritos
  const loadFavoriteRatings = async () => {
    if (favorites.length === 0) return;
    
    const recipeIds = favorites.map(recipe => recipe.id);
    await ratingCache.loadMultipleRatings(recipeIds);
  };

  // Actualizar al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      // FavoritesScreen enfocada - cargando valoraciones
      loadFavoriteRatings();
      setForceUpdate(prev => prev + 1);
    }, [favorites])
  );

  // Escuchar cambios en el cache para auto-actualizar
  useEffect(() => {
    // Cache update
    setForceUpdate(prev => prev + 1);
  }, [ratingCache.updateCounter]);

  // Función para manejar el botón de favoritos con validaciones
  const handleFavoritePress = async (item: any) => {
    // Verificar si el usuario está autenticado
    if (!user?.id) {
      showLoginAlert(() => navigation.navigate('Login'));
      return;
    }

    // En FavoritesScreen siempre se está quitando de favoritos
    const result = await toggleFavorite(item);
    
    if (!result.success && result.message) {
      Alert.alert('Error', result.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFavorites();
    await loadFavoriteRatings();
    setRefreshing(false);
  };  const renderFavorite = ({ item }: any) => {
    const ratingData = ratingCache.getRating(item.id);
    const averageRating = ratingData?.promedio || 0;
    const voteCount = ratingData?.votos || 0;
    const isRatingLoaded = ratingData !== undefined;
    
    const renderRatingSection = () => {
      if (!isRatingLoaded) {
        return <Text style={styles.ratingLoading}>Cargando valoración...</Text>;
      }
      
      if (voteCount === 0) {
        return <Text style={styles.noRating}>Sin valoraciones aún</Text>;
      }
      
      return <StarRating rating={averageRating} size={14} />;
    };
    
    return (
      <View style={styles.recipeCard}>
        <Image source={item.image} style={styles.recipeImage} />
        <View style={styles.recipeInfo}>
          <TouchableOpacity
            onPress={() => navigation.navigate('RecipeDetails', { recipe: item })}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>Por: {item.author}</Text>
            {renderRatingSection()}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleFavoritePress(item)} style={styles.heartIcon}>
          <Ionicons
            name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color="#ff6b6b"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Text style={styles.heading}>Mis Favoritos</Text>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No tenés recetas favoritas aún.</Text>
          <Text style={styles.emptySubText}>
            Desliza hacia abajo para actualizar o explora recetas para agregar a favoritos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => `favorite-${item.id}-${forceUpdate}`}
          renderItem={renderFavorite}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff6b6b']}
              tintColor="#ff6b6b"
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            refreshing ? <LoadingSpinner text="Cargando favoritos..." /> : null
          }
        />
      )}

      {/* CustomAlert para alertas estilizadas */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        icon={alertState.icon}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#2c3e50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#95a5a6',
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  rating: {
    color: '#f39c12',
    fontSize: 14,
  },
  ratingLoading: {
    color: '#95a5a6',
    fontSize: 12,
    fontStyle: 'italic',
  },
  noRating: {
    color: '#bdd3d8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  heartIcon: {
    padding: 12,
  },
});

export default FavoritesScreen;