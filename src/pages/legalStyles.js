// Shared styles for the legal pages. Kept in its own file so Legal.jsx
// only exports a component (fast refresh requirement).

export const legalStyles = {
  page: {
    minHeight: '100vh',
    background: '#0A0C0E',
    color: '#E6EDE9',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '48px 20px 96px',
  },
  container: { maxWidth: 720, margin: '0 auto' },
  brandRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 },
  mark: {
    fontWeight: 800,
    letterSpacing: 6,
    fontSize: 15,
    color: '#F4F9F6',
  },
  accentRule: { width: 34, height: 2, background: '#34A578' },
  h1: { fontSize: 34, fontWeight: 800, margin: '0 0 8px', color: '#F4F9F6' },
  updated: { color: '#8FA79B', fontSize: 14, margin: '0 0 40px' },
  h2: {
    fontSize: 20,
    fontWeight: 700,
    margin: '36px 0 12px',
    color: '#F4F9F6',
  },
  p: { fontSize: 16, lineHeight: 1.7, color: '#C6D2CC', margin: '0 0 14px' },
  li: { fontSize: 16, lineHeight: 1.7, color: '#C6D2CC', margin: '0 0 8px' },
  a: { color: '#46C793', textDecoration: 'none' },
  footer: {
    marginTop: 56,
    paddingTop: 24,
    borderTop: '1px solid #222927',
    color: '#5E6E66',
    fontSize: 14,
  },
};
