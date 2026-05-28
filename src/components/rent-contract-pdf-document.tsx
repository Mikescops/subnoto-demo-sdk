"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type RentContractData = {
    landlordName: string;
    landlordAddress: string;
    tenantName: string;
    tenantEmail: string;
    propertyAddress: string;
    propertyType: string;
    surface: string;
    startDate: string;
    monthlyRent: string;
    deposit: string;
};

// A4: 595 × 842 pt, padding 40 on all sides → content area 515 × 762 pt

function getSmartAnchor(signerEmail: string): string {
    return `{{ ${signerEmail} | signature | 180 | 50 }}`;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        lineHeight: 1.5,
        color: "#1a1a1a",
    },
    title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
    subtitle: { fontSize: 9, textAlign: "center", color: "#555", marginBottom: 24 },
    section: { marginBottom: 16 },
    sectionTitle: {
        fontSize: 10, fontWeight: "bold", textTransform: "uppercase",
        borderBottomWidth: 1, borderBottomColor: "#ccc",
        paddingBottom: 3, marginBottom: 8, letterSpacing: 0.5,
    },
    row: { flexDirection: "row", marginBottom: 4 },
    label: { width: "35%", color: "#555", fontSize: 9 },
    value: { flex: 1, fontSize: 10 },
    clause: { marginBottom: 8, fontSize: 9, color: "#333" },
    clauseTitle: { fontWeight: "bold", marginBottom: 2 },
    divider: { borderTopWidth: 1, borderTopColor: "#e0e0e0", marginVertical: 14 },

    // Signature / input section
    inputRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 },
    inputLabel: { width: "38%", fontSize: 9, color: "#555" },
    inputBox: {
        flex: 1, borderWidth: 1, borderColor: "#bbb", borderRadius: 2,
        height: 22, backgroundColor: "#f9f9f9",
    },
    checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    checkBox: {
        width: 14, height: 14, borderWidth: 1, borderColor: "#bbb",
        borderRadius: 2, marginRight: 8, backgroundColor: "#f9f9f9",
    },
    checkLabel: { flex: 1, fontSize: 9, color: "#333" },

    signaturesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    signatureBlock: { width: "45%" },
    signatureLabel: { fontSize: 9, color: "#555", marginBottom: 4 },
    signatureLine: { borderBottomWidth: 1, borderBottomColor: "#999", marginTop: 32, marginBottom: 4 },
    signatureName: { fontSize: 8, color: "#555", textAlign: "center" },
    anchorText: { color: "white", fontSize: 8 },

});

type Props = { data: RentContractData };

export function RentContractPdfDocument({ data }: Props) {
    return (
        <Document title="Residential Rental Agreement">
            {/* ── PAGE 1 ── Contract terms + tenant acknowledgements ── */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Residential Rental Agreement</Text>
                <Text style={styles.subtitle}>Fixed-term tenancy — for demonstration purposes only</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Parties</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Landlord</Text>
                        <Text style={styles.value}>{data.landlordName || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Landlord address</Text>
                        <Text style={styles.value}>{data.landlordAddress || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tenant</Text>
                        <Text style={styles.value}>{data.tenantName || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tenant email</Text>
                        <Text style={styles.value}>{data.tenantEmail || "—"}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Property</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Address</Text>
                        <Text style={styles.value}>{data.propertyAddress || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Type</Text>
                        <Text style={styles.value}>{data.propertyType || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Surface area</Text>
                        <Text style={styles.value}>{data.surface ? `${data.surface} m²` : "—"}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Terms</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lease start</Text>
                        <Text style={styles.value}>{data.startDate || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Monthly rent</Text>
                        <Text style={styles.value}>{data.monthlyRent ? `€${data.monthlyRent}` : "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Security deposit</Text>
                        <Text style={styles.value}>{data.deposit ? `€${data.deposit}` : "—"}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General Conditions</Text>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>1. Duration</Text>
                        <Text>
                            This agreement is entered into for a fixed term of twelve (12) months commencing on the
                            start date above and shall automatically renew for successive one-year periods unless either
                            party gives three (3) months written notice of termination.
                        </Text>
                    </View>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>2. Rent payment</Text>
                        <Text>
                            Rent is due and payable on the first day of each calendar month. Late payment beyond five
                            (5) days may incur a penalty of 10% of the monthly rent amount.
                        </Text>
                    </View>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>3. Security deposit</Text>
                        <Text>
                            The security deposit shall be held. It will be returned within thirty (30) days of
                            vacating, less any justified deductions.
                        </Text>
                    </View>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>4. Maintenance</Text>
                        <Text>
                            Minor repairs up to €150 are the tenant's responsibility. The landlord shall handle
                            structural and major appliance repairs in a timely manner.
                        </Text>
                    </View>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>5. Sub-letting</Text>
                        <Text>
                            Sub-letting is strictly prohibited without prior written consent from the landlord.
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/*
                 * ── TENANT ACKNOWLEDGEMENT (interactive blocks go here) ──
                 *
                 * Block placement coordinates are relative to the page (0,0 = top-left).
                 * Page padding = 40pt on all sides. Content width = 515pt.
                 *
                 * Row layout: label at x=40 (width ~195pt), input box at x=240 (width ~315pt)
                 *
                 * Rows top-to-bottom (approximate y from top of page):
                 *   Confirmed name   textInput   y ≈ 598  h=22
                 *   Move-in date     date        y ≈ 634  h=22
                 *   □ I have read    checkbox    y ≈ 670  w=14 h=14
                 *   □ No pets        checkbox    y ≈ 692  w=14 h=14
                 *   Signature        signature   y ≈ 726  (Smart Anchor)
                 */}
                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Tenant Acknowledgement</Text>

                {/* textInput — confirmed full name (y ≈ 598) */}
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Confirm your full name</Text>
                    <View style={styles.inputBox} />
                </View>

                {/* date — actual move-in date (y ≈ 634) */}
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Actual move-in date</Text>
                    <View style={styles.inputBox} />
                </View>

                {/* checkbox — read & agreed (y ≈ 670) */}
                <View style={styles.checkRow}>
                    <View style={styles.checkBox} />
                    <Text style={styles.checkLabel}>I confirm I have read and understood all clauses above.</Text>
                </View>

                <View style={styles.divider} />

                {/* Signatures row — Smart Anchor positions tenant sig at y ≈ 760 */}
                <View style={styles.signaturesRow}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Landlord signature</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>{data.landlordName || "Landlord"}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Tenant signature</Text>
                        <Text style={styles.anchorText}>{getSmartAnchor(data.tenantEmail)}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>{data.tenantName || "Tenant"}</Text>
                    </View>
                </View>
            </Page>

        </Document>
    );
}
