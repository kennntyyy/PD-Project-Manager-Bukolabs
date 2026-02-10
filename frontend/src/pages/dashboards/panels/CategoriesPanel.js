import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { categoryService } from '../../../services/categoryService';
import './CategoriesPanel.css';

// ============================================
// CATEGORIES PANEL
// Handles: Create and list categories
// ============================================

const CategoriesPanel = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const toast = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load categories error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to load categories',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Missing name',
        detail: 'Please enter a category name.',
      });
      return;
    }

    try {
      setLoading(true);
      await categoryService.create({ category_name: trimmedName });
      setCategoryName('');
      toast.current?.show({
        severity: 'success',
        summary: 'Created',
        detail: 'Category has been created.',
      });
      await loadCategories();
    } catch (error) {
      console.error('Create category error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to create category',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  };

  return (
    <div className="categories-panel">
      <Toast ref={toast} />

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Create Category</h3>
        </div>
        <form className="categories-form" onSubmit={handleCreate}>
          <div className="categories-field">
            <label htmlFor="categoryName">Category Name</label>
            <InputText
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Renovation"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            label={loading ? 'Saving...' : 'Add Category'}
            icon="pi pi-plus"
            className="btn-primary"
            disabled={loading}
          />
        </form>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">Existing Categories</h3>
        </div>
        <DataTable
          value={categories}
          loading={loading}
          emptyMessage="No categories found."
          dataKey="category_id"
          className="categories-table"
        >
          <Column field="category_name" header="Category" sortable />
          <Column
            field="created_at"
            header="Created"
            body={(row) => formatDate(row?.created_at)}
            sortable
          />
        </DataTable>
      </div>
    </div>
  );
};

export default CategoriesPanel;
