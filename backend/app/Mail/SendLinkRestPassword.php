<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class SendLinkRestPassword extends Mailable
{
    use Queueable, SerializesModels;

    public $token;

    public function __construct($token)
    {
        $this->token = $token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Lien de réinitialisation du mot de passe',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reste-password',
            with: ['token' => $this->token]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}