import {
  useSubCategories,
  useUpdateCategory,
  useValidateSubCategoryActivation,
} from '@/hooks/useCategoryQueries'
import { ICategory } from '@/shared'
import { useEffect, useState } from 'react'
import { FiEdit2, FiLoader, FiSave, FiX } from 'react-icons/fi'

interface UpdateCategoryModalProps {
  category: ICategory | null
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => void
}

export default function UpdateCategoryModal({
  category,
  isOpen,
  onClose,
  onUpdated,
}: UpdateCategoryModalProps) {
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [nameError, setNameError] = useState('')

  const updateCategory = useUpdateCategory()

  // Check if category has subcategories (for parent-child logic)
  const { data: subCategoriesResult } = useSubCategories(category?.id || null)
  const hasSubCategories =
    subCategoriesResult?.success &&
    subCategoriesResult.data &&
    subCategoriesResult.data.length > 0

  // Validate subcategory activation
  const { data: validationResult } = useValidateSubCategoryActivation(
    category && !category.parentCategoryId ? undefined : category?.id
  )
  const canActivateSubCategory = validationResult?.success
    ? validationResult.data
    : null

  // Initialize form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name || '')
      setIsActive(category.isActive ?? true)
      setNameError('')
    }
  }, [category])

  const validateForm = () => {
    setNameError('')

    if (!name.trim()) {
      setNameError('Kategori adı gereklidir')
      return false
    }

    if (name.trim().length < 2) {
      setNameError('Kategori adı en az 2 karakter olmalıdır')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category || !validateForm()) return

    // Check if trying to activate a subcategory with inactive parent
    if (!isMainCategory && isActive && category.isActive === false) {
      if (canActivateSubCategory && !canActivateSubCategory.canActivate) {
        // This should be prevented by the UI, but adding extra safety
        return
      }
    }

    setIsUpdating(true)
    try {
      const updateData: Partial<ICategory> = {
        name: name.trim(),
        isActive,
      }

      const result = await updateCategory.mutateAsync({
        categoryId: category.id!,
        category: updateData,
      })

      if (result.success) {
        onUpdated?.()
        onClose()
      } else {
        // Handle error from the service (e.g., parent category validation failed)
        console.error('Update failed:', result.error)
      }
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (!isUpdating) {
      onClose()
    }
  }

  if (!isOpen || !category) return null

  const isMainCategory = !category.parentCategoryId

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiEdit2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Kategori Düzenle
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">"{category.name}"</span>{' '}
                    kategorisini düzenleyin.
                  </p>

                  {/* Category Name Field */}
                  <div className="mb-4">
                    <label
                      htmlFor="categoryName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Kategori Adı
                    </label>
                    <input
                      type="text"
                      id="categoryName"
                      value={name}
                      onChange={e => {
                        setName(e.target.value)
                        if (nameError) setNameError('')
                      }}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        nameError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Kategori adını girin"
                      disabled={isUpdating}
                    />
                    {nameError && (
                      <p className="mt-1 text-sm text-red-600">{nameError}</p>
                    )}
                  </div>

                  {/* Active Status Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          checked={isActive === true}
                          onChange={() => setIsActive(true)}
                          disabled={
                            isUpdating ||
                            (!isMainCategory &&
                              category.isActive === false &&
                              canActivateSubCategory?.canActivate === false)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span
                          className={`ml-2 text-sm ${
                            !isMainCategory &&
                            category.isActive === false &&
                            canActivateSubCategory?.canActivate === false
                              ? 'text-gray-400'
                              : 'text-gray-700'
                          }`}
                        >
                          Aktif
                          {!isMainCategory &&
                            category.isActive === false &&
                            canActivateSubCategory?.canActivate === false &&
                            ' (Ana kategori aktif değil)'}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          checked={isActive === false}
                          onChange={() => setIsActive(false)}
                          disabled={isUpdating}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Pasif
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Warning for parent categories with subcategories */}
                  {isMainCategory && hasSubCategories && !isActive && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="h-4 w-4 bg-yellow-400 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">
                            Dikkat!
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Bu ana kategoriyi pasif hale getirdiğinizde, tüm alt
                            kategorileri de otomatik olarak pasif hale
                            gelecektir.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning for subcategories with inactive parents */}
                  {!isMainCategory &&
                    isActive &&
                    category.isActive === false &&
                    (canActivateSubCategory &&
                    !canActivateSubCategory.canActivate ? (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="h-4 w-4 bg-red-400 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-red-800 font-medium">
                              Bu kategori aktif hale getirilemez!
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              Önce ana kategori "
                              {canActivateSubCategory.parentName}" aktif hale
                              getirilmelidir. Alt kategoriler yalnızca ana
                              kategorileri aktifken aktif hale getirilebilir.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      canActivateSubCategory?.canActivate && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <div className="h-4 w-4 bg-blue-400 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-blue-800 font-medium">
                                Alt kategori aktif hale getirilebilir
                              </p>
                              <p className="text-sm text-blue-700 mt-1">
                                Ana kategori "
                                {canActivateSubCategory.parentName}" aktif
                                durumda olduğu için bu alt kategori aktif hale
                                getirilebilir.
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                disabled={isUpdating}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <FiLoader className="animate-spin h-4 w-4 mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FiSave className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
