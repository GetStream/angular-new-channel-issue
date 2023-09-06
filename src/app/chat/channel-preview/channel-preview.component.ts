import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import {
  Channel,
  Event,
  FormatMessageResponse,
  MessageResponse,
  TranslationLanguages,
  User,
  UserResponse
} from 'stream-chat'
import {
  ChannelService,
  ChatClientService,
  DefaultStreamChatGenerics,
  listUsers,
  StreamMessage
} from 'stream-chat-angular'
import * as moment from 'moment'
import { DateFormat } from '../../enums/date-format'
// import { DateFormat } from '../../../../../../core/enums/global/date-format'

export const getChannelDisplayText = (
  channel: Channel<DefaultStreamChatGenerics>,
  currentUser: UserResponse<DefaultStreamChatGenerics>
) => {
  if (channel.data?.name) {
    return channel.data.name
  }
  if (channel.state.members && Object.keys(channel.state.members).length > 0) {
    const members = Object.values(channel.state.members)
      .map((m) => m.user || { id: m.user_id! })
      .filter((m) => m.id !== currentUser?.id)
    return listUsers(members)
  }
  return channel.id
}

export const getMessageTranslation = <T extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  message?: StreamMessage | MessageResponse | FormatMessageResponse,
  channel?: Channel<T>,
  user?: UserResponse
) => {
  const language = user?.language || (channel?.data?.auto_translation_language as TranslationLanguages)
  if (language && message?.i18n && message?.user?.id !== user?.id) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return message.i18n[`${language}_text` as `${TranslationLanguages}_text`]
  } else {
    return undefined
  }
}

/**
 * The `ChannelPreview` component displays a channel preview in the channel list, it consists of the image, name and latest message of the channel.
 */
@Component({
  selector: 'app-channel-preview',
  templateUrl: './channel-preview.component.html',
  styleUrls: ['./channel-preview.component.scss']
})
export class CustomChannelPreviewComponent implements OnInit, OnDestroy {
  /**
   * The channel to be displayed
   */
  @Input() channel: Channel<DefaultStreamChatGenerics> | undefined
  isActive: boolean = false
  isUnread: boolean = false
  unreadCount: number | undefined
  lastMessageDate: string | Date
  today: string = moment().format('YYYY-MM-DD')

  latestMessage: string = 'streamChat.Nothing yet...'

  private subscriptions: (Subscription | { unsubscribe: () => void })[] = []
  private canSendReadEvents: boolean = true

  get DateFormat() {
    return DateFormat
  }

  get avatarImage(): string | undefined {
    return this.channel?.data?.image
  }

  get avatarName(): string | undefined {
    return this.channel?.data?.name
  }

  get title(): string | undefined {
    if (!this.channel) {
      return ''
    }
    return getChannelDisplayText(this.channel, this.chatClientService.chatClient.user!)
  }

  constructor(
    private channelService: ChannelService,
    private ngZone: NgZone,
    private chatClientService: ChatClientService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.channelService.activeChannel$.subscribe(
        (activeChannel) => (this.isActive = activeChannel?.id === this.channel?.id)
      )
    )
    const messages = this.channel?.state?.latestMessages
    if (messages && messages.length > 0) {
      this.setLatestMessage(messages[messages.length - 1])
    }
    this.updateUnreadState()
    const capabilities = (this.channel?.data?.own_capabilities as string[]) || []
    this.canSendReadEvents = capabilities.indexOf('read-events') !== -1
    this.subscriptions.push(this.channel!.on('message.new', this.handleMessageEvent.bind(this)))
    this.subscriptions.push(this.channel!.on('message.updated', this.handleMessageEvent.bind(this)))
    this.subscriptions.push(this.channel!.on('message.deleted', this.handleMessageEvent.bind(this)))
    this.subscriptions.push(this.channel!.on('channel.truncated', this.handleMessageEvent.bind(this)))
    this.subscriptions.push(
      this.channel!.on('message.read', () =>
        this.ngZone.run(() => {
          this.updateUnreadState()
        })
      )
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  setAsActiveChannel(): void {
    void this.channelService.setAsActiveChannel(this.channel!)
  }

  private handleMessageEvent(event: Event): void {
    this.ngZone.run(() => {
      if (this.channel?.state.latestMessages.length === 0) {
        this.latestMessage = 'streamChat.Nothing yet...'
        return
      }
      if (
        !event.message ||
        this.channel?.state.latestMessages[this.channel?.state.latestMessages.length - 1].id !== event.message.id
      ) {
        return
      }
      this.setLatestMessage(event.message)
      this.updateUnreadState()
    })
  }

  private setLatestMessage(message?: FormatMessageResponse | MessageResponse): void {
    this.lastMessageDate =
      moment(message?.updated_at).format('YYYY-MM-DD') === this.today
        ? moment(message?.updated_at).format(DateFormat.hoursAndMinutes)
        : moment(message?.updated_at).format('LL')

    if (message?.deleted_at) {
      this.latestMessage = 'streamChat.Message deleted'
    } else if (message?.text) {
      this.latestMessage =
        getMessageTranslation(message, this.channel, this.chatClientService.chatClient.user) || message.text
    } else if (message?.attachments && message.attachments.length) {
      this.latestMessage = 'streamChat.🏙 Attachment...'
    }
  }

  private updateUnreadState(): void {
    if (this.isActive || !this.canSendReadEvents) {
      this.unreadCount = 0
      this.isUnread = false
      return
    }
    this.unreadCount = this.channel!.countUnread()
    this.isUnread = !!this.unreadCount
  }
}
