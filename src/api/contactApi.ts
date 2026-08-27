// src/api/contactApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const contactService = {
  /**
   * Create a new contact message
   * POST /api/contacts/
   */
  createContact: async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category?: string;
  }) => {
    try {
      console.log('[contactService] Creating contact:', data);
      const response = await axios.post(`${API_BASE_URL}/contacts/`, data, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('[contactService] Contact created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error creating contact:', error);
      console.error('[contactService] Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Get all contacts (admin/staff only)
   * GET /api/contacts/
   */
  getContacts: async (params?: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/contacts/`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error getting contacts:', error);
      throw error;
    }
  },

  /**
   * Get a single contact by ID
   * GET /api/contacts/{id}/
   */
  getContact: async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/contacts/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error getting contact:', error);
      throw error;
    }
  },

  /**
   * Update a contact
   * PATCH /api/contacts/{id}/
   */
  updateContact: async (id: number, data: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`${API_BASE_URL}/contacts/${id}/`, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error updating contact:', error);
      throw error;
    }
  },

  /**
   * Delete a contact
   * DELETE /api/contacts/{id}/
   */
  deleteContact: async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(`${API_BASE_URL}/contacts/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error deleting contact:', error);
      throw error;
    }
  },

  /**
   * Respond to a contact
   * POST /api/contacts/{id}/respond/
   */
  respondToContact: async (id: number, responseText: string, status?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/contacts/${id}/respond/`,
        { response: responseText, status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error responding to contact:', error);
      throw error;
    }
  },

  /**
   * Get contact statistics
   * GET /api/contacts/stats/
   */
  getContactStats: async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/contacts/stats/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error getting stats:', error);
      throw error;
    }
  },

  /**
   * Bulk delete contacts
   * DELETE /api/contacts/bulk_delete/?ids=1,2,3
   */
  bulkDeleteContacts: async (ids: number[]) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(`${API_BASE_URL}/contacts/bulk_delete/`, {
        params: { ids: ids.join(',') },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error bulk deleting contacts:', error);
      throw error;
    }
  },

  /**
   * Bulk update status
   * POST /api/contacts/bulk_update_status/
   */
  bulkUpdateStatus: async (ids: number[], status: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/contacts/bulk_update_status/`,
        { ids, status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return response.data;
    } catch (error: any) {
      console.error('[contactService] Error bulk updating status:', error);
      throw error;
    }
  }
};

export default contactService;