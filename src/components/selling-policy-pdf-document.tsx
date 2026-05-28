"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 9,
        fontFamily: "Helvetica",
        lineHeight: 1.5,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 4,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 9,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#222",
    },
    body: {
        color: "#444",
    },
    divider: {
        borderTopWidth: 1,
        borderTopColor: "#ccc",
        marginTop: 16,
        marginBottom: 16,
    },
    signatureBlock: {
        marginTop: 8,
    },
    signatureStatement: {
        fontSize: 9,
        fontStyle: "italic",
        color: "#333",
        marginBottom: 16,
    },
    signatureRow: {
        flexDirection: "row",
        gap: 40,
    },
    signatureField: {
        flex: 1,
    },
    signatureLabel: {
        fontSize: 8,
        color: "#666",
        marginBottom: 4,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: "#333",
        height: 32,
        marginBottom: 4,
    },
    signatureHint: {
        fontSize: 7,
        color: "#999",
    },
});

export function SellingPolicyPdfDocument() {
    const today = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

    return (
        <Document title="General Terms and Conditions of Sale">
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>GENERAL TERMS AND CONDITIONS OF SALE</Text>
                <Text style={styles.subtitle}>Version effective as of {today}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Scope and Acceptance</Text>
                    <Text style={styles.body}>
                        These General Terms and Conditions of Sale (“Terms”) govern all sales, services, and deliverables
                        provided by the Seller to the Client. By accepting a quote or placing an order, the Client agrees
                        to be bound by these Terms in their entirety. Any derogation must be expressly agreed in writing
                        by both parties prior to the start of services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Pricing and Payment</Text>
                    <Text style={styles.body}>
                        All prices are stated exclusive of applicable taxes (VAT) unless otherwise specified. Invoices are
                        payable within thirty (30) days from the invoice date. Late payments will incur interest at the
                        statutory rate plus five percentage points per annum, calculated from the due date until full
                        settlement. The Seller reserves the right to suspend services in the event of non-payment.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Delivery and Performance</Text>
                    <Text style={styles.body}>
                        Delivery timelines stated in the quote are indicative only and shall not give rise to penalties
                        unless expressly stipulated. The Seller shall not be liable for delays caused by circumstances
                        beyond its reasonable control, including but not limited to force majeure events, supply chain
                        disruptions, or delays caused by the Client’s failure to provide required information or approvals
                        in a timely manner.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Returns and Cancellation</Text>
                    <Text style={styles.body}>
                        Orders for bespoke services or custom deliverables may not be cancelled once production has
                        commenced without the written consent of the Seller. In the event of an agreed cancellation, the
                        Client shall reimburse all costs incurred up to the date of cancellation. Standard product returns
                        are accepted within fourteen (14) days of delivery, provided items are unused and in original
                        condition.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
                    <Text style={styles.body}>
                        All intellectual property rights in deliverables created by the Seller remain vested in the Seller
                        until full payment is received. Upon receipt of full payment, the Seller grants the Client a
                        non-exclusive, non-transferable licence to use the deliverables for the purposes described in the
                        quote. The Seller retains the right to use anonymised work samples for portfolio purposes.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
                    <Text style={styles.body}>
                        The Seller’s total aggregate liability to the Client for any claim arising out of or in connection
                        with these Terms shall not exceed the total fees paid by the Client in the twelve (12) months
                        preceding the claim. The Seller shall not be liable for any indirect, incidental, consequential,
                        or special damages, including loss of profits or loss of data, however arising.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Governing Law and Dispute Resolution</Text>
                    <Text style={styles.body}>
                        These Terms are governed by and construed in accordance with applicable law. Any disputes arising
                        from or in connection with these Terms shall first be subject to good-faith negotiation. If
                        unresolved within thirty (30) days, disputes shall be submitted to the competent courts of the
                        Seller’s registered place of business.
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureStatement}>
                        By signing below, the Client confirms having read and accepted these General Terms and Conditions
                        of Sale in full, without reservation.
                    </Text>
                    <View style={styles.signatureRow}>
                        <View style={styles.signatureField}>
                            <Text style={styles.signatureLabel}>Client signature</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureHint}>Sign here</Text>
                        </View>
                        <View style={styles.signatureField}>
                            <Text style={styles.signatureLabel}>Date</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureHint}>DD / MM / YYYY</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
