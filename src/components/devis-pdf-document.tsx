'use client';

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type { DevisFormData } from './devis-types.js';
import { computeDevisTotals } from './devis-types.js';

function getSmartAnchor(signerEmail: string): string {
  return `{{ ${signerEmail} | signature | 180 | 60 }}`;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metaBlock: {
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
  },
  clientBlock: {
    marginBottom: 20,
  },
  table: {
    marginTop: 16,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  colDesc: { width: '40%' },
  colQty: { width: '15%', textAlign: 'right' },
  colUnit: { width: '22%', textAlign: 'right' },
  colAmount: { width: '23%', textAlign: 'right' },
  totals: {
    marginLeft: 'auto',
    width: '35%',
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {},
  totalValue: {
    fontWeight: 'bold',
  },
  anchorContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 20,
    marginBottom: 20,
  },
  signatureLabel: {
    fontSize: 10,
    marginRight: 4,
  },
  anchorText: {
    color: 'white',
    fontSize: 8,
  },
});

type DevisPdfDocumentProps = {
  data: DevisFormData;
};

export function DevisPdfDocument({ data }: DevisPdfDocumentProps) {
  const { subtotal, taxAmount, total } = computeDevisTotals(data);

  return (
    <Document title="Quote">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Quote</Text>
        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Quote no.</Text>
            <Text>{data.quoteNumber}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Date</Text>
            <Text>{data.quoteDate}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Valid until</Text>
            <Text>{data.validityDate}</Text>
          </View>
        </View>

        <View style={styles.clientBlock}>
          <Text style={styles.label}>Client</Text>
          <Text>{data.clientName}</Text>
          {data.company ? <Text>{data.company}</Text> : null}
          {data.address ? <Text>{data.address}</Text> : null}
          <Text>{data.signerEmail}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit price</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {data.lineItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>
                {formatEuro(item.unitPrice)}
              </Text>
              <Text style={styles.colAmount}>{formatEuro(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatEuro(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              VAT ({data.taxRatePercent}%)
            </Text>
            <Text style={styles.totalValue}>{formatEuro(taxAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatEuro(total)}</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.anchorContainer}>
          <Text style={styles.signatureLabel}>Signature: </Text>
          <Text style={styles.anchorText}>{getSmartAnchor(data.signerEmail)}</Text>
        </View>
      </Page>
    </Document>
  );
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
