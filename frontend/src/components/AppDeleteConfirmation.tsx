import { Compte } from "@/types/Compte";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, Trash2 } from "lucide-react";

export default function ApplicationDeleteConfirmationModal ({
  isOpen,
  onClose,
  onConfirm,
  ApplicationName,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ApplicationName: string;
  loading: boolean;
}){
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'Application{" "}
            <strong>"{ApplicationName}"</strong> ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Annuler
          </Button>
          <Button onClick={onConfirm} variant="destructive" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
