import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef } from '@angular/core'
import { Subscription } from 'rxjs'
import { Channel, UserResponse } from 'stream-chat'
import {
  ChannelActionsContext,
  ChannelListToggleService,
  ChannelService,
  ChatClientService,
  CustomTemplatesService,
  DefaultStreamChatGenerics,
  listUsers
} from 'stream-chat-angular'

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

/**
 * The `ChannelHeader` component displays the avatar and name of the currently active channel along with member and watcher information. You can read about [the difference between members and watchers](https://getstream.io/chat/docs/javascript/watch_channel/?language=javascript#watchers-vs-members) in the platform documentation. Please note that number of watchers is only displayed if the user has [`connect-events` capability](https://getstream.io/chat/docs/javascript/channel_capabilities/?language=javascript)
 */
@Component({
  selector: 'app-channel-header',
  templateUrl: './channel-header.component.html',
  styleUrls: ['./channel-header.component.scss']
})
export class ChannelHeaderComponent implements OnInit, OnDestroy {
  channelActionsTemplate?: TemplateRef<ChannelActionsContext>
  activeChannel: Channel<DefaultStreamChatGenerics> | undefined
  canReceiveConnectEvents: boolean | undefined

  private subscriptions: Subscription[] = []

  get memberCountParam(): { memberCount: number } {
    return { memberCount: this.activeChannel?.data?.member_count || 0 }
  }

  get watcherCountParam(): { watcherCount: number } {
    return { watcherCount: this.activeChannel?.state?.watcher_count || 0 }
  }

  get displayText(): string | undefined {
    if (!this.activeChannel) {
      return ''
    }
    return getChannelDisplayText(this.activeChannel, this.chatClientService.chatClient.user!)
  }

  get avatarName(): string | undefined {
    return this.activeChannel?.data?.name
  }

  constructor(
    private channelService: ChannelService,
    private channelListToggleService: ChannelListToggleService,
    private customTemplatesService: CustomTemplatesService,
    private cdRef: ChangeDetectorRef,
    private chatClientService: ChatClientService
  ) {
    this.channelService.activeChannel$.subscribe((c) => {
      this.activeChannel = c
      const capabilities = this.activeChannel?.data?.own_capabilities as string[]
      if (!capabilities) {
        return
      }
      this.canReceiveConnectEvents = capabilities.indexOf('connect-events') !== -1
    })
  }
  ngOnInit(): void {
    this.subscriptions.push(
      this.customTemplatesService.channelActionsTemplate$.subscribe((template) => {
        this.channelActionsTemplate = template
        this.cdRef.detectChanges()
      })
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  toggleMenu(event: Event) {
    event.stopPropagation()
    this.channelListToggleService.toggle()
  }

  getChannelActionsContext(): ChannelActionsContext {
    return { channel: this.activeChannel! }
  }
}
