/**
 * Address Filter Component
 * Provides hierarchical address filtering for dealer search
 */

import { BUSINESS_CATEGORIES } from '@/config/maps'
import { AddressComponent, IAddressComponentItem } from '@/types/maps'
import React, { useCallback, useEffect, useState } from 'react'

interface AddressFilterProps {
  availableComponents: IAddressComponentItem[]
  selectedComponents: IAddressComponentItem[]
  onComponentsChange: (components: IAddressComponentItem[]) => void
  selectedCategoryId?: string
  onCategoryChange?: (categoryId: string | undefined) => void
  onlyCertified?: boolean
  onCertifiedChange?: (certified: boolean) => void
  className?: string
}

const AddressFilter: React.FC<AddressFilterProps> = ({
  availableComponents,
  selectedComponents,
  onComponentsChange,
  selectedCategoryId,
  onCategoryChange,
  onlyCertified = false,
  onCertifiedChange,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['address', 'category'])
  )

  // Component display names in Turkish
  const componentLabels: Record<keyof typeof AddressComponent, string> = {
    city: 'İl',
    district: 'İlçe',
    neighborhood: 'Mahalle',
    street: 'Sokak',
    streetNumber: 'Kapı No',
    postalCode: 'Posta Kodu',
    country: 'Ülke'
  }

  // Hierarchical order for components
  const componentOrder: (keyof typeof AddressComponent)[] = [
    'city',
    'district',
    'neighborhood',
    'street'
  ]

  // Get available components in hierarchical order
  const getOrderedComponents = useCallback(() => {
    return componentOrder
      .map(key => availableComponents.find(c => c.key === key))
      .filter(Boolean) as IAddressComponentItem[]
  }, [availableComponents])

  // Check if a component is selected
  const isComponentSelected = useCallback(
    (component: IAddressComponentItem) => {
      return selectedComponents.some(
        sc => sc.key === component.key && sc.value === component.value
      )
    },
    [selectedComponents]
  )

  // Handle component selection
  const handleComponentToggle = useCallback(
    (component: IAddressComponentItem) => {
      const isSelected = isComponentSelected(component)
      
      if (isSelected) {
        // Remove this component and all child components
        const componentIndex = componentOrder.indexOf(component.key)
        const newComponents = selectedComponents.filter(sc => {
          const scIndex = componentOrder.indexOf(sc.key)
          return scIndex < componentIndex
        })
        onComponentsChange(newComponents)
      } else {
        // Add this component
        const componentIndex = componentOrder.indexOf(component.key)
        
        // Keep only parent components and add the new one
        const newComponents = selectedComponents.filter(sc => {
          const scIndex = componentOrder.indexOf(sc.key)
          return scIndex < componentIndex
        })
        newComponents.push(component)
        onComponentsChange(newComponents)
      }
    },
    [selectedComponents, isComponentSelected, onComponentsChange]
  )

  // Check if a component level should be disabled
  const isComponentDisabled = useCallback(
    (component: IAddressComponentItem) => {
      const componentIndex = componentOrder.indexOf(component.key)
      
      // Check if parent component is selected
      if (componentIndex > 0) {
        const parentKey = componentOrder[componentIndex - 1]
        const hasParentSelected = selectedComponents.some(sc => sc.key === parentKey)
        return !hasParentSelected
      }
      
      return false
    },
    [selectedComponents]
  )

  // Toggle section expansion
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Clear all filters
  const clearAllFilters = () => {
    onComponentsChange([])
    if (onCategoryChange) onCategoryChange(undefined)
    if (onCertifiedChange) onCertifiedChange(false)
  }

  const hasActiveFilters = 
    selectedComponents.length > 0 || 
    selectedCategoryId || 
    onlyCertified

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Address Components Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('address')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900">Konum</span>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${
              expandedSections.has('address') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('address') && (
          <div className="px-4 pb-4">
            {getOrderedComponents().map((component, index) => {
              const isSelected = isComponentSelected(component)
              const isDisabled = isComponentDisabled(component)
              
              return (
                <div
                  key={`${component.key}-${component.value}`}
                  className={`ml-${index * 4}`}
                  style={{ marginLeft: `${index * 1}rem` }}
                >
                  <label
                    className={`flex items-center py-2 cursor-pointer ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isDisabled && handleComponentToggle(component)}
                      disabled={isDisabled}
                      className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">
                        {componentLabels[component.key]}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {component.value}
                      </span>
                    </div>
                  </label>
                </div>
              )
            })}
            
            {availableComponents.length === 0 && (
              <p className="text-sm text-gray-500 py-2">
                Konum bilgisi mevcut değil
              </p>
            )}
          </div>
        )}
      </div>

      {/* Category Filter */}
      {onCategoryChange && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('category')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Kategori</span>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                expandedSections.has('category') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.has('category') && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {BUSINESS_CATEGORIES.map(category => (
                  <label
                    key={category.id}
                    className="flex items-center py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategoryId === category.id}
                      onChange={() => onCategoryChange(
                        selectedCategoryId === category.id ? undefined : category.id
                      )}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-2xl mr-2">{category.icon}</span>
                    <span className="text-sm text-gray-700">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certified Dealer Filter */}
      {onCertifiedChange && (
        <div className="p-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCertified}
              onChange={(e) => onCertifiedChange(e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Sadece Yetkili Bayiler
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-3">
          <div className="flex flex-wrap gap-2">
            {selectedComponents.map(component => (
              <span
                key={`${component.key}-${component.value}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {componentLabels[component.key]}: {component.value}
                <button
                  onClick={() => handleComponentToggle(component)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
            
            {selectedCategoryId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {BUSINESS_CATEGORIES.find(c => c.id === selectedCategoryId)?.label}
                <button
                  onClick={() => onCategoryChange && onCategoryChange(undefined)}
                  className="ml-1 hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            
            {onlyCertified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Yetkili Bayiler
                <button
                  onClick={() => onCertifiedChange && onCertifiedChange(false)}
                  className="ml-1 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressFilter
