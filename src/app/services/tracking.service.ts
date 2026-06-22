import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private readonly http = inject(HttpClient);

  // PLACEHOLDER: Replace this URL with your actual Discord Webhook URL.
  private readonly webhookUrl = 'YOUR_DISCORD_WEBHOOK_URL_HERE';

  /**
   * Sends an alert to the configured Discord Webhook.
   * If the webhook is not configured or fails, it will fail silently.
   */
  sendDiscordAlert(message: string): void {
    console.log(`[TrackingService] Discord Log: ${message}`);
    
    if (!this.webhookUrl || this.webhookUrl.includes('YOUR_DISCORD_WEBHOOK_URL')) {
      return;
    }

    const payload = {
      content: message,
      embeds: [
        {
          color: 16741772, // #ff758c (accent pink)
          description: `🕒 Local Time: ${new Date().toLocaleString('ru-RU')}`,
          footer: {
            text: 'Сванетия 2026 🏔️'
          }
        }
      ]
    };

    this.http.post(this.webhookUrl, payload)
      .pipe(
        catchError((error) => {
          console.error('Error sending Discord alert', error);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Tracks custom event in Microsoft Clarity (if loaded).
   */
  trackClarityEvent(eventName: string): void {
    console.log(`[TrackingService] Clarity Event: ${eventName}`);
    const clarity = (window as any).clarity;
    if (typeof clarity === 'function') {
      try {
        clarity('event', eventName);
      } catch (err) {
        console.error('Error tracking Clarity event:', err);
      }
    }
  }
}
