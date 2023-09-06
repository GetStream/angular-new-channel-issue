import { Component, OnInit } from '@angular/core';
import { filter, take } from 'rxjs';
import {
  ChatClientService,
  ChannelService,
  StreamI18nService,
} from 'stream-chat-angular';
import { ChatService } from './services/chat.service';

export interface User {
  id: number
  uuid: string
  name: string
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  me: User = { id: 1, name: 'Ilya Konrad', uuid: '8bed582f-3daa-417a-a78b-265c0f6d151d' }
  users: User[] = []

  constructor(
    private chatService: ChatService,
    private channelService: ChannelService,
    private streamI18nService: StreamI18nService
  ) {
    // const apiKey = '';
    // const userId = '';
    // const userToken = '';

    // this.chatService.init(apiKey, userId, userToken);
    // this.streamI18nService.setTranslation();
    // this.channelService.init({
    //   type: 'messaging',
    //   members: { $in: [userId] },
    // });
    // // Creating a new channel
    // const channel = this.chatService.chatClient.channel('messaging', {
    //   members: [
    //     /* provide members here */
    //   ],
    // });

    // // Selecting channel
    // this.channelService.channels$
    //   .pipe(
    //     // This will get us the current channel list (if list is not yet inited, it will wait for init)
    //     filter((channels) => !!channels),
    //     take(1)
    //   )
    //   .subscribe(async () => {
    //     try {
    //       await channel.watch();
    //       this.channelService.setAsActiveChannel(channel);
    //     } catch (error) {
    //       console.error(error);
    //       throw error;
    //     }
    //   });
  }

  ngOnInit(): void {
    this.initChat()
  }

  initChat(): void {
    this.chatService.initChat(this.me.uuid)
  }

  selectUser(user: User): void {
    localStorage.setItem('selectedUser', JSON.stringify(user))
  }
}
