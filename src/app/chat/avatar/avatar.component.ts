import { Component, Input, NgZone, OnChanges, SimpleChanges } from '@angular/core'
import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'
import { Channel, User, UserResponse } from 'stream-chat'
import { AvatarLocation, AvatarType, ChatClientService, DefaultStreamChatGenerics } from 'stream-chat-angular'


@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: []
})
export class AvatarComponent implements OnChanges {
  @Input() name: string | undefined
  @Input() imageUrl: string | undefined
  @Input() size: number = 32
  @Input() location: AvatarLocation | undefined
  @Input() channel?: Channel<DefaultStreamChatGenerics>
  @Input() user?: User<DefaultStreamChatGenerics>
  @Input() type: AvatarType | undefined
  @Input() showOnlineIndicator: boolean = true

  isLoaded: boolean = false
  isError: boolean = false
  isOnline: boolean = false

  private isOnlineSubscription?: Subscription

  get initials(): string {
    let result: string = ''
    if (this.type === 'user') {
      result = this.name?.toString() || ''
    } else if (this.type === 'channel') {
      if (this.channel?.data?.name) {
        result = this.channel?.data?.name
      } else {
        const otherMember = this.getOtherMemberIfOneToOneChannel()
        if (otherMember) {
          result = otherMember.name || otherMember.id || ''
        }
      }
    }

    return result.charAt(0) || ''
  }

  get fallbackChannelImage(): string | undefined {
    if (this.type !== 'channel') {
      return undefined
    } else {
      const otherMember = this.getOtherMemberIfOneToOneChannel()
      if (otherMember) {
        return otherMember.image
      } else {
        return undefined
      }
    }
  }

  get groupDefaultAvatar(): string | undefined {
    const otherMember = this.getOtherMemberIfOneToOneChannel()
    const logo = '../../../../../../../assets/img/new/logo-sidebar.svg'
    if (this.type === 'channel' && !otherMember) {
      return logo
    }
  }

  constructor(private chatClientService: ChatClientService, private ngZone: NgZone) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['channel']) {
      if (this.channel) {
        const otherMember = this.getOtherMemberIfOneToOneChannel()
        if (otherMember) {
          this.isOnlineSubscription = this.chatClientService.events$
            .pipe(filter((e) => e.eventType === 'user.presence.changed'))
            .subscribe((event) => {
              if (event.event.user?.id === otherMember.id) {
                this.ngZone.run(() => {
                  this.isOnline = event.event.user?.online || false
                })
              }
            })
          try {
            const response = await this.chatClientService.chatClient.queryUsers({
              id: { $eq: otherMember.id }
            })
            this.isOnline = response.users[0]?.online || false
          } catch (error) {
            // Fallback if we can't query user -> for example due to permission problems
            this.isOnline = otherMember.online || false
          }
        } else {
          this.isOnlineSubscription?.unsubscribe()
        }
      } else {
        this.isOnline = false
        this.isOnlineSubscription?.unsubscribe()
      }
    }
  }

  private getOtherMemberIfOneToOneChannel(): UserResponse<DefaultStreamChatGenerics> | undefined {
    const otherMembers = Object.values(this.channel?.state?.members || {}).filter(
      (m) => m.user_id !== this.chatClientService.chatClient.user?.id
    )
    if (otherMembers.length === 1) {
      return otherMembers[0].user
    } else {
      return undefined
    }
  }
}
