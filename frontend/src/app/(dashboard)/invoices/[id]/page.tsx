"use client";

import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { useParams, useRouter } from "next/navigation";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/PaymentForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Send, Download, CreditCard } from "lucide-react";

const InvoiceDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    invoices,
    loading,
    fetchInvoices,
    error,
    addPayment,
    downloadDocument,
    sendInvoice,
    updateInvoice,
  } = useInvoices();

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const invoice = invoices.find((inv) => inv.id === Number(id));

  const handleAddPayment = async (paymentData: any) => {
    if (invoice) {
      try {
        await addPayment(invoice.id, paymentData);
        setShowPaymentForm(false);
        fetchInvoices();
      } catch (err) {
        console.error("Error adding payment:", err);
      }
    }
  };

  const handleSendInvoice = async () => {
    if (invoice && confirm("Envoyer cette facture par email ?")) {
      await sendInvoice(invoice.id);
      fetchInvoices();
    }
  };

  const handleDownloadDocument = async (documentId: number) => {
    try {
      await downloadDocument(documentId);
    } catch (err) {
      console.error("Error downloading document:", err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (invoice) {
      try {
        await updateInvoice(invoice.id, { status: newStatus });
        fetchInvoices();
      } catch (err) {
        console.error("Error updating status:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Facture non trouvée"}
        </div>
        <Button onClick={() => router.back()} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "brouillon":
        return "bg-gray-100 text-gray-800";
      case "envoye":
        return "bg-blue-100 text-blue-800";
      case "partiellement_paye":
        return "bg-yellow-100 text-yellow-800";
      case "paye":
        return "bg-green-100 text-green-800";
      case "en_retard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const remainingAmount = invoice.total_amount - invoice.amount_paid;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Facture {invoice.invoice_number}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              {invoice.type === "client" ? "Facture Client" : "Facture Dépense"}
            </p>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.type === "client" && invoice.status === "brouillon" && (
                <DropdownMenuItem onClick={handleSendInvoice}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer par email
                </DropdownMenuItem>
              )}

              {(invoice.status === "brouillon" ||
                invoice.status === "envoye" ||
                invoice.status === "partiellement_paye") && (
                <DropdownMenuItem onClick={() => setShowPaymentForm(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ajouter Paiement
                </DropdownMenuItem>
              )}

              {invoice.documents.map((doc) => (
                <DropdownMenuItem
                  key={doc.id}
                  onClick={() => handleDownloadDocument(doc.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger {doc.file_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => router.back()} variant="outline">
            Retour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium block mb-1">Tiers:</label>
                  <p className="text-lg">{invoice.third_party?.name}</p>
                  {invoice.third_party?.email && (
                    <p className="text-sm text-gray-600">
                      {invoice.third_party.email}
                    </p>
                  )}
                  {invoice.third_party?.details && (
                    <p className="text-sm text-gray-600 mt-1">
                      {invoice.third_party.details}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-medium block mb-1">
                    Date d'émission:
                  </label>
                  <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
                </div>

                <div>
                  <label className="font-medium block mb-1">
                    Date d'échéance:
                  </label>
                  <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>

                <div>
                  <label className="font-medium block mb-1">
                    Conditions de paiement:
                  </label>
                  <p>{invoice.payment_terms || "Non spécifié"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lignes de facture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Désignation
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantité
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Prix unitaire
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        TVA
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Remise
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.lines.map((line, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">
                          {line.designation}
                        </td>
                        <td className="px-4 py-2 text-sm">{line.quantity}</td>
                        <td className="px-4 py-2 text-sm">
                          {formatCurrency(line.unit_price)}
                        </td>
                        <td className="px-4 py-2 text-sm">{line.tax_rate}%</td>
                        <td className="px-4 py-2 text-sm">{line.discount}%</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          {formatCurrency(
                            line.quantity *
                              line.unit_price *
                              (1 - line.discount / 100) *
                              (1 + line.tax_rate / 100)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Sous-total:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>TVA:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.tax_amount)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Payé:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Reste à payer:</span>
                  <span
                    className={
                      remainingAmount > 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
              </div>

              {remainingAmount > 0 && invoice.type === "client" && (
                <Button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full mt-4"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ajouter Paiement
                </Button>
              )}
            </CardContent>
          </Card>

          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                      {payment.payment_method && (
                        <p className="text-xs text-gray-600 mt-1">
                          Méthode: {payment.payment_method}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span className="text-sm truncate flex-1">
                        {doc.file_name}
                      </span>
                      <Button
                        onClick={() => handleDownloadDocument(doc.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de paiement */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Ajouter un Paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                invoice={invoice}
                onSubmit={handleAddPayment}
                onCancel={() => setShowPaymentForm(false)}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;
