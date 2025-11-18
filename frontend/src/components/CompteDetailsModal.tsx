import { Compte } from "@/types/Compte";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { getTypeCompteColor, getTypeCompteIcon } from "@/constants";

export default function CompteDetailsModal ({
  compte,
  isOpen,
  onClose,
}: {
  compte: Compte | null;
  isOpen: boolean;
  onClose: () => void;
}){
  if (!compte) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeCompteIcon(compte.type_compte)}
            Détails du compte
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur votre compte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Nom du compte:</span>
            <span className="text-gray-900">{compte.nom_compte}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Type:</span>
            <Badge className={getTypeCompteColor(compte.type_compte)}>
              {compte.type_compte}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Identifiant:</span>
            <span className="text-gray-900">{compte.identifiant}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Solde actuel:</span>
            <span className="text-2xl font-bold text-blue-700">
              {Number(compte.solde).toLocaleString()} FCFA
            </span>
          </div>

          {compte.NumeroCompte && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Numéro de compte:</span>
              <span className="text-gray-900">{compte.NumeroCompte}</span>
            </div>
          )}

          {compte.created_at && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Date de création:</span>
              <span className="text-gray-900">
                {new Date(compte.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
