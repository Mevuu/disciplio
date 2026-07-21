// Shared layout for the legal pages.

import { legalStyles as styles } from './legalStyles';



export default function Legal({ title, updated, children }) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.brandRow}>
          <span style={styles.mark}>DISCIPLIO</span>
          <span style={styles.accentRule} />
        </div>
        <h1 style={styles.h1}>{title}</h1>
        <p style={styles.updated}>Last updated: {updated}</p>
        {children}
        <div style={styles.footer}>
          Disciplio, operated by Metin Vurmaz. Questions?{' '}
          <a style={styles.a} href="mailto:support@disciplio.app">
            support@disciplio.app
          </a>
        </div>
      </div>
    </div>
  );
}

