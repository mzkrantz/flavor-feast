// screens/RecipeStepsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeContext } from '../context/RecipeContext';
import { Recipe, Step, RootStackParamList } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import StepImagePicker from '../components/StepImagePicker';

const RecipeStepsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { addRecipe, editRecipe } = useRecipeContext();

  const route = useRoute<any>();
  const recipe = route.params?.recipe as Recipe;

  const [steps, setSteps] = useState(recipe?.steps || []);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState<'CREATE_SUCCESS' | 'EDIT_SUCCESS' | 'ERROR' | null>(null);
  const [errorType, setErrorType] = useState<string>('');
  //const [steps, setSteps] = useState<{ text: string; image: any }[]>(recipe?.steps?.length > 0 ? recipe.steps : []);

  const addStep = () => {
    setSteps([...steps, { text: '', imageUrl: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const updated = steps.filter((_, i) => i !== index);
      setSteps(updated);
    } else {
      Alert.alert('Error', 'Debe tener al menos un paso');
    }
  };

  const handleChange = (index: number, field: keyof Step, value: any) => {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  };

  const handleSave = async () => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      Alert.alert('Error', 'Debe ingresar al menos un ingrediente.');
      return;
    }
    
    const validSteps = steps.filter((step) => 
      (step.text && step.text.trim() !== '') || 
      (step.description && step.description.trim() !== '')
    );
    
    if (validSteps.length === 0) {
      Alert.alert('Error', 'Debe ingresar al menos un paso.');
      return;
    }

    setSaving(true);
    try {
      // Crear la receta completa con los pasos validados
      const completeRecipe = {
        ...recipe,
        steps: validSteps,
      };

      // Si la receta tiene un ID (y es creada por el usuario), estamos editando una receta existente
      if (recipe.id && recipe.id.trim() !== '' && recipe.createdByUser) {
        await editRecipe(recipe.id, completeRecipe);
        setIsEditing(true);
        setModalType('EDIT_SUCCESS');
        setShowSuccessModal(true);
      } else {
        // Si no tiene ID o no es creada por el usuario, es una nueva receta
        await addRecipe(completeRecipe);
        setModalType('CREATE_SUCCESS');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error capturado en handleSave:', error);
      const errorMessage = error instanceof Error ? error.message : 'ERROR_GENERAL';
      setErrorType(errorMessage);
      setModalType('ERROR');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };
  
  const handleGoToMyRecipes = () => {
    setShowSuccessModal(false);
    setModalType(null);
    
    // Siempre navegar a "Mis Recetas" después de guardar, tanto para crear como para editar
    navigation.navigate('HomeTabs', { screen: 'Mis Recetas' });
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setModalType(null);
    setErrorType('');
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'IMAGEN_INVALIDA':
        return {
          title: '¡Error en la imagen!',
          message: 'La URL de la imagen no es válida. Por favor, verifica que sea una URL correcta de una imagen.'
        };
      case 'INGREDIENTE_INVALIDO':
        return {
          title: '¡Error en los ingredientes!',
          message: 'Hay un problema con los ingredientes seleccionados. Verifica que sean válidos.'
        };
      case 'PASO_INVALIDO':
        return {
          title: '¡Error en los pasos!',
          message: 'Hay un problema con los pasos de la receta. Verifica que estén completos.'
        };
      case 'ERROR_VALIDACION':
        return {
          title: '¡Error de validación!',
          message: 'Los datos ingresados no son válidos. Por favor, revisa todos los campos.'
        };
      default:
        return {
          title: '¡Error al guardar la receta!',
          message: 'No se pudo guardar la receta. Por favor, verifica tu conexión a internet e inténtalo de nuevo.'
        };
    }
  };

  const getSuccessMessage = () => {
    switch (modalType) {
      case 'CREATE_SUCCESS':
        return {
          title: '¡Receta creada con éxito!',
          message: 'Tu receta ha sido creada correctamente y ya está disponible en tu lista personal.',
          buttonText: 'Ir a Mis Recetas'
        };
      case 'EDIT_SUCCESS':
        return {
          title: '¡Receta actualizada con éxito!',
          message: 'Los cambios en tu receta han sido guardados correctamente.',
          buttonText: 'Ir a Mis Recetas'
        };
      default:
        return {
          title: '¡Operación exitosa!',
          message: 'La operación se completó correctamente.',
          buttonText: 'Continuar'
        };
    }
  };
  

  return (
    <View style={styles.screenContainer}>
      {/* Botón de back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Pasos de la receta</Text>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.label}>Paso {index + 1}</Text>
            {steps.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeStep(index)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TextInput
            placeholder="Descripción del paso"
            placeholderTextColor="#000"
            value={step.text || step.description || ''}
            onChangeText={(text: string) => handleChange(index, 'text', text)}
            style={styles.input}
            multiline
          />
          
          <StepImagePicker
            imageUrl={step.imageUrl || ''}
            onImageUrlChange={(url: string) => handleChange(index, 'imageUrl', url)}
            placeholder="URL de imagen del paso (opcional)"
          />
        </View>
      ))}

      <TouchableOpacity onPress={addStep}>
        <Text style={styles.addStep}>+ Agregar otro paso</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? 'Guardando...' : 'Guardar receta'}
        </Text>
      </TouchableOpacity>

      {saving && <LoadingSpinner text="Guardando receta..." />}

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: '#6c757d', marginTop: 10 }]}
        onPress={() => navigation.goBack()}
        >
        <Text style={styles.saveText}>Cancelar</Text>
      </TouchableOpacity>

    </ScrollView>

    {/* Modal de éxito */}
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          
          <Text style={styles.successTitle}>
            {getSuccessMessage().title}
          </Text>
          <Text style={styles.successMessage}>
            {getSuccessMessage().message}
          </Text>
          
          <TouchableOpacity 
            style={styles.successButton} 
            onPress={handleGoToMyRecipes}
          >
            <Text style={styles.successButtonText}>
              {getSuccessMessage().buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Modal de error */}
    <Modal
      visible={showErrorModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowErrorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>❌</Text>
          </View>
          
          <Text style={styles.errorTitle}>
            {getErrorMessage().title}
          </Text>
          <Text style={styles.errorMessage}>
            {getErrorMessage().message}
          </Text>
          
          <TouchableOpacity 
            style={styles.errorButton} 
            onPress={handleCloseErrorModal}
          >
            <Text style={styles.errorButtonText}>
              Intentar de nuevo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#00000066',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  container: { padding: 16, paddingTop: 60 },
  scrollContent: { 
    paddingBottom: 100, // Espacio para la barra de navegación inferior
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stepCard: {
    marginBottom: 16,
    backgroundColor: '#f3f3f3',
    padding: 12,
    borderRadius: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontWeight: 'bold', fontSize: 16 },
  removeBtn: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    minHeight: 60,
    color: '#000', // Texto negro
    backgroundColor: '#fff', // Fondo blanco
  },
  imageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fff', // Fondo blanco
    color: '#000', // Texto negro
  },
  img: {
    width: '100%',
    height: 150,
    marginTop: 8,
    borderRadius: 6,
  },
  addStep: {
    color: '#13162e',
    marginBottom: 20,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#23294c',
    padding: 14,
    alignItems: 'center',
    borderRadius: 30,
  },
  saveBtnDisabled: {
    backgroundColor: '#6b7280',
    padding: 14,
    alignItems: 'center',
    borderRadius: 30,
    opacity: 0.7,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos para el modal de éxito
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 60,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23294c',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#23294c',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para el modal de error
  errorIconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 60,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecipeStepsScreen;