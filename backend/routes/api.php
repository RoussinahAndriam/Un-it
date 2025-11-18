<?php

use App\Http\Controllers\Api\exportController;
use App\Http\Controllers\Api\pdfController;
use App\Http\Controllers\Api\RapportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Importation de tous les contrôleurs
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AssetLoanController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\RecurringOperationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ThirdPartyController;
use App\Http\Controllers\Api\TransactionCategoryController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/stats', [rapportController::class, 'index']);
Route::get('/stats/export/excel', [ExportController::class, 'exportExcel']);
Route::get('/stats/export/pdf', [PdfController::class, 'exportPdf']);


Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);


    Route::apiResource('/users', UserController::class);

    
    
    Route::apiResource('/accounts', AccountController::class);
    
    Route::apiResource('/transactions', TransactionController::class);
    Route::apiResource('/transaction-categories', TransactionCategoryController::class);

    Route::apiResource('/recurring-operations', RecurringOperationController::class);
    Route::post('/recurring-operations/{id}/execute', [RecurringOperationController::class, 'execute']);
    
    Route::apiResource('/assets', AssetController::class);
    Route::apiResource('/asset-loans', AssetLoanController::class);
    Route::put('/asset-loans/{id}/return', [AssetLoanController::class, 'returnLoan']);
    
    Route::apiResource('/applications', ApplicationController::class);

    
    Route::apiResource('/third-parties', ThirdPartyController::class);

    Route::apiResource('/invoices', InvoiceController::class);
    
    Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'addPayment']);
    Route::post('/invoices/{invoice}/documents', [InvoiceController::class, 'attachDocument']);
    Route::get('/invoices/documents/{document}', [InvoiceController::class, 'downloadDocument'])
        ->name('documents.download'); // Nommé pour la signature
    Route::delete('/invoices/documents/{document}', [InvoiceController::class, 'deleteDocument']);
    Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'sendInvoice']);

    Route::get('/reports/financial-summary', [ReportController::class, 'financialSummary']);
    Route::get('/reports/asset-summary', [ReportController::class, 'assetSummary']);
 Route::get('/reports/monthly-stats', [ReportController::class, 'monthlyStats']);
    Route::get('/reports/export/excel', [ReportController::class, 'exportExcel']);
    Route::get('/reports/export/pdf', [ReportController::class, 'exportPdf']);

});