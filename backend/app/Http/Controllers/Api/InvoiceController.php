<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\InvoicePayment;
use App\Models\AttachedDocument;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\AddPaymentRequest;
use Illuminate\Support\Facades\Mail; // <-- NOUVEAU
use App\Mail\SendInvoiceMail; // <-- NOUVEAU
use Barryvdh\DomPDF\Facade\Pdf; // <-- NOUVEAU (pour 'barryvdh/laravel-dompdf')
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    /**
     * Affiche la liste des factures. (Fct 2.7)
     */
    public function index(Request $request)
    {
        try {
            $invoices = Invoice::all()->load(['lines','thirdParty', 'payments', 'documents']);

            return response()->json([ "data" => $invoices], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Crée une nouvelle facture (client ou dépense). (Fct 2.7)
     */
    public function store(StoreInvoiceRequest $request)
    {
        $validated = $request->validated();
        $invoiceLinesData = $validated['lines'];



        try {
            $invoice = null;
            DB::transaction(function () use ($validated, $invoiceLinesData, &$invoice) {
                $invoice = Invoice::create(collect($validated)->except('lines')->all());
                $subtotal = 0;
                $tax_amount = 0;

                foreach ($invoiceLinesData as $lineData) {
                    $lineTotal = $lineData['quantity'] * $lineData['unit_price'] * (1 - ($lineData['discount'] ?? 0) / 100);
                    $subtotal += $lineTotal;
                    $tax_amount += $lineTotal * ($lineData['tax_rate'] ?? 0) / 100;
                    $invoice->lines()->create($lineData);
                }

                Log::info("Subtotal" .$subtotal);

                $invoice->subtotal = $subtotal;
                $invoice->tax_amount = $tax_amount;
                $invoice->total_amount = $subtotal + $tax_amount;
                $invoice->save();
            });

            return response()->json(['data' => $invoice->load('lines'), 'message' => 'Facture créée.'], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création de la facture.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Affiche une facture complète.
     */
    public function show(Invoice $invoice)
    {
        try {
            $invoice->load(['thirdParty', 'lines', 'payments', 'documents']);
            return response()->json(['data' => $invoice], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Facture non trouvée.'], 404);
        }
    }

    /**
     * Supprime une facture.
     */
    public function destroy(Invoice $invoice)
    {
        try {
            if ($invoice->status == 'paye' || $invoice->status == 'partiellement_paye') {
                return response()->json(['message' => 'Impossible de supprimer une facture ayant des paiements.'], 400);
            }
            $invoice->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Facture non trouvée.'], 404);
        }
    }

    /**
     * Ajoute un paiement à une facture. (Fct 2.7 Paiements & Rapprochement)
     */
    public function addPayment(AddPaymentRequest $request, Invoice $invoice)
    {
        $validated = $request->validated();
        
        try {
            $payment = null;
            DB::transaction(function () use ($validated, $invoice, &$payment) {
                
                $transaction = Transaction::create([
                    'account_id' => $validated['account_id'],
                    'transaction_category_id' => $validated['transaction_category_id'] ?? null,
                    'type' => $invoice->type == 'client' ? 'revenu' : 'depense',
                    'amount' => $validated['amount'],
                    'description' => $validated['description'] ?? (
                        $invoice->type == 'client' 
                            ? 'Paiement Facture Client #' . $invoice->invoice_number
                            : 'Paiement Facture Fournisseur #' . $invoice->invoice_number
                    ),
                    'transaction_date' => $validated['payment_date'],
                ]);
                
                $account = Account::findOrFail($validated['account_id']);
                if ($transaction->type == 'revenu') $account->balance += $transaction->amount;
                else $account->balance -= $transaction->amount;
                $account->save();

                $payment = $invoice->payments()->create([
                    'transaction_id' => $transaction->id,
                    'amount' => $validated['amount'],
                    'payment_date' => $validated['payment_date'],
                    'payment_method' => $validated['payment_method'] ?? null,
                ]);

                $invoice->amount_paid += $validated['amount'];
                if (round($invoice->amount_paid, 2) >= round($invoice->total_amount, 2)) {
                    $invoice->status = 'paye';
                } else {
                    $invoice->status = 'partiellement_paye';
                }
                $invoice->save();
            });

            return response()->json(['data' => $payment, 'message' => 'Paiement enregistré.'], 201);
            
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Compte non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'enregistrement du paiement.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Attache un document (scan/PDF) à une facture (dépense). (Fct 2.7)
     */
    public function attachDocument(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,png,jpg,jpeg|max:5120',
        ]);

        try {
            $file = $request->file('document');
            $originalName = $file->getClientOriginalName();
            $path = $file->store('invoice_documents', 'local');

            $document = $invoice->documents()->create([
                'file_path' => $path,
                'file_name' => $originalName,
                'file_type' => $file->getClientMimeType(),
            ]);

            return response()->json(['data' => $document, 'message' => 'Document attaché.'], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'upload.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Télécharge un document attaché.
     */
    public function downloadDocument(AttachedDocument $document)
    {
        try {
            if (!Storage::disk('local')->exists($document->file_path)) {
                return response()->json(['message' => 'Fichier non trouvé.'], 404);
            }
            return Storage::disk('local')->download($document->file_path, $document->file_name);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du téléchargement.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprime un document attaché.
     */
    public function deleteDocument(AttachedDocument $document)
    {
        try {
            Storage::disk('local')->delete($document->file_path);
            $document->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Envoyer la facture par email (RÉEL, AVEC PDF). (Fct 2.7)
     */
    public function sendInvoice(Request $request, Invoice $invoice)
    {
        try {
            // 0. Vérifier si c'est une facture client et s'il y a un email
            if ($invoice->type != 'client' || empty($invoice->thirdParty->email)) {
                return response()->json(['message' => 'Facture non-client ou e-mail du client manquant.'], 400);
            }

            // 1. Charger les relations nécessaires pour le PDF
            $invoice->load(['thirdParty', 'lines', 'payments']);

            // 2. Générer le PDF
            $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);
            
            // 3. Envoyer l'email avec le PDF en pièce jointe
            Mail::to($invoice->thirdParty->email)
                ->send(new SendInvoiceMail($invoice, $pdf));

            // 4. Mettre à jour le statut
            if ($invoice->status == 'brouillon') {
                $invoice->status = 'envoye';
                $invoice->save();
            }
            
            return response()->json(['message' => 'Facture envoyée avec succès.'], 200);
            
        } catch (\Exception $e) {
            \Log::error('Erreur d\'envoi de facture: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'envoi de la facture.', 'error' => $e->getMessage()], 500);
        }
    }
}