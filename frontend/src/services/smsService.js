import api from './axios';

export const smsService = {
    getAllSMS: async () => {
        try {
            const response = await api.get('/api/sms/sms/');
            console.log('Respuesta getAllSMS:', response.data);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error al obtener SMS:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    createSMS: async (smsData) => {
        try {
            console.log('Intentando crear SMS con datos:', smsData);
            const response = await api.post('/api/sms/sms/', smsData);
            console.log('Respuesta createSMS:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al crear SMS. Status:', error.response?.status);
            console.error('Datos del error:', error.response?.data);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    createInitialSMS: async (basicData) => {
        try {
            console.log('Creando SMS inicial con datos:', basicData);
            const response = await api.post('/api/sms/sms/', basicData);
            console.log('Respuesta completa createInitialSMS:', response);
            console.log('Datos de la respuesta:', response.data);
            
            // Verificar la estructura de la respuesta
            if (!response.data) {
                throw new Error('El servidor no devolvió datos');
            }
            
            // Asegurarnos de que tenemos un ID válido
            const smsData = response.data;
            if (!smsData.id && typeof smsData.id !== 'number') {
                console.error('Estructura de la respuesta:', smsData);
                throw new Error('El servidor no devolvió un ID válido en la respuesta');
            }
            
            return {
                ...smsData,
                id: Number(smsData.id) // Asegurarnos de que el ID sea un número
            };
        } catch (error) {
            console.error('Error completo al crear SMS inicial:', error);
            if (error.response) {
                console.error('Estado de la respuesta:', error.response.status);
                console.error('Datos del error:', error.response.data);
                console.error('Headers de la respuesta:', error.response.headers);
                throw new Error(`Error del servidor: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                throw error;
            }
        }
    },

    updateSMS: async (id, smsData) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para actualizar el SMS');
            }
            const response = await api.put(`/api/sms/sms/${id}/`, smsData);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar SMS:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    updateSMSQuestions: async (id, questionsData) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para actualizar las preguntas');
            }
            console.log('Actualizando preguntas del SMS', id, 'con datos:', questionsData);
            const response = await api.post(`/api/sms/sms/${id}/questions/`, questionsData);
            console.log('Respuesta updateSMSQuestions:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar preguntas. Status:', error.response?.status);
            console.error('Datos del error:', error.response?.data);
            throw error;
        }
    },

    updateSMSCriteria: async (id, criteriaData) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para actualizar los criterios');
            }
            
            // Asegurar que los datos enviados sean los correctos
            const cleanCriteriaData = {};
            
            // Solo incluir campos que tengan valores válidos
            if (criteriaData.cadena_busqueda !== undefined && criteriaData.cadena_busqueda !== null) {
                cleanCriteriaData.cadena_busqueda = criteriaData.cadena_busqueda;
            }
            
            if (criteriaData.anio_inicio !== undefined && criteriaData.anio_inicio !== null) {
                cleanCriteriaData.anio_inicio = criteriaData.anio_inicio;
            }
            
            if (criteriaData.anio_final !== undefined && criteriaData.anio_final !== null) {
                cleanCriteriaData.anio_final = criteriaData.anio_final;
            }
            
            if (criteriaData.criterios_inclusion !== undefined && criteriaData.criterios_inclusion !== null) {
                cleanCriteriaData.criterios_inclusion = criteriaData.criterios_inclusion;
            }
            
            if (criteriaData.criterios_exclusion !== undefined && criteriaData.criterios_exclusion !== null) {
                cleanCriteriaData.criterios_exclusion = criteriaData.criterios_exclusion;
            }
            
            if (criteriaData.enfoque_estudio !== undefined && criteriaData.enfoque_estudio !== null) {
                cleanCriteriaData.enfoque_estudio = criteriaData.enfoque_estudio;
            }
            // Esta línea falta en la función updateSMSCriteria
            if (criteriaData.fuentes !== undefined && criteriaData.fuentes !== null) {
                cleanCriteriaData.fuentes = criteriaData.fuentes;
            }
            
            console.log('Actualizando criterios del SMS', id, 'con datos:', cleanCriteriaData);
            const response = await api.post(`/api/sms/sms/${id}/criteria/`, cleanCriteriaData);
            console.log('Respuesta updateSMSCriteria:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar criterios. Status:', error.response?.status);
            console.error('Datos del error:', error.response?.data);
            throw error;
        }
    },

    generateSearchQuery: async (title) => {
        try {
            console.log('Generando cadena de búsqueda para título:', title);
            const response = await api.post('/api/sms/sms/generate-search-query/', { titulo: title });
            console.log('Respuesta generateSearchQuery:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al generar cadena de búsqueda:', error);
            throw error;
        }
    },

    getSMSById: async (id) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para obtener el SMS');
            }
            const response = await api.get(`/api/sms/sms/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener SMS por ID:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    deleteSMS: async (id) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para eliminar el SMS');
            }
            await api.delete(`/api/sms/sms/${id}/`);
        } catch (error) {
            console.error('Error al eliminar SMS:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    // Añadir estudios a un SMS
    addStudiesToSMS: async (smsId, studiesData) => {
        try {
            const response = await api.post(`/api/sms/sms/${smsId}/articles/import/`, studiesData);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },
    
    // Obtener estudios de un SMS
    getStudiesBySMSId: async (smsId) => {
        try {
            const response = await api.get(`/api/sms/sms/${smsId}/articles/`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },
    // En src/services/smsService.js, añade esta función
    analyzePDFs: async (smsId, pdfFiles, forceReanalysis = false) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }
    
            // Crear un objeto FormData para enviar los archivos
            const formData = new FormData();
            
            // Añadir cada archivo PDF al FormData
            pdfFiles.forEach(file => {
                formData.append('files', file.file);
            });
            
            // Añadir otros campos si es necesario
            formData.append('enfoque', 'No especificado');
            formData.append('tipo_registro', 'No especificado');
            formData.append('tipo_tecnica', 'No especificado');
            
            // Añadir flag de force_reanalysis
            if (forceReanalysis) {
                formData.append('force_reanalysis', 'true');
            }
            
            // Configurar headers específicos para FormData
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            
            console.log('Enviando PDFs para análisis:', {
                archivos: pdfFiles.length,
                forceReanalysis: forceReanalysis,
                smsId: smsId
            });
            
            const response = await api.post(`/api/sms/sms/${smsId}/articles/analyze-pdfs/`, formData, config);
            console.log('Respuesta analyze-pdfs:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error al analizar PDFs:', error);
            
            // Manejar específicamente el error 409 (conflicto)
            if (error.response?.status === 409) {
                return error.response.data;
            }
            
            throw new Error(error.response?.data?.error || 'Error al analizar los PDFs');
        }
    },
    // Exportar artículos de un SMS
    exportArticles: async (smsId, articleIds = []) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }

            // Construir la URL correcta según la estructura del backend
            let url = `/api/sms/sms/${smsId}/articles/export/`;
            
            // Añadir parámetros de consulta
            const params = new URLSearchParams();
            params.append('format', 'csv');
            
            // Si hay IDs específicos, añadirlos como parámetro
            if (articleIds.length > 0) {
                params.append('ids', articleIds.join(','));
            } else {
                // Si no hay IDs específicos, exportar todos los artículos
                params.append('state', 'all');
            }
            
            url += `?${params.toString()}`;
            
            console.log('URL de exportación:', url); // Para depuración
            
            // Configurar para recibir blob en lugar de JSON
            const response = await api.get(url, {
                responseType: 'blob'
            });
            
            return response.data;
        } catch (error) {
            console.error('Error al exportar artículos:', error);
            throw new Error(error.response?.data?.error || 'Error al exportar los artículos');
        }
    },
    // frontend/src/services/smsService.js - Versión con debug del método getSMSStatistics

    getSMSStatistics: async (smsId) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }
            console.log('Obteniendo estadísticas para SMS:', smsId);
            
            // Construir la URL manualmente para debug
            const url = `/api/sms/sms/${smsId}/statistics/`;
            console.log('URL del endpoint:', url);
            
            const response = await api.get(url);
            console.log('Respuesta del servidor:', response);
            console.log('Datos de estadísticas:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error completo al obtener estadísticas:', error);
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },
    updateArticle: async (smsId, articleId, articleData) => {
        try {
            if (!smsId || !articleId) {
                throw new Error('Se requieren IDs válidos');
            }
            
            console.log('Actualizando artículo:', { smsId, articleId, articleData });
            
            // Limpiar datos antes de enviar
            const cleanData = {};
            Object.keys(articleData).forEach(key => {
                const value = articleData[key];
                if (value !== undefined && value !== null && value !== '') {
                    cleanData[key] = value;
                }
            });
            
            const response = await api.patch(
                `/api/sms/sms/${smsId}/articles/${articleId}/edit/`, 
                cleanData
            );
            
            console.log('Artículo actualizado:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar artículo:', error);
            
            // Mejorar el manejo de errores
            if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            } else if (error.response?.data) {
                // Manejar errores de validación del serializer
                const errorMessages = [];
                Object.entries(error.response.data).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(message => {
                            errorMessages.push(`${field}: ${message}`);
                        });
                    } else {
                        errorMessages.push(`${field}: ${messages}`);
                    }
                });
                throw new Error(errorMessages.join(', '));
            }
            
            throw error;
        }
    },
    updateArticleStatus: async (smsId, articleId, newStatus) => {
        try {
            if (!smsId || !articleId) {
                throw new Error('Se requieren IDs válidos');
            }
            
            console.log('Actualizando estado del artículo:', { smsId, articleId, newStatus });
            
            const response = await api.patch(
                `/api/sms/sms/${smsId}/articles/${articleId}/select/`, 
                { estado: newStatus }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error al actualizar estado del artículo:', error);
            throw error;
        }
    },
    validateArticleData: (articleData) => {
        const errors = {};
        
        // Validaciones básicas
        if (!articleData.titulo || !articleData.titulo.trim()) {
            errors.titulo = 'El título es obligatorio';
        }
        
        if (!articleData.autores || !articleData.autores.trim()) {
            errors.autores = 'Los autores son obligatorios';
        }
        
        if (articleData.anio_publicacion) {
            const year = parseInt(articleData.anio_publicacion);
            if (isNaN(year) || year < 1900 || year > 2030) {
                errors.anio_publicacion = 'El año debe estar entre 1900 y 2030';
            }
        }
        
        if (articleData.doi && articleData.doi.trim() && !articleData.doi.startsWith('10.')) {
            errors.doi = 'El DOI debe tener un formato válido (ej: 10.1000/journal.2023.123)';
        }
        
        const validStates = ['SELECTED', 'REJECTED', 'PENDING'];
        if (articleData.estado && !validStates.includes(articleData.estado)) {
            errors.estado = `El estado debe ser uno de: ${validStates.join(', ')}`;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    getArticleDetails: async (smsId, articleId) => {
        try {
            if (!smsId || !articleId) {
                throw new Error('Se requieren IDs válidos');
            }
            
            console.log('Obteniendo detalles del artículo:', { smsId, articleId });
            
            const response = await api.get(`/api/sms/sms/${smsId}/articles/${articleId}/details/`);
            console.log('Detalles del artículo obtenidos:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error al obtener detalles del artículo:', error);
            throw error;
        }
    },
    // Añadir al final del objeto smsService:

    generateReport: async (smsId) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }
            
            console.log('Generando reporte para SMS:', smsId);
            
            const response = await api.post(`/api/sms/sms/${smsId}/generate-report/`);
            console.log('Reporte generado:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error al generar reporte:', error);
            throw new Error(error.response?.data?.error || 'Error al generar el reporte');
        }
    },

    exportReportPDF: async (smsId) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }
            
            console.log('Exportando reporte PDF para SMS:', smsId);
            
            const response = await api.post(`/api/sms/sms/${smsId}/export-report/`, {}, {
                responseType: 'blob'
            });
            
            return response.data;
        } catch (error) {
            console.error('Error al exportar reporte PDF:', error);
            throw new Error(error.response?.data?.error || 'Error al exportar el reporte');
        }
    },

    // En frontend/src/services/smsService.js, añade este método
    getAdvancedSemanticAnalysis: async (smsId) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }
            
            console.log('Obteniendo análisis semántico avanzado para SMS:', smsId);
            
            const response = await api.get(`/api/sms/sms/${smsId}/advanced-analysis/`);
            console.log('Análisis semántico obtenido:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error al obtener análisis semántico:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            
            throw error;
        }
    },
    getPrismaDiagram: async (smsId) => {
        try {
            const response = await api.get(`/api/sms/sms/${smsId}/prisma-diagram/`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener diagrama PRISMA:', error);
            throw error;
        }
    },
    // Añadir este método al objeto smsService en frontend/src/services/smsService.js

    getBubbleChartAnalysis: async (smsId) => {
        try {
            if (!smsId) {
                throw new Error('Se requiere un ID de SMS válido');
            }
            
            console.log('Obteniendo análisis de gráfico de burbujas para SMS:', smsId);
            
            const response = await api.get(`/api/sms/sms/${smsId}/bubble-chart/`);
            console.log('Análisis de burbujas obtenido:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error al obtener análisis de burbujas:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            
            throw error;
        }
    },
};

export default smsService;