"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2 } from "lucide-react";
import { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TransactionPopover({ transaction, onEdit, onDelete }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Eye size={16} />
          Voir
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Détails Transaction</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>ID :</strong> {transaction.id_transaction}</p>
            <p><strong>Type :</strong> {transaction.type_transaction}</p>
            <p><strong>Montant :</strong> {transaction.montant.toLocaleString()} FCFA</p>
            <p><strong>Date :</strong> {transaction.date_transaction}</p>
            <p><strong>Description :</strong> {transaction.description || "—"}</p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onEdit}
            >
              <Edit size={16} />
              Modifier
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
              onClick={onDelete}
            >
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
