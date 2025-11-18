// InvoiceForm component
import React, { useState, useEffect } from "react";
import { useThirdParties, ThirdParty } from "@/hooks/useThirdParties";
import { Invoice, InvoiceLine } from "@/hooks/useInvoices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/constants";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: Partial<Invoice>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onSubmit,
  onCancel,
  loading,
}) => {
  const { thirdParties, fetchThirdParties, createThirdParty } =
    useThirdParties();
  const [showThirdPartyForm, setShowThirdPartyForm] = useState(false);
  const [newThirdParty, setNewThirdParty] = useState<Partial<ThirdParty>>({
    name: "",
    type: "client",
    email: "",
    details: "",
  });

  const [formData, setFormData] = useState({
    type: invoice?.type || "client",
    third_party_id: invoice?.third_party_id?.toString() || "",
    issue_date: invoice?.issue_date || new Date().toISOString().split("T")[0],
    due_date: invoice?.due_date || "",
    status: invoice?.status || "brouillon",
    payment_terms: invoice?.payment_terms || "",
    subtotal: 0,
    lines:
      invoice?.lines ||
      ([
        {
          designation: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 20,
          discount: 0,
        },
      ] as InvoiceLine[]),
  });

  useEffect(() => {
    fetchThirdParties();
  }, []);

  const handleCreateThirdParty = async () => {
    try {
      const created = await createThirdParty(newThirdParty);
      setFormData((prev) => ({
        ...prev,
        third_party_id: created.id.toString(),
      }));
      setShowThirdPartyForm(false);
      setNewThirdParty({ name: "", type: "client", email: "", details: "" });
    } catch (err) {
      console.error("Error creating third party:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      third_party_id: parseInt(formData.third_party_id),
      lines: formData.lines.map((line) => ({
        ...line,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
        tax_rate: Number(line.tax_rate),
        discount: Number(line.discount),
      })),
    };

    await onSubmit(submitData);
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData((prev) => ({ ...prev, lines: newLines }));
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          designation: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 20,
          discount: 0,
        },
      ],
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateLineTotal = (line: InvoiceLine) => {
    const subtotal =
      Number(line.quantity) *
      Number(line.unit_price) *
      (1 - Number(line.discount || 0) / 100);
    const tax = subtotal * (Number(line.tax_rate || 0) / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce((sum, line) => {
      return (
        sum +
        Number(line.quantity) *
          Number(line.unit_price) *
          (1 - Number(line.discount || 0) / 100)
      );
    }, 0);

    const taxAmount = formData.lines.reduce((sum, line) => {
      const lineSubtotal =
        Number(line.quantity) *
        Number(line.unit_price) *
        (1 - Number(line.discount || 0) / 100);
      return sum + lineSubtotal * (Number(line.tax_rate || 0) / 100);
    }, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax_amount: Number(taxAmount.toFixed(2)),
      total_amount: Number((subtotal + taxAmount).toFixed(2)),
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de facture</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "client" | "depense") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Facture Client</SelectItem>
                    <SelectItem value="depense">Facture Dépense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="third_party">
                    {formData.type === "client" ? "Client" : "Fournisseur"}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowThirdPartyForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nouveau
                  </Button>
                </div>
                <Select
                  value={formData.third_party_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, third_party_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {thirdParties
                      .filter(
                        (tp) =>
                          tp.type ===
                          (formData.type === "client"
                            ? "client"
                            : "fournisseur")
                      )
                      .map((tp) => (
                        <SelectItem key={tp.id} value={tp.id.toString()}>
                          {tp.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Date d'émission</Label>
                <Input
                  type="date"
                  id="issue_date"
                  value={formData.issue_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      issue_date: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Date d'échéance</Label>
                <Input
                  type="date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      due_date: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Conditions de paiement</Label>
              <Textarea
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_terms: e.target.value,
                  }))
                }
                placeholder="Ex: Paiement à 30 jours fin de mois..."
                rows={3}
              />
            </div>
            <div className="space-u-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                  <SelectItem value="partiellement_paye">
                    Partiellement payé
                  </SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lignes de facture</CardTitle>
              <Button
                type="button"
                onClick={addLine}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-start p-4 border rounded-lg"
                >
                  <div className="col-span-4 space-y-2">
                    <Label htmlFor={`designation-${index}`}>Désignation</Label>
                    <Input
                      id={`designation-${index}`}
                      placeholder="Description du produit/service"
                      value={line.designation}
                      onChange={(e) =>
                        updateLine(index, "designation", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label htmlFor={`quantity-${index}`}>Qté</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      step="1"
                      min="0"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, "quantity", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor={`unit_price-${index}`}>Prix unitaire</Label>
                    <Input
                      id={`unit_price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(index, "unit_price", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label htmlFor={`tax_rate-${index}`}>TVA %</Label>
                    <Input
                      id={`tax_rate-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={line.tax_rate}
                      onChange={(e) =>
                        updateLine(index, "tax_rate", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label htmlFor={`discount-${index}`}>Remise %</Label>
                    <Input
                      id={`discount-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={line.discount}
                      onChange={(e) =>
                        updateLine(index, "discount", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Total ligne</Label>
                    <div className="text-sm font-medium p-2 bg-muted rounded">
                      {formatCurrency(calculateLineTotal(line))}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-end justify-center h-full">
                    {formData.lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(index)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md ml-auto">
              <div className="flex justify-between text-sm">
                <span>Sous-total:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA:</span>
                <span>{formatCurrency(totals.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.third_party_id}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading
              ? "Enregistrement..."
              : invoice
              ? "Mettre à jour"
              : "Créer la facture"}
          </Button>
        </div>
      </form>

      {/* Modal de création de tiers */}
      {showThirdPartyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Nouveau{" "}
                  {formData.type === "client" ? "Client" : "Fournisseur"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowThirdPartyForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thirdparty-name">Nom</Label>
                <Input
                  id="thirdparty-name"
                  value={newThirdParty.name}
                  onChange={(e) =>
                    setNewThirdParty((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Nom du tiers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thirdparty-email">Email</Label>
                <Input
                  id="thirdparty-email"
                  type="email"
                  value={newThirdParty.email}
                  onChange={(e) =>
                    setNewThirdParty((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thirdparty-details">Coordonnées</Label>
                <Textarea
                  id="thirdparty-details"
                  value={newThirdParty.details}
                  onChange={(e) =>
                    setNewThirdParty((prev) => ({
                      ...prev,
                      details: e.target.value,
                    }))
                  }
                  placeholder="Adresse, téléphone, etc."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowThirdPartyForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateThirdParty}
                  disabled={!newThirdParty.name}
                >
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
