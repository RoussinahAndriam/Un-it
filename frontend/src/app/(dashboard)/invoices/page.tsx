"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useThirdParties, ThirdParty } from "@/hooks/useThirdParties";
import { InvoiceForm } from "@/components/InvoiceForm";
import { ThirdPartyForm } from "@/components/ThirdPartyForm";
import { PaymentForm } from "@/components/PaymentForm";
import { InvoicePDFExport, InvoicePDFViewer } from "@/components/InvoicePDF";
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
  CreditCard,
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  QrCode,
} from "lucide-react";
import { formatCurrency } from "@/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FacturationPage() {
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    fetchInvoices,
    deleteInvoice,
    addPayment,
    createInvoice,
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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdParty | null>(
    null
  );

  // États pour la recherche et les filtres des factures
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "invoice_number" | "issue_date" | "total_amount" | "status"
  >("issue_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // États pour la recherche et les filtres des tiers
  const [thirdPartySearchQuery, setThirdPartySearchQuery] = useState("");
  const [thirdPartyTypeFilter, setThirdPartyTypeFilter] =
    useState<string>("all");
  const [thirdPartySortBy, setThirdPartySortBy] = useState<
    "name" | "email" | "type"
  >("name");
  const [thirdPartySortOrder, setThirdPartySortOrder] = useState<
    "asc" | "desc"
  >("asc");

  const error = invoicesError || thirdPartiesError;
  const loading = invoicesLoading || thirdPartiesLoading;

  // Chargement initial
  useEffect(() => {
    fetchInvoices({});
    fetchThirdParties();
  }, []);

  const handleCreateInvoice = async (data: Partial<Invoice>) => {
    try {
      const createdInvoice = await createInvoice(data);

      if (data.status === "paye" || data.status === "partiellement_paye") {
        setSelectedInvoice(createdInvoice);
        setShowPaymentForm(true);
      }

      if (data.status === "envoye") {
        await sendInvoice(createdInvoice.id);
      }

      setShowInvoiceForm(false);
      fetchInvoices({});
    } catch (err) {
      console.error("Error creating invoice:", err);
    }
  };

  const handleUpdateInvoice = async (data: Partial<Invoice>) => {
    if (editingInvoice) {
      try {
        await updateInvoice(editingInvoice.id, data);

        if (data.status === "envoye") {
          await sendInvoice(editingInvoice.id);
        }

        setEditingInvoice(null);
        fetchInvoices({});
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
      fetchInvoices({});
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
      fetchInvoices({});
    }
  };

  const handleAddPayment = async (invoiceId: number, paymentData: any) => {
    try {
      await addPayment(invoiceId, paymentData);
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      fetchInvoices({});
    } catch (err) {
      console.error("Error adding payment:", err);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paye":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "partiellement_paye":
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case "en_retard":
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case "envoye":
        return <Clock className="h-3 w-3 text-blue-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "client" ? "Client" : "Dépense";
  };

  const getThirdPartyTypeColor = (type: string) => {
    return type === "client" ? "default" : "secondary";
  };

  // Fonction pour réinitialiser tous les filtres des factures
  const resetInvoiceFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("issue_date");
    setSortOrder("desc");
  };

  // Fonction pour réinitialiser tous les filtres des tiers
  const resetThirdPartyFilters = () => {
    setThirdPartySearchQuery("");
    setThirdPartyTypeFilter("all");
    setThirdPartySortBy("name");
    setThirdPartySortOrder("asc");
  };

  // Fonction pour générer un QR Code de paiement
  const generatePaymentQRCode = (invoice: Invoice) => {
    const paymentData = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total_amount,
      dueDate: invoice.due_date,
      beneficiary: "Votre Entreprise",
      iban: "FR76 1234 5678 9012 3456 7890 123",
      bic: "ABCDEFGH",
      reference: `FACT-${invoice.invoice_number}`,
    };

    const qrText = `PAIEMENT FACTURE
N°: ${invoice.invoice_number}
Montant: ${formatCurrency(invoice.total_amount)}
Client: ${invoice.third_party?.name || "Non spécifié"}
Date d'échéance: ${
      invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString("fr-FR")
        : "N/A"
    }
Bénéficiaire: Votre Entreprise
IBAN: FR76 1234 5678 9012 3456 7890 123
BIC: ABCDEFGH
Référence: FACT-${invoice.invoice_number}`;

    return qrText;
  };

  // Filtrage et tri des factures
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => {
      const invoiceNumber = invoice.invoice_number?.toLowerCase() || "";
      const thirdPartyName = invoice.third_party?.name?.toLowerCase() || "";
      const totalAmount = invoice.total_amount?.toString() || "";

      const matchesSearch =
        invoiceNumber.includes(searchQuery.toLowerCase()) ||
        thirdPartyName.includes(searchQuery.toLowerCase()) ||
        totalAmount.includes(searchQuery);

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;
      const matchesType = typeFilter === "all" || invoice.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Tri des factures
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "invoice_number":
          aValue = a.invoice_number?.toLowerCase() || "";
          bValue = b.invoice_number?.toLowerCase() || "";
          break;
        case "total_amount":
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        case "issue_date":
          aValue = a.issue_date ? new Date(a.issue_date) : new Date(0);
          bValue = b.issue_date ? new Date(b.issue_date) : new Date(0);
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          aValue = a.issue_date ? new Date(a.issue_date) : new Date(0);
          bValue = b.issue_date ? new Date(b.issue_date) : new Date(0);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        return sortOrder === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }
    });

    return filtered;
  }, [invoices, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  // Filtrage et tri des tiers
  const filteredAndSortedThirdParties = useMemo(() => {
    let filtered = thirdParties.filter((thirdParty) => {
      const name = thirdParty.name?.toLowerCase() || "";
      const email = thirdParty.email?.toLowerCase() || "";
      const details = thirdParty.details?.toLowerCase() || "";

      const matchesSearch =
        name.includes(thirdPartySearchQuery.toLowerCase()) ||
        email.includes(thirdPartySearchQuery.toLowerCase()) ||
        details.includes(thirdPartySearchQuery.toLowerCase());

      const matchesType =
        thirdPartyTypeFilter === "all" ||
        thirdParty.type === thirdPartyTypeFilter;

      return matchesSearch && matchesType;
    });

    // Tri des tiers
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (thirdPartySortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "type":
          aValue = a.type || "";
          bValue = b.type || "";
          break;
        default:
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
      }

      return thirdPartySortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return filtered;
  }, [
    thirdParties,
    thirdPartySearchQuery,
    thirdPartyTypeFilter,
    thirdPartySortBy,
    thirdPartySortOrder,
  ]);

  // Calcul des statistiques des factures
  const totalAmount = useMemo(() => {
    return filteredAndSortedInvoices.reduce((sum, invoice) => {
      const raw = String(invoice.total_amount ?? "0").replace(/[^\d.-]/g, "");
      const balance = Number(raw);

      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
  }, [filteredAndSortedInvoices]);

  const totalPaid = useMemo(() => {
    return filteredAndSortedInvoices.reduce((sum, invoice) => {
      const raw = String(invoice.amount_paid ?? "0").replace(/[^\d.-]/g, "");
      const balance = Number(raw);

      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
  }, [filteredAndSortedInvoices]);

  const pendingInvoices = useMemo(() => {
    return filteredAndSortedInvoices.filter(
      (invoice) => invoice.status === "brouillon" || invoice.status === "envoye"
    ).length;
  }, [filteredAndSortedInvoices]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "text-blue-700",
    description,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    description?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color} mt-2`}>
              {typeof value === "number" && title.includes("Montant")
                ? formatCurrency(value)
                : value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 rounded-full bg-gray-50">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

          {/* === RÉSUMÉ STATISTIQUES === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Montant Total"
              value={totalAmount}
              icon={TrendingUp}
              color="text-blue-700"
            />
            <StatCard
              title="Montant Payé"
              value={totalPaid}
              icon={CheckCircle}
              color="text-green-600"
            />
            <StatCard
              title="Factures en Attente"
              value={pendingInvoices}
              icon={AlertTriangle}
              color="text-orange-600"
              description="Brouillons et envoyées"
            />
          </div>

          {/* === BARRE DE RECHERCHE ET FILTRES FACTURES === */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Barre de recherche */}
                <div className="relative w-full lg:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une facture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full lg:w-80"
                  />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  {/* Filtre par statut */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="envoye">Envoyée</SelectItem>
                        <SelectItem value="partiellement_paye">
                          Partiellement payée
                        </SelectItem>
                        <SelectItem value="paye">Payée</SelectItem>
                        <SelectItem value="en_retard">En retard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre par type */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="depense">Dépense</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Tri */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      Trier par:
                    </span>
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issue_date">Date</SelectItem>
                        <SelectItem value="invoice_number">Numéro</SelectItem>
                        <SelectItem value="total_amount">Montant</SelectItem>
                        <SelectItem value="status">Statut</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="h-10 w-10"
                    >
                      {sortOrder === "asc" ? "A→Z" : "Z→A"}
                    </Button>
                  </div>

                  {/* Bouton réinitialiser */}
                  {(searchQuery ||
                    statusFilter !== "all" ||
                    typeFilter !== "all" ||
                    sortBy !== "issue_date") && (
                    <Button
                      variant="outline"
                      onClick={resetInvoiceFilters}
                      className="whitespace-nowrap"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>

              {/* Résultats du filtrage */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>
                  {filteredAndSortedInvoices.length} facture
                  {filteredAndSortedInvoices.length > 1 ? "s" : ""} trouvée
                  {filteredAndSortedInvoices.length > 1 ? "s" : ""}
                  {searchQuery && ` pour "${searchQuery}"`}
                  {statusFilter !== "all" && ` • Statut: ${statusFilter}`}
                  {typeFilter !== "all" && ` • Type: ${typeFilter}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Liste des Factures{" "}
                {filteredAndSortedInvoices.length > 0 &&
                  `(${filteredAndSortedInvoices.length})`}
              </CardTitle>
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
                        <TableHead>Payé</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedInvoices.map((invoice) => (
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
                            {invoice.third_party?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.issue_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.amount_paid)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(invoice.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(invoice.status)}
                                {invoice.status.replace("_", " ")}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* Bouton d'export PDF direct */}
                              <InvoicePDFExport invoice={invoice} />

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

                                  {/* Option pour visualiser le PDF */}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowPDFPreview(true);
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Aperçu PDF
                                  </DropdownMenuItem>

                                  {/* Option pour générer QR Code de paiement */}
                                  {invoice.type === "client" &&
                                    invoice.status !== "paye" && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedInvoice(invoice);
                                          setShowQRCode(true);
                                        }}
                                      >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        QR Code Paiement
                                      </DropdownMenuItem>
                                    )}

                                  <DropdownMenuItem
                                    onClick={() => setEditingInvoice(invoice)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>

                                  {invoice.type === "client" && (
                                    <>
                                      {invoice.status === "brouillon" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleSendInvoice(invoice.id)
                                          }
                                        >
                                          <Send className="h-4 w-4 mr-2" />
                                          Envoyer
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}

                                  {(invoice.status === "brouillon" ||
                                    invoice.status === "envoye" ||
                                    invoice.status ===
                                      "partiellement_paye") && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedInvoice(invoice);
                                        setShowPaymentForm(true);
                                      }}
                                    >
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Ajouter Paiement
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredAndSortedInvoices.length === 0 && !invoicesLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {invoices.length === 0
                    ? "Aucune facture trouvée"
                    : "Aucune facture ne correspond aux critères de recherche"}
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

          {/* === BARRE DE RECHERCHE ET FILTRES TIERS === */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Barre de recherche */}
                <div className="relative w-full lg:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un tiers..."
                    value={thirdPartySearchQuery}
                    onChange={(e) => setThirdPartySearchQuery(e.target.value)}
                    className="pl-10 w-full lg:w-80"
                  />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  {/* Filtre par type */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select
                      value={thirdPartyTypeFilter}
                      onValueChange={setThirdPartyTypeFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type de tiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="fournisseur">Fournisseur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tri */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      Trier par:
                    </span>
                    <Select
                      value={thirdPartySortBy}
                      onValueChange={(value: any) => setThirdPartySortBy(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setThirdPartySortOrder(
                          thirdPartySortOrder === "asc" ? "desc" : "asc"
                        )
                      }
                      className="h-10 w-10"
                    >
                      {thirdPartySortOrder === "asc" ? "A→Z" : "Z→A"}
                    </Button>
                  </div>

                  {/* Bouton réinitialiser */}
                  {(thirdPartySearchQuery ||
                    thirdPartyTypeFilter !== "all" ||
                    thirdPartySortBy !== "name") && (
                    <Button
                      variant="outline"
                      onClick={resetThirdPartyFilters}
                      className="whitespace-nowrap"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>

              {/* Résultats du filtrage */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>
                  {filteredAndSortedThirdParties.length} tiers
                  {filteredAndSortedThirdParties.length > 1 ? "" : ""} trouvé
                  {filteredAndSortedThirdParties.length > 1 ? "s" : ""}
                  {thirdPartySearchQuery && ` pour "${thirdPartySearchQuery}"`}
                  {thirdPartyTypeFilter !== "all" &&
                    ` • Type: ${thirdPartyTypeFilter}`}
                </span>
              </div>
            </CardContent>
          </Card>

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
                      {filteredAndSortedThirdParties.map((thirdParty) => (
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

              {filteredAndSortedThirdParties.length === 0 &&
                !thirdPartiesLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    {thirdParties.length === 0
                      ? "Aucun tiers trouvé"
                      : "Aucun tiers ne correspond aux critères de recherche"}
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

      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Ajouter un Paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                invoice={selectedInvoice}
                onSubmit={(paymentData) =>
                  handleAddPayment(selectedInvoice.id, paymentData)
                }
                onCancel={() => {
                  setShowPaymentForm(false);
                  setSelectedInvoice(null);
                }}
                loading={invoicesLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {showPDFPreview && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Aperçu PDF - {selectedInvoice.invoice_number}
              </CardTitle>
              <div className="flex gap-2">
                <InvoicePDFExport invoice={selectedInvoice} />
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPDFPreview(false);
                    setSelectedInvoice(null);
                  }}
                >
                  Fermer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <InvoicePDFViewer invoice={selectedInvoice} />
            </CardContent>
          </Card>
        </div>
      )}

      {showQRCode && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>QR Code de Paiement</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowQRCode(false);
                  setSelectedInvoice(null);
                }}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {generatePaymentQRCode(selectedInvoice)}
                </pre>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <p className="font-semibold">Instructions de paiement :</p>
                <p>1. Scannez ce QR Code avec votre application bancaire</p>
                <p>2. Vérifiez les informations de paiement</p>
                <p>
                  3. Confirmez le paiement de{" "}
                  {formatCurrency(selectedInvoice.total_amount)}
                </p>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      generatePaymentQRCode(selectedInvoice)
                    );
                    alert("QR Code copié dans le presse-papier");
                  }}
                  variant="outline"
                >
                  Copier le texte
                </Button>
                <InvoicePDFExport invoice={selectedInvoice} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
