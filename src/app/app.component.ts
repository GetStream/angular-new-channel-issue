import { Component, OnInit } from '@angular/core';
import { filter, take } from 'rxjs';
import {
  ChatClientService,
  ChannelService,
  StreamI18nService,
} from 'stream-chat-angular';
import { ChatService } from './services/chat.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChatBottomSheetComponent } from './chat-bottom-sheet/chat-bottom-sheet.component';

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
  me: User = { id: 1, name: 'Ilya Konrad', uuid: 'ilya2' }
  users: User[] = [
    { id: 2, name: 'User 2', uuid: 'fb3199c0-cedb-42c8-9e7f-5be9f8bb6d17' },
    { id: 3, name: 'User 3', uuid: 'bd67757a-4e3a-4e9a-b370-19daf2956d90' },
    { id: 4, name: 'User 4', uuid: '7838792a-6ec9-4389-9a6c-8a9981ea5a73' },
    { id: 5, name: 'User 5', uuid: '6a506972-9790-4bf2-a9da-e6f1348bfcd7' },
    { id: 6, name: 'User 6', uuid: 'f82a5fe7-6709-482d-84ec-dea89cdf2fa2' },
    { id: 7, name: 'User 7', uuid: 'acbf0078-d901-4719-9f1d-c0359347a1f8' },
    { id: 8, name: 'User 8', uuid: '22f36873-3b33-4287-968c-7b23ea0eca31' },
    { id: 9, name: 'User 9', uuid: 'efbebccd-ba76-4dc9-a2f2-6df68e782ddf' },
    { id: 10, name: 'User 10', uuid: '1a6a8cae-87fe-4324-82ab-2d289c40d297' }
  ]
  selectedUser: User | null = null

  constructor(
    private chatClientService: ChatClientService,
    private chatService: ChatService,
    private channelService: ChannelService,
    private streamI18nService: StreamI18nService,
    private bottomSheet: MatBottomSheet
  ) {
    // const apiKey = API_KEY_STAGING;
    // const userId = 'ilya2';
    // const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiaWx5YTIifQ.zvKmMDeWNg4ZPXGQlRAERabRnnehRUuHgQR5Hnjf1xo';

    // this.chatClientService.init(apiKey, userId, userToken);
    // this.streamI18nService.setTranslation();
    // this.channelService.init({
    //   type: 'messaging',
    //   members: { $in: [userId] },
    // });
    // // Creating a new channel
    // const channel = this.chatClientService.chatClient.channel('messaging', {
    //   members: [this.me.uuid, this.users[0].uuid],
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

  openBottomSheet(): void {
    this.bottomSheet.open(ChatBottomSheetComponent, { direction: 'ltr' })
  }

  initChat(): void {
    this.chatService.initChat(this.me.uuid)
  }

  selectUser(user: User): void {
    // debugger;
    // localStorage.setItem('selectedUser', JSON.stringify(user))
    this.selectedUser = user
    this.setChatChannel()
    this.openBottomSheet()
  }

  // setChatChannel(): void {
  //   const channel = this.chatClientService.chatClient.channel('messaging', {
  //     members: [this.me.uuid, this.selectedUser!.uuid],
  //     watch: true,
  //     state: true
  //   })
  //   // debugger;
  //   if (channel.cid.includes('undefined')) {
  //     this.chatService.createChannel(this.me.uuid, this.selectedUser!.uuid).then(
  //       (result) => this.chatService.setActiveChannel(result.channel.id),
  //       (error) => console.error(error)
  //     )
  //   } else {
  //     this.channelService.setAsActiveChannel(channel)
  //   }
  // }

  private setChatChannel(): void {
    const channel = this.chatClientService.chatClient.channel('messaging', {
      members: [this.me.uuid, this.selectedUser!.uuid]
      // watch: true,
      // state: true
    })
    console.log(channel.cid)

    this.channelService.channels$
      .pipe(
        // This will get us the current channel list (if list is not yet inited, it will wait for init)
        filter((channels) => !!channels),
        take(1)
      )
      .subscribe(async (channels) => {
        console.log(channels)
        // if (!channels?.find((c) => c.cid === channel.cid)) {
        // console.log('if (!channels?.find((c) => c.cid === channel.cid)) {');
        // We only need to init the channel if it's not yet part of the channel list (if it's part of the channel list, it's already inited)
        try {
          console.log('try {')
          await channel.watch()
        } catch (error) {
          console.error(error.message)
          throw error
        }
        // }
        console.log('this.channelService.setAsActiveChannel(channel)')
        this.channelService.setAsActiveChannel(channel)
      })
  }
}
