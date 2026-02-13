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
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      setCreateDialogVisible(false);
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

  const getFilteredCategories = () => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories.filter((category) => {
      if (category.category_name?.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="panel-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Title Section */}
      <div className="mb-6">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
          }}
        >
          <div>
            <h2 className="m-0">Categories</h2>
            <p className="text-color-secondary m-0">
              Manage project categories
            </p>
          </div>
          <div className="reports-search-box">
            <i className="pi pi-search"></i>
            <InputText
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="reports-search-input"
            />
            {searchQuery && (
              <i
                className="pi pi-times"
                style={{ color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
              ></i>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <h3 className="card-title">Categories</h3>
          <Button
            label="Add New Category"
            icon="pi pi-plus"
            severity="info"
            onClick={() => {
              setCategoryName('');
              setCreateDialogVisible(true);
            }}
            className="add-user-btn"
          />
        </div>

        <DataTable
          value={filteredCategories}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          tableStyle={{ minWidth: '50rem' }}
          emptyMessage={
            searchQuery
              ? 'No categories match your search.'
              : 'No categories found.'
          }
          responsiveLayout="scroll"
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  icon="pi pi-pencil"
                  className="p-button-rounded p-button-sm p-button-warning user-action-btn"
                  onClick={() => openEditDialog(row)}
                  tooltip="Edit"
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                  onClick={() => confirmDelete(row)}
                  tooltip="Delete"
                />
              </div>
            )}
          />
        </DataTable>
      </div>

      <Dialog
        visible={createDialogVisible}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Add New Category"
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setCreateDialogVisible(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#4A4A3A',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-3">
          <label htmlFor="categoryName">Category Name *</label>
          <InputText
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. Renovation"
            disabled={loading}
          />
        </div>
        <div className="flex justify-content-center mt-5">
          <Button
            label={loading ? 'Saving...' : 'Save Category'}
            onClick={handleCreate}
            loading={loading}
            className="modal-primary-btn"
          />
        </div>
      </Dialog>

      <Dialog
        visible={editDialogVisible}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Edit Category"
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setEditDialogVisible(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#4A4A3A',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-3">
          <label htmlFor="editCategoryName">Category Name *</label>
          <InputText
            id="editCategoryName"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Renovation"
            disabled={loading}
          />
        </div>
        <div className="flex justify-content-center mt-5">
          <Button
            label={loading ? 'Saving...' : 'Save Changes'}
            onClick={handleUpdate}
            loading={loading}
            className="modal-primary-btn"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default CategoriesPanel;
