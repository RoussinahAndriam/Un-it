"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FiltreMaterielProps {
  onFilterChange: (filters: { search: string; etat: string }) => void;
}

export default function FiltreMateriel({
  onFilterChange,
}: FiltreMaterielProps) {
  const [search, setSearch] = useState("");
  const [etat, setEtat] = useState("");

  useEffect(() => {
    onFilterChange({ search, etat });
  }, [search, etat, onFilterChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
      {/* 🔍 Barre de recherche */}
      <div className="relative w-full sm:w-1/3">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Rechercher un matériel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 🧩 Filtre par état */}
      <Select onValueChange={(val) => setEtat(val)} value={etat}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrer par état" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous</SelectItem>
          <SelectItem value="neuf">Neuf</SelectItem>
          <SelectItem value="en_service">En service</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
          <SelectItem value="hors_service">Hors service</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
