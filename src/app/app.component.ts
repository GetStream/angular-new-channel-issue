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

const API_KEY_STAGING = '5gbpz49wttxx'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  me: User = { id: 1, name: 'Ilya Konrad', uuid: '8bed582f-3daa-417a-a78b-265c0f6d151d' }
  users: User[] = [
    { id: 2, name: 'User 2', uuid: 'fb3199c0-cedb-42c8-9e7f-5be9f8bb6d17' },
    { id: 3, name: 'User 3', uuid: 'bd67757a-4e3a-4e9a-b370-19daf2956d90' },
    { id: 4, name: 'User 4', uuid: '7838792a-6ec9-4389-9a6c-8a9981ea5a73' }
  ]

  constructor(
    private chatClientService: ChatClientService,
    private chatService: ChatService,
    private channelService: ChannelService,
    private streamI18nService: StreamI18nService
  ) {
    const apiKey = API_KEY_STAGING;
    const userId = 'ilya2';
    const userToken = 'y8afyfq3u8a5';
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiaWx5YTIifQ.U0ivDjYIjNATy-o1HdzuHBNIvvR9DDUXMaW-lJ0pza8

    this.chatClientService.init(apiKey, userId, userToken);
    this.streamI18nService.setTranslation();
    this.channelService.init({
      type: 'messaging',
      members: { $in: [userId] },
    });
    // Creating a new channel
    const channel = this.chatClientService.chatClient.channel('messaging', {
      members: [
        ...this.users.map((user) => user.name)
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

  ngOnInit(): void {
    // this.initChat()
  }

  initChat(): void {
    this.chatService.initChat(this.me.uuid)
  }

  selectUser(user: User): void {
    localStorage.setItem('selectedUser', JSON.stringify(user))
  }
}
