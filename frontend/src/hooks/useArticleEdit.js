// frontend/src/hooks/useArticleEdit.js

import { useState, useCallback } from 'react';
import { smsService } from '@/services/smsService';

export const useArticleEdit = (smsId) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Abrir modal de edición
  const openEditModal = useCallback((articleId) => {
    setEditingArticleId(articleId);
    setIsEditModalOpen(true);
    setError(null);
  }, []);

  // Cerrar modal de edición
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingArticleId(null);
    setError(null);
  }, []);

  // Guardar cambios del artículo
  const saveArticle = useCallback(async (articleData, onSuccess = null) => {
    if (!editingArticleId || !smsId) {
      setError('IDs requeridos para guardar el artículo');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await smsService.updateArticle(smsId, editingArticleId, articleData);
      
      if (onSuccess) {
        onSuccess(response.article);
      }

      closeEditModal();
      return true;

    } catch (err) {
      console.error('Error al guardar artículo:', err);
      setError(err.message || 'Error al guardar el artículo');
      return false;
    } finally {
      setLoading(false);
    }
  }, [editingArticleId, smsId, closeEditModal]);

  // Actualizar estado del artículo
  const updateArticleStatus = useCallback(async (articleId, newStatus, onSuccess = null) => {
    if (!smsId || !articleId) {
      setError('IDs requeridos para actualizar el estado');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await smsService.updateArticleStatus(smsId, articleId, newStatus);
      
      if (onSuccess) {
        onSuccess(response);
      }

      return true;

    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError(err.message || 'Error al actualizar el estado');
      return false;
    } finally {
      setLoading(false);
    }
  }, [smsId]);

  return {
    // Estados
    isEditModalOpen,
    editingArticleId,
    loading,
    error,
    
    // Funciones
    openEditModal,
    closeEditModal,
    saveArticle,
    updateArticleStatus,
    
    // Utilidades
    clearError: () => setError(null)
  };
};

export default useArticleEdit;