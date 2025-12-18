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
 * Met à jour une facture.
 */
public function update(Request $request, Invoice $invoice)
{
    try {
        \Log::info('Updating invoice', [
            'id' => $invoice->id,
            'data_received' => $request->all(),
            'invoice_current' => $invoice->toArray()
        ]);

        // Valider les données
        $validated = $request->validate([
            'invoice_number' => 'sometimes|string|max:50',
            'type' => 'sometimes|in:client,depense',
            'third_party_id' => 'sometimes|exists:third_parties,id',
            'issue_date' => 'sometimes|date_format:Y-m-d',
            'due_date' => 'sometimes|date_format:Y-m-d',
            'status' => 'sometimes|in:brouillon,envoye,partiellement_paye,paye,en_retard,annule',
            'payment_terms' => 'nullable|string',
            'lines' => 'nullable|array',
            'lines.*.id' => 'nullable|exists:invoice_lines,id',
            'lines.*.designation' => 'required_with:lines|string',
            'lines.*.quantity' => 'required_with:lines|numeric|min:0',
            'lines.*.unit_price' => 'required_with:lines|numeric|min:0',
            'lines.*.tax_rate' => 'required_with:lines|numeric|min:0|max:100',
            'lines.*.discount' => 'nullable|numeric|min:0|max:100',
        ]);

        // Formater les dates si elles existent
        if (isset($validated['issue_date'])) {
            // Si la date vient avec le timezone (2025-12-03T00:00:00.000000Z)
            $issueDate = $validated['issue_date'];
            if (strpos($issueDate, 'T') !== false) {
                $validated['issue_date'] = date('Y-m-d', strtotime($issueDate));
            }
        }

        if (isset($validated['due_date'])) {
            $dueDate = $validated['due_date'];
            if (strpos($dueDate, 'T') !== false) {
                $validated['due_date'] = date('Y-m-d', strtotime($dueDate));
            }
        }

        \Log::info('Validated data after formatting:', $validated);

        DB::beginTransaction();

        // Mettre à jour les informations de base
        $invoice->update($validated);

        // Mettre à jour les lignes si elles sont fournies
        if (isset($validated['lines'])) {
            $subtotal = 0;
            $tax_amount = 0;

            // Supprimer les anciennes lignes
            $invoice->lines()->delete();

            // Ajouter les nouvelles lignes
            foreach ($validated['lines'] as $lineData) {
                $lineTotal = $lineData['quantity'] * $lineData['unit_price'] * (1 - ($lineData['discount'] ?? 0) / 100);
                $subtotal += $lineTotal;
                $tax_amount += $lineTotal * ($lineData['tax_rate'] ?? 0) / 100;

                $invoice->lines()->create($lineData);
            }

            // Recalculer les totaux
            $invoice->subtotal = $subtotal;
            $invoice->tax_amount = $tax_amount;
            $invoice->total_amount = $subtotal + $tax_amount;
        }

        $invoice->save();

        DB::commit();

        // Recharger les relations
        $invoice->load(['thirdParty', 'lines', 'payments', 'documents']);

        return response()->json([
            'data' => $invoice,
            'message' => 'Facture mise à jour avec succès.'
        ], 200);

    } catch (\Illuminate\Validation\ValidationException $e) {
        DB::rollBack();
        \Log::error('Validation error updating invoice: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error updating invoice: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur lors de la mise à jour de la facture',
            'error' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTrace() : null
        ], 500);
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

    public function sendInvoice(Request $request, Invoice $invoice)
    {
        try {
    
            if ($invoice->type != 'client' || empty($invoice->thirdParty->email)) {
                return response()->json(['message' => 'Facture non-client ou e-mail du client manquant.'], 400);
            }
            $invoice->load(['thirdParty', 'lines', 'payments']);

            $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);

            Mail::to($invoice->thirdParty->email)
                ->send(new SendInvoiceMail($invoice, $pdf));

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