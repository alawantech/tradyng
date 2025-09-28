import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import { CategoryService, Category } from '../../services/category';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  businessId: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  businessId,
  placeholder = "Select or create category",
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load categories when component mounts or businessId changes
  useEffect(() => {
    if (businessId) {
      loadCategories();
    }
  }, [businessId]);

  // Filter categories based on search
  useEffect(() => {
    if (!value) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categories, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewCategoryName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const fetchedCategories = await CategoryService.getCategoriesByBusinessId(businessId);
      
      // If no categories exist, initialize with defaults
      if (fetchedCategories.length === 0) {
        await CategoryService.initializeDefaultCategories(businessId);
        const defaultCategories = await CategoryService.getCategoriesByBusinessId(businessId);
        setCategories(defaultCategories);
      } else {
        setCategories(fetchedCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsLoading(true);
      await CategoryService.createCategory(businessId, newCategoryName);
      
      // Reload categories and select the new one
      await loadCategories();
      onChange(newCategoryName.trim());
      setIsCreating(false);
      setNewCategoryName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    onChange(categoryName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCreating && newCategoryName.trim()) {
        handleCreateCategory();
      } else if (filteredCategories.length === 1) {
        handleSelectCategory(filteredCategories[0].name);
      } else if (value.trim() && !categories.find(cat => cat.name.toLowerCase() === value.toLowerCase())) {
        // Create new category if entered value doesn't exist
        setNewCategoryName(value.trim());
        setIsCreating(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsCreating(false);
      setNewCategoryName('');
    }
  };

  const showCreateOption = value.trim() && 
    !categories.find(cat => cat.name.toLowerCase() === value.toLowerCase()) &&
    !isCreating;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="pr-10"
          onFocus={() => setIsOpen(true)}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Loading categories...
            </div>
          ) : (
            <>
              {/* Create New Category Mode */}
              {isCreating && (
                <div className="p-3 border-b bg-blue-50">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim() || isLoading}
                      className="px-3"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewCategoryName('');
                      }}
                      className="px-3"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Create New Category Option */}
              {showCreateOption && !isCreating && (
                <button
                  type="button"
                  onClick={() => {
                    setNewCategoryName(value.trim());
                    setIsCreating(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create "{value.trim()}"</span>
                </button>
              )}

              {/* Existing Categories */}
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelectCategory(category.name)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{category.name}</span>
                    {category.name === value && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : value.trim() && !showCreateOption ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No categories found matching "{value}"
                </div>
              ) : !value.trim() && categories.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No categories available. Start typing to create one.
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};