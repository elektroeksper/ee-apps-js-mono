import { useCreateCategory } from '@/hooks/useCategoryQueries'
import { ICategory } from '@/shared'
import { useState } from 'react'
import { FiLoader, FiPlus, FiSave, FiX } from 'react-icons/fi'

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
  parentCategory?: ICategory | null // If provided, creates a subcategory
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onCreated,
  parentCategory,
}: CreateCategoryModalProps) {
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [nameError, setNameError] = useState('')

  const createCategory = useCreateCategory()

  const isCreatingSubCategory = !!parentCategory

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

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

    if (!validateForm()) return

    setIsCreating(true)
    try {
      const newCategory: ICategory = {
        name: name.trim(),
        slug: generateSlug(name),
        isActive,
        parentCategoryId: parentCategory?.id || undefined,
      }

      const result = await createCategory.mutateAsync(newCategory)

      if (result.success) {
        onCreated?.()
        handleClose()
      }
    } catch (error) {
      console.error('Creation failed:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setName('')
      setIsActive(true)
      setNameError('')
      onClose()
    }
  }

  if (!isOpen) return null

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
              <div
                className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  isCreatingSubCategory ? 'bg-indigo-100' : 'bg-green-100'
                } sm:mx-0 sm:h-10 sm:w-10`}
              >
                <FiPlus
                  className={`h-6 w-6 ${
                    isCreatingSubCategory ? 'text-indigo-600' : 'text-green-600'
                  }`}
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isCreatingSubCategory
                    ? 'Yeni Alt Kategori'
                    : 'Yeni Ana Kategori'}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    {isCreatingSubCategory
                      ? `"${parentCategory?.name}" ana kategorisi için yeni bir alt kategori oluşturun.`
                      : 'Yeni bir ana kategori oluşturun.'}
                  </p>

                  {/* Parent Category Display */}
                  {isCreatingSubCategory && (
                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-indigo-400 rounded-full mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-indigo-800 font-medium">
                            Ana Kategori: {parentCategory?.name}
                          </p>
                          <p className="text-sm text-indigo-700">
                            Bu alt kategori "{parentCategory?.name}"
                            kategorisinin altında oluşturulacak.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category Name Field */}
                  <div className="mb-4">
                    <label
                      htmlFor="categoryName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {isCreatingSubCategory
                        ? 'Alt Kategori Adı'
                        : 'Ana Kategori Adı'}
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
                      placeholder={
                        isCreatingSubCategory
                          ? 'Alt kategori adını girin'
                          : 'Ana kategori adını girin'
                      }
                      disabled={isCreating}
                      autoFocus
                    />
                    {nameError && (
                      <p className="mt-1 text-sm text-red-600">{nameError}</p>
                    )}
                  </div>

                  {/* Active Status Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlangıç Durumu
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          checked={isActive === true}
                          onChange={() => setIsActive(true)}
                          disabled={
                            isCreating ||
                            (isCreatingSubCategory && !parentCategory?.isActive)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span
                          className={`ml-2 text-sm ${
                            isCreatingSubCategory && !parentCategory?.isActive
                              ? 'text-gray-400'
                              : 'text-gray-700'
                          }`}
                        >
                          Aktif
                          {isCreatingSubCategory &&
                            !parentCategory?.isActive &&
                            ' (Ana kategori aktif değil)'}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          checked={isActive === false}
                          onChange={() => setIsActive(false)}
                          disabled={isCreating}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Pasif
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Warning for subcategory with inactive parent */}
                  {isCreatingSubCategory && !parentCategory?.isActive && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="h-4 w-4 bg-yellow-400 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">
                            Dikkat!
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Ana kategori "{parentCategory?.name}" aktif olmadığı
                            için bu alt kategori pasif olarak oluşturulacak. Alt
                            kategoriler yalnızca ana kategorileri aktifken aktif
                            olabilir.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                disabled={isCreating}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isCreating}
                className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCreatingSubCategory
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {isCreating ? (
                  <>
                    <FiLoader className="animate-spin h-4 w-4 mr-2" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FiSave className="h-4 w-4 mr-2" />
                    Oluştur
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
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
