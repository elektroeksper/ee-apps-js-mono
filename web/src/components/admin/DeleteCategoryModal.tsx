import {
  useCheckHasSubCategories,
  useDeleteCategory,
} from '@/hooks/useCategoryQueries'
import { ICategory } from '@/shared'
import { useState } from 'react'
import { FiAlertTriangle, FiLoader, FiTrash2, FiX } from 'react-icons/fi'

interface DeleteCategoryModalProps {
  category: ICategory | null
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export default function DeleteCategoryModal({
  category,
  isOpen,
  onClose,
  onDeleted,
}: DeleteCategoryModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if category has subcategories
  const { data: hasSubCategoriesResult, isLoading: checkingSubCategories } =
    useCheckHasSubCategories(category?.id)

  const deleteCategory = useDeleteCategory()

  const hasSubCategories =
    hasSubCategoriesResult?.success && hasSubCategoriesResult.data

  const handleDelete = async () => {
    if (!category) return

    setIsDeleting(true)
    try {
      const result = await deleteCategory.mutateAsync(category.id!)
      if (result.success) {
        onDeleted?.()
        onClose()
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Kategori Sil
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">"{category.name}"</span>{' '}
                  kategorisini silmek istediğinizden emin misiniz?
                </p>

                {checkingSubCategories ? (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <FiLoader className="animate-spin h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        Alt kategoriler kontrol ediliyor...
                      </p>
                    </div>
                  </div>
                ) : hasSubCategories ? (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <FiAlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-800 font-medium">
                          Dikkat!
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          Bu kategori alt kategorilere sahip. Kategori
                          silindiğinde{' '}
                          <span className="font-medium">
                            tüm alt kategoriler de silinecektir
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="h-4 w-4 bg-green-400 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-800">
                        Bu kategorinin alt kategorisi yok. Güvenle silinebilir.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-3">
                  Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isDeleting || checkingSubCategories}
              onClick={handleDelete}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <FiLoader className="animate-spin h-4 w-4 mr-2" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <FiTrash2 className="h-4 w-4 mr-2" />
                  Sil
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
