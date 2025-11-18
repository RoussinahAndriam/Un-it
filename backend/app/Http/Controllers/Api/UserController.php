<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest; // <-- Utilisation de Form Request
use App\Http\Requests\UpdateUserRequest; // <-- Utilisation de Form Request
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // (Note: Ce contrôleur est protégé par 'auth:sanctum' et 'role:admin' dans routes/api.php)

    /**
     * Affiche la liste des utilisateurs.
     */
    public function index()
    {
        try {
            $users = User::all();
            return response()->json(['data' => $users], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Crée un nouvel utilisateur (Admin).
     */
    public function store(StoreUserRequest $request) // <-- Utilisation de Form Request
    {
        $validated = $request->validated();
        
        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
            ]);
            return response()->json(['data' => $user, 'message' => 'Utilisateur créé.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Affiche un utilisateur spécifique.
     */
    public function show(User $user)
    {
        return response()->json(['data' => $user], 200);
    }

    /**
     * Met à jour un utilisateur (Admin).
     */
    public function update(UpdateUserRequest $request, User $user) // <-- Utilisation de Form Request
    {
        $validated = $request->validated();
        
        try {
            $user->fill($validated);
            
            if (isset($validated['password'])) {
                $user->password = Hash::make($validated['password']);
            }

            $user->save();
            return response()->json(['data' => $user, 'message' => 'Utilisateur mis à jour.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprime un utilisateur (Admin).
     */
    public function destroy(User $user)
    {
        try {
            if ($user->id === Auth::id()) {
                return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
            }
            
            $user->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()], 500);
        }
    }
}