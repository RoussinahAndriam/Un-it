<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\SendLinkRestPassword;
use App\Models\User;
use App\Models\VerifyOtp;
use App\Mail\SendOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Inscription avec envoi d'OTP
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|in:admin,comptable,employe'
        ]);
        
        // recuperation de l'utilisateur par email
     
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role ?? 'employe',
            ]);

            return response()->json([
                'message' => 'Utilisateur créé',
                'user' => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Connexion
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Email ou mot de passe incorrect.'], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connecté avec succès.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 200);
    }

    /**
     * Vérification de l'OTP (inscription ou mot de passe oublié)
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $otpEntry = VerifyOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otpEntry) {
            return response()->json(['message' => 'OTP invalide ou expiré.'], 400);
        }

        $otpEntry->delete();

        return response()->json([
            'message' => 'OTP validé avec succès. Email vérifié.',
        ], 200);
    }

    /**
     * Mot de passe oublié → envoi token
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        $token = Str::random(60);
        $expiresAt = Carbon::now()->addMinutes(15);

        $user->forceFill([
            'password_reset_token' => $token,
            'password_reset_expires_at' => $expiresAt,
        ])->save();

         try {
            Mail::to($user->email)->send(new SendLinkRestPassword($token));
            Log::info("Lien de réinitialisation envoyé à {$user->email} : {$token}");
        } catch (\Exception $e) {
            Log::error("Échec envoi OTP à {$user->email} : " . $e->getMessage());
        }

        return response()->json([
            'message' => 'OTP envoyé. Utilisez-le avec le lien de réinitialisation.',
        ], 200);
    }

    /**
     * Réinitialiser le mot de passe
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('password_reset_token', $request->token)
            ->where('password_reset_expires_at', '>', Carbon::now())
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Token invalide ou expiré.'], 400);
        }

        $user->password = Hash::make($request->password);
        $user->password_reset_token = null;
        $user->password_reset_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.'
        ], 200);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Déconnecté avec succès.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la déconnexion.'], 500);
        }
    }

    /**
     * Récupérer l'utilisateur connecté
     */
    public function user(Request $request)
    {
        return response()->json($request->user(), 200);
    }

    /**
     * Helper : Envoyer l'OTP par email
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        //asiana email existe deja dans user

        VerifyOtp::where('email', $request->email)->delete();

        $otp = rand(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(10);

        VerifyOtp::create([
            'email' => $request->email,
            'otp' => $otp,
            'expires_at' => $expiresAt
        ]);

        try {
            Mail::to($request->email)->send(new SendOtpMail($otp));
            Log::info("OTP envoyé à {$request->email} : {$otp}");
        } catch (\Exception $e) {
            Log::error("Échec envoi OTP à {$request->email} : " . $e->getMessage());
        }
    }
}