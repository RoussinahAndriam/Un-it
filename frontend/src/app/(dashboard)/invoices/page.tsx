"use client";

import React, { useState, useEffect } from "react";
import { useInvoices, Invoice, InvoiceFilters } from "@/hooks/useInvoices";
import { useThirdParties, ThirdParty } from "@/hooks/useThirdParties";
import { InvoiceFiltersComponent } from "@/components/InvoiceFilters";
import { InvoiceForm } from "@/components/InvoiceForm";
import { ThirdPartyForm } from "@/components/ThirdPartyForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  FileText,
  Send,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { formatCurrency } from "@/constants";


export default function FacturationPage() {
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    fetchInvoices,
    deleteInvoice,
    addPayment,
    createInvoice,
    downloadDocument,
    updateInvoice,
    sendInvoice,
  } = useInvoices();

  const {
    thirdParties,
    fetchThirdParties,
    deleteThirdParty,
    createThirdParty,
    error: thirdPartiesError,
    loading: thirdPartiesLoading,
    updateThirdParty,
  } = useThirdParties();

  const [activeTab, setActiveTab] = useState("invoices");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showThirdPartyForm, setShowThirdPartyForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdParty | null>(
    null
  );
  const [filters, setFilters] = useState<InvoiceFilters>({});

  const error = invoicesError || thirdPartiesError;
  const loading = invoicesLoading || thirdPartiesLoading;

  useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoices(filters);
    } else {
      fetchThirdParties();
    }
  }, [activeTab, filters]);

  const handleCreateInvoice = async (data: Partial<Invoice>) => {
    try {
      await createInvoice(data);
      setShowInvoiceForm(false);
      fetchInvoices(filters);
    } catch (err) {
      console.error("Error creating invoice:", err);
    }
  };

  const handleUpdateInvoice = async (data: Partial<Invoice>) => {
    if (editingInvoice) {
      try {
        await updateInvoice(editingInvoice.id, data);
        setEditingInvoice(null);
        fetchInvoices(filters);
      } catch (err) {
        console.error("Error updating invoice:", err);
      }
    }
  };

  const handleCreateThirdParty = async (data: Partial<ThirdParty>) => {
    try {
      await createThirdParty(data);
      setShowThirdPartyForm(false);
      fetchThirdParties();
    } catch (err) {
      console.error("Error creating third party:", err);
    }
  };

  const handleUpdateThirdParty = async (data: Partial<ThirdParty>) => {
    if (editingThirdParty) {
      try {
        await updateThirdParty(editingThirdParty.id, data);
        setEditingThirdParty(null);
        fetchThirdParties();
      } catch (err) {
        console.error("Error updating third party:", err);
      }
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      await deleteInvoice(id);
      fetchInvoices(filters);
    }
  };

  const handleDeleteThirdParty = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce tiers ?")) {
      await deleteThirdParty(id);
      fetchThirdParties();
    }
  };

  const handleSendInvoice = async (id: number) => {
    if (confirm("Envoyer cette facture par email ?")) {
      await sendInvoice(id);
      fetchInvoices(filters);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "brouillon":
        return "secondary";
      case "envoye":
        return "default";
      case "partiellement_paye":
        return "warning";
      case "paye":
        return "success";
      case "en_retard":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "client" ? "Client" : "Dépense";
  };

  const getThirdPartyTypeColor = (type: string) => {
    return type === "client" ? "default" : "secondary";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la Facturation</h1>
          <p className="text-muted-foreground">
            Gérez vos factures clients et dépenses, ainsi que vos tiers
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Factures
          </TabsTrigger>
          <TabsTrigger value="thirdparties" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Gestion des Factures</h2>
            <Button
              onClick={() => setShowInvoiceForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Facture
            </Button>
          </div>

          <InvoiceFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => setFilters({})}
          />

          <Card>
            <CardHeader>
              <CardTitle>Liste des Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tiers</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTypeLabel(invoice.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {invoice.third_party?.name}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.issue_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(invoice.status)}>
                              {invoice.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/invoices/${invoice.id}`}
                                    className="flex items-center"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setEditingInvoice(invoice)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                {invoice.type === "client" &&
                                  invoice.status === "brouillon" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleSendInvoice(invoice.id)
                                      }
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Envoyer
                                    </DropdownMenuItem>
                                  )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteInvoice(invoice.id)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {invoices.length === 0 && !invoicesLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune facture trouvée
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thirdparties" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Gestion des Tiers</h2>
            <Button
              onClick={() => setShowThirdPartyForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Tiers
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              {thirdPartiesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Coordonnées</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {thirdParties.map((thirdParty) => (
                        <TableRow key={thirdParty.id}>
                          <TableCell className="font-medium">
                            {thirdParty.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getThirdPartyTypeColor(thirdParty.type)}
                            >
                              {thirdParty.type === "client"
                                ? "Client"
                                : "Fournisseur"}
                            </Badge>
                          </TableCell>
                          <TableCell>{thirdParty.email || "-"}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {thirdParty.details || "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingThirdParty(thirdParty)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteThirdParty(thirdParty.id)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {thirdParties.length === 0 && !thirdPartiesLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun tiers trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Nouvelle Facture</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <InvoiceForm
                onSubmit={handleCreateInvoice}
                onCancel={() => setShowInvoiceForm(false)}
                loading={invoicesLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {editingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Modifier la Facture</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <InvoiceForm
                invoice={editingInvoice}
                onSubmit={handleUpdateInvoice}
                onCancel={() => setEditingInvoice(null)}
                loading={invoicesLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {showThirdPartyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Nouveau Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <ThirdPartyForm
                onSubmit={handleCreateThirdParty}
                onCancel={() => setShowThirdPartyForm(false)}
                loading={thirdPartiesLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {editingThirdParty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Modifier le Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <ThirdPartyForm
                thirdParty={editingThirdParty}
                onSubmit={handleUpdateThirdParty}
                onCancel={() => setEditingThirdParty(null)}
                loading={thirdPartiesLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
