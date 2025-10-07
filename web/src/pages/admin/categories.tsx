'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import CreateCategoryModal from '@/components/admin/CreateCategoryModal'
import DeleteCategoryModal from '@/components/admin/DeleteCategoryModal'
import UpdateCategoryModal from '@/components/admin/UpdateCategoryModal'
import { AuthGuard } from '@/components/auth'
import { useMainCategories, useSubCategories } from '@/hooks/useCategoryQueries'
import { ICategory } from '@/shared'
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import {
  FiAlertTriangle,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiFolder,
  FiGrid,
  FiLoader,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi'

export default function CategoryManagementPage() {
  console.log(
    '🏷️ CategoryManagementPage: Component rendering - TESTING INNER COMPONENT'
  )

  return (
    <AuthGuard
      requireAuth={false}
      requireAdmin={false}
      requireEmailVerification={false}
    >
      <AdminLayout title="Kategori Yönetimi">
        {(() => {
          console.log('🏷️ About to render CategoryManagementContent')
          return <CategoryManagementContent />
        })()}
      </AdminLayout>
    </AuthGuard>
  )
}

function CategoryManagementContent() {
  console.log('🏷️ CategoryManagementContent: Component rendering')

  const [selectedMainCategory, setSelectedMainCategory] =
    useState<ICategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(
    null
  )
  const [categoryToUpdate, setCategoryToUpdate] = useState<ICategory | null>(
    null
  )
  const [showCreateMainModal, setShowCreateMainModal] = useState(false)
  const [showCreateSubModal, setShowCreateSubModal] = useState(false)

  // Fetch main categories
  const {
    data: mainCategoriesResult,
    isLoading: mainCategoriesLoading,
    error: mainCategoriesError,
  } = useMainCategories()

  // Fetch subcategories when a main category is selected
  const {
    data: subCategoriesResult,
    isLoading: subCategoriesLoading,
    error: subCategoriesError,
  } = useSubCategories(selectedMainCategory?.id || null)

  const mainCategories = mainCategoriesResult?.success
    ? mainCategoriesResult.data || []
    : []
  const subCategories = subCategoriesResult?.success
    ? subCategoriesResult.data || []
    : []

  console.log('🏷️ CategoryManagementContent: Data state', {
    mainCategoriesLoading,
    mainCategoriesError,
    mainCategoriesResult,
    mainCategories: mainCategories?.length || 0,
    subCategoriesLoading,
    subCategoriesError,
    selectedMainCategory: selectedMainCategory?.name,
    subCategories: subCategories?.length || 0,
  })

  return (
    <div className="pr-6 pb-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Kategori Yönetimi
                </h1>
                <p className="text-slate-600">
                  Ana kategorileri ve alt kategorileri yönetin
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateMainModal(true)}
                  className="inline-flex items-center px-3 md:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium shadow-md transform transition-all hover:scale-105 text-sm md:text-base"
                >
                  <FiPlus className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Yeni Ana Kategori</span>
                  <span className="sm:hidden">Ana Kategori</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 min-h-[500px] md:min-h-[600px] max-h-[600px] md:max-h-[700px]">
          {/* Left Panel - Main Categories */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <FiFolder className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Ana Kategoriler
                    </h2>
                    <p className="text-sm text-slate-600">
                      Tüm ana kategoriler
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Main Categories List */}
              {mainCategoriesLoading ? (
                <div className="text-center py-12 animate-pulse">
                  <div className="mx-auto h-12 w-12 text-blue-500 mb-4">
                    <FiLoader className="h-full w-full animate-spin" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    Ana kategoriler yükleniyor...
                  </h3>
                </div>
              ) : mainCategoriesError ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-red-500">
                    <FiAlertTriangle className="h-full w-full" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-red-900">
                    Hata oluştu
                  </h3>
                  <p className="mt-2 text-sm text-red-600">
                    Ana kategoriler yüklenirken bir hata oluştu.
                  </p>
                </div>
              ) : mainCategories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 text-slate-300">
                    <FiFolder className="h-full w-full" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    Ana kategori bulunamadı
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Henüz ana kategori oluşturulmamış. İlk ana kategoriyi
                    oluşturun.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  {mainCategories.map((category, index) => (
                    <div
                      key={category.id}
                      onClick={() => setSelectedMainCategory(category)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 animate-in slide-in-from-left-5 ${
                        selectedMainCategory?.id === category.id
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-lg ring-2 ring-blue-200'
                          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              category.isActive
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <FiFolder className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">
                              {category.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  category.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {category.isActive ? (
                                  <>
                                    <FiEye className="h-3 w-3 mr-1" />
                                    Aktif
                                  </>
                                ) : (
                                  <>
                                    <FiEyeOff className="h-3 w-3 mr-1" />
                                    Pasif
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setCategoryToUpdate(category)
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setCategoryToDelete(category)
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Subcategories */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <FiGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Alt Kategoriler
                    </h2>
                    <p className="text-sm text-slate-600">
                      {selectedMainCategory
                        ? `"${selectedMainCategory.name}" kategorisinin alt kategorileri`
                        : 'Ana kategori seçin'}
                    </p>
                  </div>
                </div>
                {selectedMainCategory && (
                  <button
                    onClick={() => setShowCreateSubModal(true)}
                    className="inline-flex items-center px-3 md:px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transform transition-all hover:scale-105 text-sm md:text-base"
                  >
                    <FiPlus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Alt Kategori Ekle</span>
                    <span className="sm:hidden">Alt Kategori</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!selectedMainCategory ? (
                /* Empty state when no main category selected */
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 text-slate-300">
                    <FiGrid className="h-full w-full" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    Ana kategori seçin
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Sol panelden bir ana kategori seçerek alt kategorilerini
                    görüntüleyin.
                  </p>
                </div>
              ) : subCategoriesLoading ? (
                <div className="text-center py-12 animate-pulse">
                  <div className="mx-auto h-12 w-12 text-indigo-500 mb-4">
                    <FiLoader className="h-full w-full animate-spin" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    Alt kategoriler yükleniyor...
                  </h3>
                </div>
              ) : subCategoriesError ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-red-500">
                    <FiAlertTriangle className="h-full w-full" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-red-900">
                    Hata oluştu
                  </h3>
                  <p className="mt-2 text-sm text-red-600">
                    Alt kategoriler yüklenirken bir hata oluştu.
                  </p>
                </div>
              ) : subCategories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 text-slate-300">
                    <FiGrid className="h-full w-full" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    Alt kategori bulunamadı
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    "{selectedMainCategory.name}" kategorisinde henüz alt
                    kategori yok.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  {subCategories.map((category, index) => (
                    <div
                      key={category.id}
                      className="p-4 rounded-xl border bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:bg-slate-50 animate-in slide-in-from-right-5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              category.isActive
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <FiGrid className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">
                              {category.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  category.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {category.isActive ? (
                                  <>
                                    <FiEye className="h-3 w-3 mr-1" />
                                    Aktif
                                  </>
                                ) : (
                                  <>
                                    <FiEyeOff className="h-3 w-3 mr-1" />
                                    Pasif
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCategoryToUpdate(category)
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category)
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Category Modal */}
        <DeleteCategoryModal
          category={categoryToDelete}
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onDeleted={() => {
            // If the deleted category was selected, clear selection
            if (selectedMainCategory?.id === categoryToDelete?.id) {
              setSelectedMainCategory(null)
            }
            setCategoryToDelete(null)
          }}
        />

        {/* Update Category Modal */}
        <UpdateCategoryModal
          category={categoryToUpdate}
          isOpen={!!categoryToUpdate}
          onClose={() => setCategoryToUpdate(null)}
          onUpdated={() => {
            setCategoryToUpdate(null)
          }}
        />

        {/* Create Main Category Modal */}
        <CreateCategoryModal
          isOpen={showCreateMainModal}
          onClose={() => setShowCreateMainModal(false)}
          onCreated={() => {
            setShowCreateMainModal(false)
          }}
        />

        {/* Create Sub Category Modal */}
        <CreateCategoryModal
          isOpen={showCreateSubModal}
          onClose={() => setShowCreateSubModal(false)}
          onCreated={() => {
            setShowCreateSubModal(false)
          }}
          parentCategory={selectedMainCategory}
        />
      </div>
    </div>
  )
}

// Force server-side rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  }
}
