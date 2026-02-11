import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
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
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
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

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setEditName(category?.category_name || '');
    setEditDialogVisible(true);
  };

  const handleUpdate = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Missing name',
        detail: 'Please enter a category name.',
      });
      return;
    }

    if (!editingCategory?.category_id) {
      return;
    }

    try {
      setLoading(true);
      await categoryService.update(editingCategory.category_id, {
        category_name: trimmedName,
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Updated',
        detail: 'Category has been updated.',
      });
      setEditDialogVisible(false);
      setEditingCategory(null);
      setEditName('');
      await loadCategories();
    } catch (error) {
      console.error('Update category error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to update category',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (category) => {
    confirmDialog({
      message: `Delete category "${category?.category_name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'btn-danger',
      accept: () => handleDelete(category),
    });
  };

  const handleDelete = async (category) => {
    if (!category?.category_id) {
      return;
    }

    try {
      setLoading(true);
      await categoryService.remove(category.category_id);
      toast.current?.show({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Category has been deleted.',
      });
      await loadCategories();
    } catch (error) {
      console.error('Delete category error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to delete category',
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
      <ConfirmDialog />

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
          className="categories-table categories-table-compact"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          paginatorTemplate="PrevPageLink PageLinks NextPageLink RowsPerPageDropdown"
        >
          <Column field="category_name" header="Category" sortable />
          <Column
            field="created_at"
            header="Created"
            body={(row) => formatDate(row?.created_at)}
            sortable
          />
          <Column
            header="Actions"
            body={(row) => (
              <div className="category-actions">
                <Button
                  icon="pi pi-pencil"
                  className="btn-secondary"
                  onClick={() => openEditDialog(row)}
                  disabled={loading}
                  tooltip="Edit"
                />
                <Button
                  icon="pi pi-trash"
                  className="btn-danger"
                  onClick={() => confirmDelete(row)}
                  disabled={loading}
                  tooltip="Delete"
                />
              </div>
            )}
          />
        </DataTable>
      </div>

      <Dialog
        header="Edit Category"
        visible={editDialogVisible}
        style={{ width: '420px' }}
        onHide={() => setEditDialogVisible(false)}
        className="categories-dialog"
      >
        <div className="categories-field">
          <label htmlFor="editCategoryName">Category Name</label>
          <InputText
            id="editCategoryName"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Renovation"
            disabled={loading}
          />
        </div>
        <div className="categories-dialog-actions">
          <Button
            label="Cancel"
            className="btn-secondary"
            onClick={() => setEditDialogVisible(false)}
            disabled={loading}
          />
          <Button
            label={loading ? 'Saving...' : 'Save Changes'}
            className="btn-primary"
            onClick={handleUpdate}
            disabled={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default CategoriesPanel;
