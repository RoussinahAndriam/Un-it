"use client";

import React from "react";
import { Invoice, InvoiceLine } from "@/hooks/useInvoices";
import { formatCurrency } from "@/constants";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";

// Styles pour le PDF avec polices système
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: "#1e40af",
    paddingBottom: 20,
  },
  companyInfo: {
    flexDirection: "column",
    width: "50%",
  },
  invoiceInfo: {
    flexDirection: "column",
    alignItems: "flex-end",
    width: "40%",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  party: {
    width: "48%",
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 4,
  },
  partyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 10,
  },
  table: {
    marginTop: 20,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e40af",
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 10,
  },
  tableCell: {
    fontSize: 12,
    color: "#111827",
  },
  colDescription: {
    width: "30%",
  },
  colQuantity: {
    width: "15%",
    textAlign: "center",
  },
  colPrice: {
    width: "20%",
    textAlign: "right",
  },
  colTax: {
    width: "15%",
    textAlign: "center",
  },
  colTotal: {
    width: "20%",
    textAlign: "right",
  },
  headerText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
  },
  statusBadge: {
    backgroundColor: "#10b981",
    color: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "bold",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    fontSize: 48,
    color: "#f3f4f6",
    opacity: 0.3,
    transform: "rotate(-45deg)",
  },
  qrSection: {
    marginTop: 20,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 10,
  },
  qrText: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
});

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status: string) => {
  switch (status) {
    case "paye":
      return "#10b981";
    case "partiellement_paye":
      return "#f59e0b";
    case "en_retard":
      return "#ef4444";
    case "envoye":
      return "#3b82f6";
    case "brouillon":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

// Fonction pour formater le texte du statut
const formatStatus = (status: string) => {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Fonction pour générer le QR Code
const generateQRCode = async (invoice: Invoice): Promise<string> => {
  try {
    const qrData = `FACTURE
N°: ${invoice.invoice_number}
Montant: ${invoice.total_amount.toFixed(2)} €
Client: ${invoice.third_party?.name || "Non spécifié"}
Date: ${new Date(invoice.issue_date).toLocaleDateString("fr-FR")}
Référence: FACT-${invoice.invoice_number}`;

    // Utiliser l'API publique de QR Code Generator
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      qrData
    )}`;

    return qrCodeUrl;
  } catch (error) {
    console.error("Erreur lors de la génération du QR Code:", error);
    return "";
  }
};

// Composant QR Code
const QRCodeSection = ({ invoice }: { invoice: Invoice }) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");

  React.useEffect(() => {
    generateQRCode(invoice).then(setQrCodeUrl);
  }, [invoice]);

  if (!qrCodeUrl) return null;

  return (
    <View style={styles.qrSection}>
      <Text style={styles.qrTitle}>PAIEMENT PAR QR CODE</Text>
      <View style={{ padding: 10, backgroundColor: "white", marginBottom: 8 }}>
        <Image src={qrCodeUrl} style={{ width: 150, height: 150 }} />
      </View>
      <Text style={styles.qrText}>
        Scannez ce QR Code avec votre application bancaire
      </Text>
      <Text style={[styles.qrText, { fontSize: 8 }]}>
        Référence: FACT-{invoice.invoice_number}
      </Text>
    </View>
  );
};

// Fonctions de calcul pour chaque ligne
const calculateLineSubtotal = (line: InvoiceLine) => {
  const subtotal = line.quantity * line.unit_price;
  const discountAmount = subtotal * (line.discount / 100);
  return subtotal - discountAmount;
};

const calculateLineTax = (line: InvoiceLine) => {
  const afterDiscount = calculateLineSubtotal(line);
  return afterDiscount * (line.tax_rate / 100);
};

const calculateLineTotal = (line: InvoiceLine) => {
  return calculateLineSubtotal(line) + calculateLineTax(line);
};

// Composant principal PDF
const InvoicePDFDocument = ({ invoice }: { invoice: Invoice }) => {
  // Validation
  if (!invoice || !invoice.lines) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Erreur: Données de facture manquantes</Text>
        </Page>
      </Document>
    );
  }

  const currentDate = new Date().toLocaleDateString("fr-FR");
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("fr-FR")
    : "N/A";

  // Calcul des totaux
  const subtotalHT = invoice.lines.reduce(
    (sum, line) => sum + calculateLineSubtotal(line),
    0
  );
  const totalTax = invoice.lines.reduce(
    (sum, line) => sum + calculateLineTax(line),
    0
  );
  const totalTTC = subtotalHT + totalTax;
  const remainingBalance = totalTTC - (invoice.amount_paid || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark pour brouillons */}
        {invoice.status === "brouillon" && (
          <View style={styles.watermark}>
            <Text>BROUILLON</Text>
          </View>
        )}

        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.subtitle}>UN-IT</Text>
            <Text style={styles.value}>FIANARANTSOA</Text>
            <Text style={styles.value}>Antamponjina</Text>
            <Text style={styles.value}>UN-IT@entreprise.com</Text>
            <Text style={styles.value}>0388456158</Text>
          </View>

          <View style={styles.invoiceInfo}>
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>N° FACTURE</Text>
              <Text style={[styles.value, styles.bold]}>
                {invoice.invoice_number}
              </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>DATE D'ÉMISSION</Text>
              <Text style={styles.value}>
                {new Date(invoice.issue_date).toLocaleDateString("fr-FR")}
              </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>DATE D'ÉCHÉANCE</Text>
              <Text style={styles.value}>{dueDate}</Text>
            </View>

            <View>
              <Text style={styles.label}>STATUT</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(invoice.status) },
                ]}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}
                >
                  {formatStatus(invoice.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informations du client/fournisseur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {invoice.type === "client" ? "FACTURÉ À" : "FACTURE DE"}
          </Text>
          <View style={styles.parties}>
            <View style={styles.party}>
              <Text style={styles.partyTitle}>
                {invoice.type === "client" ? "Client" : "Fournisseur"}
              </Text>
              <Text style={[styles.value, styles.bold]}>
                {invoice.third_party?.name || "Nom non spécifié"}
              </Text>
              <Text style={styles.value}>
                {invoice.third_party?.details || "Adresse non spécifiée"}
              </Text>
              <Text style={styles.value}>
                {invoice.third_party?.email || "Email non spécifié"}
              </Text>
            </View>

            <View style={styles.party}>
              <Text style={styles.partyTitle}>INFORMATIONS</Text>
              {invoice.payment_terms && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.label}>Terme de paiement</Text>
                  <Text style={styles.value}>{invoice.payment_terms}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Détails des articles/lignes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉTAIL DE LA FACTURE</Text>
          {invoice.lines && invoice.lines.length > 0 ? (
            <>
              <View style={styles.table}>
                {/* En-tête du tableau */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerText, styles.colDescription]}>
                    DESCRIPTION
                  </Text>
                  <Text style={[styles.headerText, styles.colQuantity]}>
                    QTÉ
                  </Text>
                  <Text style={[styles.headerText, styles.colPrice]}>
                    PRIX U.
                  </Text>
                  <Text style={[styles.headerText, styles.colTax]}>TVA</Text>
                  <Text style={[styles.headerText, styles.colTotal]}>
                    TOTAL
                  </Text>
                </View>

                {/* Lignes des articles */}
                {invoice.lines.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colDescription]}>
                      {item.designation}
                    </Text>
                    <Text style={[styles.tableCell, styles.colQuantity]}>
                      {item.quantity}
                    </Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>
                      {formatCurrency(item.unit_price)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTax]}>
                      {item.tax_rate}%
                    </Text>
                    <Text style={[styles.tableCell, styles.colTotal]}>
                      {formatCurrency(calculateLineTotal(item))}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Totaux */}
              <View style={styles.totals}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Sous-total HT :</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(subtotalHT)}
                  </Text>
                </View>

                {totalTax > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total TVA :</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(totalTax)}
                    </Text>
                  </View>
                )}

                <View style={[styles.totalRow, { marginTop: 15 }]}>
                  <Text style={[styles.totalLabel, styles.grandTotal]}>
                    TOTAL TTC :
                  </Text>
                  <Text style={[styles.totalValue, styles.grandTotal]}>
                    {formatCurrency(totalTTC)}
                  </Text>
                </View>

                {invoice.amount_paid && invoice.amount_paid > 0 && (
                  <>
                    <View style={[styles.totalRow, { marginTop: 10 }]}>
                      <Text style={styles.totalLabel}>Montant payé :</Text>
                      <Text style={[styles.totalValue, { color: "#10b981" }]}>
                        {formatCurrency(invoice.amount_paid)}
                      </Text>
                    </View>

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Solde dû :</Text>
                      <Text style={[styles.totalValue, { color: "#ef4444" }]}>
                        {formatCurrency(remainingBalance)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </>
          ) : (
            <Text style={{ color: "#6b7280", fontSize: 12 }}>
              Aucun détail de ligne disponible
            </Text>
          )}
        </View>

        {/* Section QR Code pour les factures clients non payées */}
        {invoice.type === "client" && invoice.status !== "paye" && (
          <QRCodeSection invoice={invoice} />
        )}

        {/* Paiements */}
        {invoice.payments && invoice.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTORIQUE DES PAIEMENTS</Text>
            {invoice.payments.map((payment, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "30%" }]}>
                  {new Date(payment.payment_date).toLocaleDateString("fr-FR")}
                </Text>
                <Text style={[styles.tableCell, { width: "40%" }]}>
                  {payment.payment_method || "Non spécifié"}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: "30%", textAlign: "right" },
                  ]}
                >
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Merci pour votre confiance !</Text>
          <Text>Cette facture a été générée le {currentDate}</Text>
          <Text>Pour toute question, contactez-nous à UN-IT@gmail.com</Text>
        </View>
      </Page>
    </Document>
  );
};

// Composant principal pour le bouton de téléchargement
export const InvoicePDFExport = ({ invoice }: { invoice: Invoice }) => {
  const fileName = `Facture_${invoice.invoice_number}_${new Date(
    invoice.issue_date
  )
    .toLocaleDateString("fr-FR")
    .replace(/\//g, "-")}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePDFDocument invoice={invoice} />}
      fileName={fileName}
      className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-xs font-medium"
    >
      {({ loading }) => (
        <>
          <svg
            className="h-3 w-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          {loading ? "Génération..." : "PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
};

// Composant pour visualiser le PDF
export const InvoicePDFViewer = ({ invoice }: { invoice: Invoice }) => {
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <PDFViewer width="100%" height="100%">
        <InvoicePDFDocument invoice={invoice} />
      </PDFViewer>
    </div>
  );
};
