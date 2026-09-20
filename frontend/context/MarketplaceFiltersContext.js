'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const emptyFilters = { category: '', minPrice: '', maxPrice: '', inStockOnly: false };

const MarketplaceFiltersContext = createContext(null);

// Shared filter state for the customer marketplace. The controls render
// inside the persistent dashboard sidebar (see DashboardSidebar.jsx) instead
// of a separate aside on the products page, so both need the same state.
export function MarketplaceFiltersProvider({ children }) {
  const [active, setActive] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState('latest-desc');
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
    setSearchInput('');
  }, []);

  const hasActiveFilters = Boolean(
    filters.category || filters.minPrice || filters.maxPrice || filters.inStockOnly || searchInput
  );

  const value = useMemo(
    () => ({
      active,
      setActive,
      filters,
      updateFilter,
      clearFilters,
      hasActiveFilters,
      sort,
      setSort,
      categories,
      setCategories,
      searchInput,
      setSearchInput,
    }),
    [active, filters, updateFilter, clearFilters, hasActiveFilters, sort, categories, searchInput]
  );

  return <MarketplaceFiltersContext.Provider value={value}>{children}</MarketplaceFiltersContext.Provider>;
}

export default function useMarketplaceFilters() {
  return useContext(MarketplaceFiltersContext);
}
