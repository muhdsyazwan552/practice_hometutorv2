<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ParentWelcome extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $parent) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Welcome to HomeTutor');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.parent-welcome');
    }
}
