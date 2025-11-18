// ThirdPartyForm component
import React, { useState, useEffect } from "react";
import { ThirdParty } from "@/hooks/useThirdParties";
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

interface ThirdPartyFormProps {
  thirdParty?: ThirdParty;
  onSubmit: (data: Partial<ThirdParty>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const ThirdPartyForm: React.FC<ThirdPartyFormProps> = ({
  thirdParty,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [formData, setFormData] = useState<Partial<ThirdParty>>({
    name: "",
    type: "client",
    email: "",
    details: "",
  });

  useEffect(() => {
    if (thirdParty) {
      setFormData({
        name: thirdParty.name,
        type: thirdParty.type,
        email: thirdParty.email || "",
        details: thirdParty.details || "",
      });
    }
  }, [thirdParty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nom du tiers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "client" | "fournisseur") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="fournisseur">Fournisseur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemple.com"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="details">Coordonnées</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, details: e.target.value }))
                }
                placeholder="Adresse, téléphone, NIF, STAT, etc."
                rows={4}
              />
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
          disabled={loading || !formData.name}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading
            ? "Enregistrement..."
            : thirdParty
            ? "Mettre à jour"
            : "Créer le tiers"}
        </Button>
      </div>
    </form>
  );
};
