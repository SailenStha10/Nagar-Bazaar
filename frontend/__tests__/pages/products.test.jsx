import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductsPage from '@/app/products/page';
import api from '@/utils/api';

const pushMock = jest.fn();
const addToCartMock = jest.fn().mockResolvedValue();

jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({ user: null })),
}));

jest.mock('@/hooks/useCart', () => ({
  __esModule: true,
  default: () => ({ addToCart: addToCartMock }),
}));

const useAuthMock = require('@/hooks/useAuth').default;

const categoriesResponse = { data: { data: [{ _id: 'cat-1', name: 'Grocery', icon: '🛒' }] } };

const productsResponse = (products, overrides = {}) => ({
  data: {
    data: products,
    pagination: { page: 1, limit: 12, total: products.length, pages: 1, ...overrides },
  },
});

const sampleProduct = {
  _id: 'p1',
  name: 'Basmati Rice',
  price: 450,
  ratings: 4.5,
  stock: 20,
  seller: { shopName: 'Kathmandu Fresh Mart' },
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthMock.mockReturnValue({ user: null });
  api.get.mockImplementation((url) => {
    if (url === '/categories') return Promise.resolve(categoriesResponse);
    return Promise.resolve(productsResponse([sampleProduct]));
  });
});

describe('ProductsPage', () => {
  it('shows a loading state before products arrive', async () => {
    let resolveProducts;
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve(categoriesResponse);
      return new Promise((resolve) => {
        resolveProducts = () => resolve(productsResponse([sampleProduct]));
      });
    });

    render(<ProductsPage />);

    expect(screen.queryByText('Basmati Rice')).not.toBeInTheDocument();
    resolveProducts();
    await waitFor(() => expect(screen.getByText('Basmati Rice')).toBeInTheDocument());
  });

  it('loads and displays products from the API', async () => {
    render(<ProductsPage />);

    await waitFor(() => expect(screen.getByText('Basmati Rice')).toBeInTheDocument());
    expect(screen.getByText('Kathmandu Fresh Mart')).toBeInTheDocument();
    expect(screen.getByText('1 product found')).toBeInTheDocument();
  });

  it('shows an empty state when no products are returned', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve(categoriesResponse);
      return Promise.resolve(productsResponse([]));
    });

    render(<ProductsPage />);

    await waitFor(() => expect(screen.getByText('No products found')).toBeInTheDocument());
  });

  it('shows an error message when the API call fails', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve(categoriesResponse);
      return Promise.reject(new Error('network error'));
    });

    render(<ProductsPage />);

    await waitFor(() => expect(screen.getByText(/failed to load products/i)).toBeInTheDocument());
  });

  it('re-fetches with a search query after typing (debounced)', async () => {
    const user = userEvent.setup();
    render(<ProductsPage />);
    await waitFor(() => expect(screen.getByText('Basmati Rice')).toBeInTheDocument());

    api.get.mockClear();
    await user.type(screen.getByPlaceholderText(/search for products/i), 'rice');

    await waitFor(
      () =>
        expect(api.get).toHaveBeenCalledWith(
          '/products/search',
          expect.objectContaining({ params: expect.objectContaining({ q: 'rice' }) })
        ),
      { timeout: 2000 }
    );
  });

  it('re-fetches with a category filter when a category is selected', async () => {
    const user = userEvent.setup();
    render(<ProductsPage />);
    await waitFor(() => expect(screen.getByText('Basmati Rice')).toBeInTheDocument());

    api.get.mockClear();
    await user.selectOptions(screen.getByDisplayValue('All Categories'), 'cat-1');

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/products/search',
        expect.objectContaining({ params: expect.objectContaining({ category: 'cat-1' }) })
      )
    );
  });

  it('redirects to login when adding to cart while logged out', async () => {
    const user = userEvent.setup();
    render(<ProductsPage />);
    await waitFor(() => expect(screen.getByText('Basmati Rice')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(addToCartMock).not.toHaveBeenCalled();
  });

  it('adds to cart and shows a confirmation toast when logged in', async () => {
    useAuthMock.mockReturnValue({ user: { userId: '1', name: 'Sita', role: 'customer' } });

    const user = userEvent.setup();
    render(<ProductsPage />);
    await waitFor(() => expect(screen.getByText('Basmati Rice')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(addToCartMock).toHaveBeenCalledWith('p1', 1);
    await waitFor(() => expect(screen.getByText('Basmati Rice added to cart')).toBeInTheDocument());
  });
});
