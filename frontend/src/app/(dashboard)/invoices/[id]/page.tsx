"use client";

import React, { useEffect } from "react";
import { NextPage } from "next";
import { useParams, useRouter } from "next/navigation";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/constants";

const InvoiceDetailPage: NextPage = () => {
  const router = useRouter();
    const params = useParams();
  
    const id = params.id as string;
  const { invoices, loading, fetchInvoices,  error, addPayment, downloadDocument } =
    useInvoices();

    useEffect(() => {
      fetchInvoices();
    }, [])

  const invoice = invoices.find((inv) => inv.id === Number(id));

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Facture {invoice.invoice_number}
          </h1>
          <p className="text-gray-600">
            {invoice.type === "client" ? "Facture Client" : "Facture Dépense"} -
            <span
              className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status.replace("_", " ")}
            </span>
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Retour
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Informations</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Tiers:</label>
                <p>{invoice.third_party?.name}</p>
                {invoice.third_party?.email && (
                  <p className="text-sm text-gray-600">
                    {invoice.third_party.email}
                  </p>
                )}
              </div>
              <div>
                <label className="font-medium">Date d'émission:</label>
                <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="font-medium">Date d'échéance:</label>
                <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="font-medium">Conditions de paiement:</label>
                <p>{invoice.payment_terms || "Non spécifié"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Lignes de facture</h2>
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
                      <td className="px-4 py-2 text-sm">{line.designation}</td>
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Totaux</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA:</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Payé:</span>
                <span>{formatCurrency(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Reste à payer:</span>
                <span>
                  {formatCurrency(invoice.total_amount - invoice.amount_paid)}
                </span>
              </div>
            </div>
          </div>

          {invoice.payments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Paiements</h2>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border-b pb-2 last:border-b-0"
                  >
                    <div className="flex justify-between text-sm">
                      <span>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    {payment.payment_method && (
                      <p className="text-xs text-gray-600">
                        Méthode: {payment.payment_method}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.documents.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Documents</h2>
              <div className="space-y-2">
                {invoice.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm truncate">{doc.file_name}</span>
                    <button
                      onClick={() => downloadDocument(doc.id)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
