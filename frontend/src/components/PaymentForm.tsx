// components/PaymentForm.tsx
import React, { useEffect, useState } from "react";
import { Invoice } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/constants";
import { useAccount } from "@/hooks/useAccount";

interface PaymentFormProps {
  invoice: Invoice;
  onSubmit: (paymentData: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export type AccountType = "bancaire" | "mobile_money" | "especes" | "autre";

// Mapping entre les méthodes de paiement et les types de comptes
const paymentMethodToAccountType: Record<string, AccountType[]> = {
  virement: ["bancaire"],
  cheque: ["bancaire"],
  carte: ["bancaire"],
  especes: ["especes"],
  mobile_money: ["mobile_money"],
  autre: ["bancaire", "mobile_money", "especes", "autre"],
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  invoice,
  onSubmit,
  onCancel,
  loading,
}) => {
  const { accounts, fetchAccounts } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: invoice.total_amount - invoice.amount_paid,
    payment_date: new Date().toISOString().split("T")[0],
    account_id: "",
    payment_method: "virement",
    reference: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filtrer les comptes selon la méthode de paiement sélectionnée
  const filteredAccounts = accounts.filter((account) => {
    const allowedTypes = paymentMethodToAccountType[
      paymentData.payment_method
    ] || ["autre"];
    return allowedTypes.includes(account.type as AccountType);
  });

  // Initialisation une seule fois quand les comptes sont chargés
  useEffect(() => {
    if (accounts.length > 0 && !isInitialized) {
      const defaultAccount = filteredAccounts[0] || accounts[0];
      if (defaultAccount) {
        setPaymentData((prev) => ({
          ...prev,
          account_id: defaultAccount.id.toString(),
        }));
        setIsInitialized(true);
      }
    }
  }, [accounts, isInitialized, filteredAccounts]);

  // Gérer le changement de méthode de paiement
  const handlePaymentMethodChange = (value: string) => {
    const newFilteredAccounts = accounts.filter((account) => {
      const allowedTypes = paymentMethodToAccountType[value] || ["autre"];
      return allowedTypes.includes(account.type as AccountType);
    });

    const currentAccount = accounts.find(
      (acc) => acc.id.toString() === paymentData.account_id
    );
    const isCurrentAccountValid =
      currentAccount &&
      newFilteredAccounts.some((acc) => acc.id === currentAccount.id);

    setPaymentData((prev) => ({
      ...prev,
      payment_method: value,
      account_id: isCurrentAccountValid
        ? prev.account_id
        : newFilteredAccounts[0]?.id.toString() || "",
    }));
  };

  const remainingAmount = invoice.total_amount - invoice.amount_paid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...paymentData,
      amount: Number(paymentData.amount),
      account_id: Number(paymentData.account_id),
    });
  };

  const getAccountTypeLabel = (type: AccountType) => {
    const labels = {
      bancaire: "Bancaire",
      mobile_money: "Mobile Money",
      especes: "Espèces",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant du paiement</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={remainingAmount}
          value={paymentData.amount}
          onChange={(e) =>
            setPaymentData((prev) => ({
              ...prev,
              amount: Math.min(Number(e.target.value), remainingAmount),
            }))
          }
          required
        />
        <p className="text-sm text-gray-600">
          Reste à payer: {formatCurrency(remainingAmount)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_date">Date du paiement</Label>
        <Input
          id="payment_date"
          type="date"
          value={paymentData.payment_date}
          onChange={(e) =>
            setPaymentData((prev) => ({
              ...prev,
              payment_date: e.target.value,
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Méthode de paiement</Label>
        <Select
          value={paymentData.payment_method}
          onValueChange={handlePaymentMethodChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="virement">Virement</SelectItem>
            <SelectItem value="cheque">Chèque</SelectItem>
            <SelectItem value="carte">Carte bancaire</SelectItem>
            <SelectItem value="especes">Espèces</SelectItem>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">
          Compte {paymentData.payment_method === "especes" ? "de caisse" : ""}
        </Label>
        <Select
          value={paymentData.account_id}
          onValueChange={(value) =>
            setPaymentData((prev) => ({ ...prev, account_id: value }))
          }
          disabled={filteredAccounts.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                filteredAccounts.length === 0
                  ? "Aucun compte disponible"
                  : "Sélectionner un compte"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {filteredAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id.toString()}>
                <div className="flex flex-col">
                  <span>{account.name}</span>
                  <span className="text-xs text-gray-500">
                    {getAccountTypeLabel(account.type as AccountType)} -{" "}
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filteredAccounts.length === 0 && (
          <p className="text-xs text-red-600">
            Aucun compte de type "
            {getAccountTypeLabel(
              paymentMethodToAccountType[
                paymentData.payment_method
              ]?.[0] as AccountType
            )}
            " disponible
          </p>
        )}

        {paymentData.account_id && (
          <p className="text-xs text-gray-600">
            Solde du compte:{" "}
            {formatCurrency(
              accounts.find(
                (acc) => acc.id.toString() === paymentData.account_id
              )?.balance || 0
            )}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Référence</Label>
        <Input
          id="reference"
          value={paymentData.reference}
          onChange={(e) =>
            setPaymentData((prev) => ({ ...prev, reference: e.target.value }))
          }
          placeholder={
            paymentData.payment_method === "cheque"
              ? "Numéro de chèque..."
              : paymentData.payment_method === "virement"
              ? "Référence virement..."
              : paymentData.payment_method === "mobile_money"
              ? "Numéro de transaction..."
              : "Référence..."
          }
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={
            loading || !paymentData.account_id || filteredAccounts.length === 0
          }
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Enregistrement..." : "Enregistrer le paiement"}
        </Button>
      </div>
    </form>
  );
};
