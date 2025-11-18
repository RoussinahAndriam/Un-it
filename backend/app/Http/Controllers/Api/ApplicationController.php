<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreApplicationRequest; // <-- Utilisation de Form Request
use App\Http\Requests\UpdateApplicationRequest; // <-- Utilisation de Form Request

class ApplicationController extends Controller
{
    /**
     * Affiche l'inventaire des applications. (Fct 2.6)
     */
    public function index(Request $request)
    {
        try {
            $query = Application::with('owner'); 

            if ($request->has('expires_soon')) {
                $query->where('renewal_date', '>', now())
                      ->where('renewal_date', '<=', now()->addDays(30));
            }

            $applications = $query->get();
            return response()->json(['data' => $applications], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Enregistre une nouvelle application/licence. (Fct 2.6)
     */
    public function store(StoreApplicationRequest $request) // <-- Utilisation de Form Request
    {
        try {
            $application = Application::create($request->validated());
            return response()->json(['data' => $application, 'message' => 'Application créée.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création.'], 500);
        }
    }

    /**
     * Affiche une application spécifique.
     */
    public function show(Application $application)
    {
        try {
            return response()->json(['data' => $application->load('owner')], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Application non trouvée.'], 404);
        }
    }

    /**
     * Met à jour une application/licence.
     */
    public function update(UpdateApplicationRequest $request, Application $application) // <-- Utilisation de Form Request
    {
        try {
            $application->update($request->validated());
            return response()->json(['data' => $application, 'message' => 'Application mise à jour.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Application non trouvée.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Supprime une application de l'inventaire.
     */
    public function destroy(Application $application)
    {
        try {
            $application->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Application non trouvée.'], 404);
        }
    }
}