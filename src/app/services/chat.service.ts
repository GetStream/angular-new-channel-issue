import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { AscDesc, Channel, ChannelAPIResponse } from 'stream-chat'
import { ChannelService, ChatClientService, DefaultStreamChatGenerics, StreamI18nService } from 'stream-chat-angular'

import { AuthService } from './auth.service'

enum ChatEvent {
  MessageNew = 'message.new',
  MessageRead = 'message.read',
  ConnectionChanged = 'connection.changed',
  NotificationMarkRead = 'notification.mark_read'
}

enum ChatType {
  Messaging = 'messaging'
}

const API_KEY_STAGING = '5gbpz49wttxx'

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // @Select(GlobalState.currentLanguage) currentLanguage: Observable<Languages>
  // @SelectSnapshot(DashboardState.user) currentUser: CurrentUserResponse
  // selectedUser = localStorage.getItem('selectedUser') ? JSON.parse(localStorage.getItem('selectedUser')!) : null

  channels: Channel<DefaultStreamChatGenerics>[] = []
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject(false)

  constructor(
    // private store: Store,
    private chatClientService: ChatClientService,
    public channelService: ChannelService,
    private authService: AuthService,
    private streamI18nService: StreamI18nService
  ) {}

  initChat(userId: string): void {
    this.authService.getStreamToken().subscribe((token) => {
      const userToken = token
      this.chatClientService.init(API_KEY_STAGING, userId, userToken)
      this.initChatChannels(userId).then((channels) => {
        this.isLoading.next(false)
        if (channels.length) {
          this.channels = channels
        }
        this.connectionListener(userId)
        // this.unreadTotalCountListener()
      })
    })
  }

  async initChatChannels(userId: string): Promise<Channel<DefaultStreamChatGenerics>[]> {
    this.isLoading.next(true)
    const filter = { type: ChatType.Messaging, members: { $in: [userId] } }
    const sort = { last_message_at: -1 as AscDesc }

    // this.currentLanguage.subscribe((language) =>
    //   this.streamI18nService.setTranslation(language, translations[language])
    // )
    return this.channelService.init(filter, sort)
  }

  private connectionListener(userId): void {
    this.chatClientService.chatClient?.on((event) => {
      if (event.type === ChatEvent.ConnectionChanged && !event.online) {
        // Temporary console.log to debug client connection on prod
        console.log(event.type)
        this.authService.getStreamToken().subscribe((token) => {
          const userToken = token
          this.chatClientService.chatClient.connectUser({ id: userId }, userToken)
        })
      }
    })
  }

  async createChannel(myId: string, userUUID: string): Promise<ChannelAPIResponse<DefaultStreamChatGenerics>> {
    const channel = this.chatClientService.chatClient.channel(ChatType.Messaging, {
      watch: true,
      state: true,
      presence: true,
      shouldSetActiveChannel: true,
      members: [myId, userUUID]
    })
    return await channel.create()
  }

  setActiveChannel(channelId): void {
    this.channelService.init({ type: ChatType.Messaging, id: { $eq: channelId } })
    this.channelService.channels$.subscribe((channels) => {
      const activeChannel = channels?.find((channel) => channel.id === channelId)
      if (activeChannel) {
        this.channelService.setAsActiveChannel(activeChannel)
      }
    })
  }

  // async searchByChatName(chatName: string): Promise<void> {
  //   const filter = {
  //     type: ChatType.Messaging,
  //     members: { $in: [this.currentUser.uuid] },
  //     name: { $autocomplete: chatName }
  //   }
  //   const sort = { last_message_at: -1 as AscDesc }

  //   const channels = await this.chatClientService.chatClient.queryChannels(filter, sort, { limit: 30 })
  //   if (channels.length) {
  //     const channelsIds = channels.map((channel: Channel) => channel.id)

  //     this.channelService.init({
  //       type: ChatType.Messaging,
  //       id: { $in: channelsIds as string[] }
  //     })
  //   }
  // }

   // private unreadTotalCountListener(): void {
  //   const client = this.chatClientService.chatClient
  //   client.on((event) => {
  //     if (
  //       event.total_unread_count !== undefined &&
  //       (event.type === ChatEvent.MessageNew || event.type === ChatEvent.NotificationMarkRead)
  //     ) {
  //       this.store.dispatch(new SetUnreadChatMessagesCount(event.total_unread_count))
  //     }
  //   })
  // }
}
