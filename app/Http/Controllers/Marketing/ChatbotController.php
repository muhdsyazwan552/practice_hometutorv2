<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Services\MarketingChatbot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatbotController extends Controller
{
    public function __invoke(Request $request, MarketingChatbot $chatbot): JsonResponse
    {
        $locale = $request->input('locale', app()->getLocale());
        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string', 'max:2000'],
            'locale' => ['sometimes', 'string', 'in:en,ms'],
        ]);
        if ($validator->fails()) {
            return response()->json(['reply' => $locale === 'ms'
                ? 'Sila taip mesej antara 1 hingga 2000 aksara.'
                : 'Please enter a message between 1 and 2000 characters.'], 422);
        }
        return response()->json($chatbot->reply(trim($request->input('message')), $locale));
    }
}
