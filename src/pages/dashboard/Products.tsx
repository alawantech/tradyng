import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter, Package, X, Upload, Loader } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductService, Product } from '../../services/product';
import { BusinessService } from '../../services/business';
import { ImageUploadService } from '../../services/imageUpload';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import toast from 'react-hot-toast';

export const Products: React.FC = () => {
  const { user, business, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    sku: ''
  });
  const [creating, setCreating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {    
    if (authLoading) {
      return;
    }
    
    if (business?.id) {
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [business, authLoading]);

  const loadProducts = async () => {
    if (!business?.id) {
      return;
    }
    
    try {
      setLoading(true);
      const businessProducts = await ProductService.getProductsByBusinessId(business.id);
      setProducts(businessProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultBusiness = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const businessData = {
        name: `${user.displayName || 'Your'} Store`,
        subdomain: `store-${Date.now()}`, // Generate a unique subdomain
        ownerId: user.uid,
        email: user.email || '',
        plan: 'free' as const,
        status: 'active' as const,
        settings: {
          currency: DEFAULT_CURRENCY,
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          enableNotifications: true
        },
        revenue: 0,
        totalOrders: 0,
        totalProducts: 0
      };

      await BusinessService.createBusiness(businessData);
      toast.success('Business created successfully!');
      
      // Force re-fetch of auth data
      window.location.reload();
    } catch (error) {
      console.error('Error creating business:', error);
      toast.error('Failed to create business');
    }
  };

  const debugBusinessQuery = async () => {
    if (!user) {
      return;
    }
    
    try {
      const businesses = await BusinessService.getBusinessesByOwnerId(user.uid);
      toast.success(`Found ${businesses.length} businesses`);
    } catch (error) {
      console.error('Debug query error:', error);
      toast.error('Debug query failed - check console');
    }
  };

  const handleAddProduct = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      sku: ''
    });
    setImageFiles([]);
    setImagePreviewUrls([]);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      const validation = ImageUploadService.validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    // Validate form
    if (!productForm.name.trim() || !productForm.price.trim()) {
      toast.error('Please fill in required fields (name and price)');
      return;
    }

    const price = parseFloat(productForm.price);
    const stock = parseInt(productForm.stock) || 0;

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (stock < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    try {
      setCreating(true);

      let imageUrls: string[] = [];
      
      // Upload images if any
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        toast.loading('Uploading images...', { id: 'upload-images' });
        
        try {
          imageUrls = await ImageUploadService.uploadMultipleImages(
            imageFiles, 
            `businesses/${business.id}/products`
          );
          toast.success('Images uploaded successfully!', { id: 'upload-images' });
        } catch (uploadError) {
          toast.error('Failed to upload images', { id: 'upload-images' });
          throw uploadError;
        } finally {
          setUploadingImages(false);
        }
      }

      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: price,
        stock: stock,
        category: productForm.category.trim() || 'Uncategorized',
        sku: productForm.sku.trim() || '',
        images: imageUrls,
        tags: [],
        isActive: true
      };

      await ProductService.createProduct(business.id, productData);
      toast.success('Product created successfully!');
      handleCloseModal();
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  const handleEditProduct = (productId: string) => {
    toast.success(`Edit product ${productId} modal would open here`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!business?.id) return;
    
    try {
      await ProductService.deleteProduct(business.id, productId);
      toast.success('Product deleted successfully');
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">
            {authLoading ? 'Loading authentication...' : 'Loading products...'}
          </div>
        </div>
      </div>
    );
  }

  // If no business is found, show a message
  if (!business) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Found</h3>
            <p className="text-gray-500 mb-6">
              It seems your business profile wasn't created properly during signup.<br />
              Click below to create your business profile now.
            </p>
            <div className="space-y-3">
              <Button onClick={createDefaultBusiness}>
                Create Business Profile
              </Button>
              <br />
              <Button onClick={debugBusinessQuery} variant="outline" size="sm">
                Debug Query
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Start building your catalog by adding your first product
            </p>
            <Button onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(product.price, business?.settings?.currency || DEFAULT_CURRENCY)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {product.stock} in stock
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditProduct(product.id!)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProduct(product.id!)}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <Input
                    name="name"
                    value={productForm.name}
                    onChange={handleFormChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <Input
                    name="stock"
                    type="number"
                    value={productForm.stock}
                    onChange={handleFormChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Input
                    name="category"
                    value={productForm.category}
                    onChange={handleFormChange}
                    placeholder="e.g. Electronics, Clothing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Optional)
                  </label>
                  <Input
                    name="sku"
                    value={productForm.sku}
                    onChange={handleFormChange}
                    placeholder="Product SKU"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleFormChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                
                {/* File Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload up to 5 images (JPEG, PNG, WebP, max 5MB each)
                  </p>
                </div>

                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                {imagePreviewUrls.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Click "Choose Files" above to upload images</p>
                    <p className="text-sm text-gray-400">or drag and drop images here (feature coming soon)</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={creating || uploadingImages}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || uploadingImages}
                >
                  {uploadingImages ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading Images...
                    </>
                  ) : creating ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};