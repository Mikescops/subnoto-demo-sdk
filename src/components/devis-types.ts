export type DevisLineItem = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
};

export type DevisFormData = {
    quoteNumber: string;
    quoteDate: string;
    validityDate: string;
    clientName: string;
    company: string;
    address: string;
    signerEmail: string;
    lineItems: DevisLineItem[];
    taxRatePercent: number;
};

export function computeDevisTotals(data: DevisFormData): {
    subtotal: number;
    taxAmount: number;
    total: number;
} {
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * data.taxRatePercent) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
}
