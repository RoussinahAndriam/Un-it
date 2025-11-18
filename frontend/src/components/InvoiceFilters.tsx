import React from "react";
import { InvoiceFilters } from "@/hooks/useInvoices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

interface InvoiceFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onReset: () => void;
}

export const InvoiceFiltersComponent: React.FC<InvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const handleFilterChange = (key: keyof InvoiceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={filters.status || ""}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="partiellement_paye">
                  Partiellement payé
                </SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={filters.type || ""}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Date début</Label>
            <Input
              type="date"
              id="start_date"
              value={filters.start_date || ""}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Date fin</Label>
            <Input
              type="date"
              id="end_date"
              value={filters.end_date || ""}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Recherche</Label>
            <Input
              type="text"
              id="search"
              placeholder="Numéro, client..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
