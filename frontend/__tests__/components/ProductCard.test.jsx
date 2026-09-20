import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from '@/components/ProductCard';

const baseProduct = {
  _id: 'prod-1',
  name: 'Basmati Rice',
  price: 450,
  ratings: 4.5,
  stock: 20,
  isLocal: false,
  seller: { shopName: 'Kathmandu Fresh Mart' },
};

describe('ProductCard', () => {
  it('renders the product name, seller, price, and rating', () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText('Basmati Rice')).toBeInTheDocument();
    expect(screen.getByText('Kathmandu Fresh Mart')).toBeInTheDocument();
    expect(screen.getByText('NPR 450')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('shows "New" when the product has no ratings yet', () => {
    render(<ProductCard product={{ ...baseProduct, ratings: 0 }} />);

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('omits the seller line when no seller is provided', () => {
    render(<ProductCard product={{ ...baseProduct, seller: undefined }} />);

    expect(screen.queryByText('Kathmandu Fresh Mart')).not.toBeInTheDocument();
  });

  it('shows the Local badge only when isLocal is true', () => {
    const { rerender } = render(<ProductCard product={baseProduct} />);
    expect(screen.queryByText('Local')).not.toBeInTheDocument();

    rerender(<ProductCard product={{ ...baseProduct, isLocal: true }} />);
    expect(screen.getByText('Local')).toBeInTheDocument();
  });

  it('shows "Out of stock" and disables Add to Cart when stock is 0', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 0 }} />);

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('shows "Low stock" when stock is low but not zero', () => {
    render(<ProductCard product={{ ...baseProduct, stock: 3 }} />);

    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('calls onAddToCart with the product when clicked', async () => {
    const user = userEvent.setup();
    const handleAddToCart = jest.fn();
    render(<ProductCard product={baseProduct} onAddToCart={handleAddToCart} />);

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(handleAddToCart).toHaveBeenCalledWith(baseProduct);
  });

  it('does not throw when onAddToCart is not provided', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={baseProduct} />);

    await expect(user.click(screen.getByRole('button', { name: /add to cart/i }))).resolves.not.toThrow();
  });

  it('links to the product detail page', () => {
    render(<ProductCard product={baseProduct} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/products/prod-1');
  });
});
