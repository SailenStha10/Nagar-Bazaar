// Most roles map directly to a same-named dashboard route, but government
// officers use the civic-oversight "/government" area instead of "/officer",
// and customers land on the curated products feed instead of the stats page.
export const dashboardPathForRole = (role) => {
  if (role === 'officer') return '/government/dashboard';
  if (role === 'customer') return '/customer/products';
  return `/${role}/dashboard`;
};
