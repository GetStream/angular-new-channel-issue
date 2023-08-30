import { Component } from '@angular/core';
import { filter, take } from 'rxjs';
import {
  ChatClientService,
  ChannelService,
  StreamI18nService,
} from 'stream-chat-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private chatService: ChatClientService,
    private channelService: ChannelService,
    private streamI18nService: StreamI18nService
  ) {
    const apiKey = '';
    const userId = '';
    const userToken = '';

    this.chatService.init(apiKey, userId, userToken);
    this.streamI18nService.setTranslation();
    this.channelService.init({
      type: 'messaging',
      members: { $in: [userId] },
    });
    // Creating a new channel
    const channel = this.chatService.chatClient.channel('messaging', {
      members: [
        /* provide members here */
      ],
    });

    // Selecting channel
    this.channelService.channels$
      .pipe(
        // This will get us the current channel list (if list is not yet inited, it will wait for init)
        filter((channels) => !!channels),
        take(1)
      )
      .subscribe(async () => {
        try {
          await channel.watch();
          this.channelService.setAsActiveChannel(channel);
        } catch (error) {
          console.error(error);
          throw error;
        }
      });
  }
}
