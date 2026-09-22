// Renders the same complaints queue used by government officers, kept in
// the admin section (with the admin sidebar) instead of redirecting into
// /government/* — see app/government/complaints/page.js for the shared
// implementation, which derives its own links from the current path.
export { default } from '@/app/government/complaints/page';
