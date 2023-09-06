import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core'
import { Observable, Subscription } from 'rxjs'
import { filter, map, tap } from 'rxjs/operators'
import { getGroupStyles, GroupStyle } from './group-styles'
import { UserResponse } from 'stream-chat'
import {
  ChannelService,
  ChatClientService,
  CustomTemplatesService,
  DefaultStreamChatGenerics,
  listUsers,
  MessageContext,
  StreamMessage,
  TypingIndicatorContext
} from 'stream-chat-angular'

/**
 * The `MessageList` component renders a scrollable list of messages.
 */
@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styles: []
})
export class MessageListComponent implements AfterViewChecked, OnChanges, OnInit, OnDestroy, AfterViewInit {
  @HostBinding('class') private class =
    'str-chat-angular__main-panel-inner str-chat-angular__message-list-host str-chat__main-panel-inner'
  @ViewChild('scrollContainer')
  private scrollContainer!: ElementRef<HTMLElement>
  @ViewChild('parentMessageElement')
  private parentMessageElement!: ElementRef<HTMLElement>
  /**
   * Determines if the message list should display channel messages or [thread messages](https://getstream.io/chat/docs/javascript/threads/?language=javascript).
   */
  @Input() mode: 'main' | 'thread' = 'main'
  /**
   * The direction of the messages in the list, `bottom-to-top` means newest message is at the bottom of the message list and users scroll upwards to load older messages
   */
  @Input() direction: 'bottom-to-top' | 'top-to-bottom' = 'bottom-to-top'
  /**
   * Determines what triggers the appearance of the message options: by default you can hover (click on mobile) anywhere in the row of the message (`message-row` option), or you can set `message-bubble`, in that case only a hover (click on mobile) in the message bubble will trigger the options to appear.
   */
  @Input() messageOptionsTrigger: 'message-row' | 'message-bubble' = 'message-row'

  typingIndicatorTemplate: TemplateRef<TypingIndicatorContext> | undefined
  messageTemplate: TemplateRef<MessageContext> | undefined
  messages$!: Observable<StreamMessage[]>
  messages: StreamMessage[]
  enabledMessageActions: string[] = []
  unreadMessageCount: number = 0
  isUserScrolled: boolean | undefined
  groupStyles: GroupStyle[] = []
  lastSentMessageId: string | undefined
  parentMessage: StreamMessage | undefined
  highlightedMessageId: string | undefined
  isLoading: boolean = false
  shouldParse: boolean = false

  private latestMessage: { id: string; created_at: Date } | undefined
  private hasNewMessages: boolean | undefined
  private containerHeight: number | undefined
  private oldestMessage: { id: string; created_at: Date } | undefined
  private olderMassagesLoaded: boolean | undefined
  private isNewMessageSentByUser: boolean | undefined
  private subscriptions: Subscription[] = []
  private newMessageSubscription: { unsubscribe: () => void } | undefined
  private prevScrollTop: number | undefined
  private usersTypingInChannel$!: Observable<UserResponse<DefaultStreamChatGenerics>[]>
  private usersTypingInThread$!: Observable<UserResponse<DefaultStreamChatGenerics>[]>
  private isLatestMessageInList: boolean = true

  get replyCountParam(): { replyCount: number | undefined } {
    return { replyCount: this.parentMessage?.reply_count }
  }

  private get usersTyping$(): Observable<UserResponse<DefaultStreamChatGenerics>[]> {
    return this.mode === 'thread' ? this.usersTypingInThread$ : this.usersTypingInChannel$
  }

  constructor(
    private channelService: ChannelService,
    private chatClientService: ChatClientService,
    private customTemplatesService: CustomTemplatesService
  ) {
    this.subscriptions.push(
      this.channelService.activeChannel$.subscribe((channel) => {
        this.resetScrollState()
        const capabilites = channel?.data?.own_capabilities as string[]
        if (capabilites) {
          this.enabledMessageActions = capabilites
        }
        this.newMessageSubscription?.unsubscribe()
        if (channel) {
          this.newMessageSubscription = channel.on('message.new', (event) => {
            // If we display main channel messages and we're switched to an older message set -> use message.new event to update unread count and detect new messages sent by current user
            if (!event.message || channel.state.messages === channel.state.latestMessages || this.mode === 'thread') {
              return
            }
            this.newMessageReceived({
              id: event.message.id,
              user: event.message.user,
              created_at: new Date(event.message.created_at || '')
            })
          })
        }
      })
    )
    this.subscriptions.push(
      this.channelService.activeParentMessage$.subscribe((message) => {
        if (message && this.parentMessage && message.id !== this.parentMessage.id && this.mode === 'thread') {
          this.resetScrollState()
        }
        this.parentMessage = message
      })
    )
    this.subscriptions.push(
      this.customTemplatesService.messageTemplate$.subscribe((template) => (this.messageTemplate = template))
    )
    this.subscriptions.push(
      this.customTemplatesService.typingIndicatorTemplate$.subscribe(
        (template) => (this.typingIndicatorTemplate = template)
      )
    )
    this.usersTypingInChannel$ = this.channelService.usersTypingInChannel$
    this.usersTypingInThread$ = this.channelService.usersTypingInThread$
  }

  ngOnInit(): void {
    this.setMessages$()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mode || changes.direction) {
      this.setMessages$()
    }
    if (changes.direction) {
      if (this.scrollContainer?.nativeElement) {
        this.jumpToLatestMessage()
      }
    }
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.channelService.jumpToMessage$.pipe(filter((config) => !!config.id)).subscribe((config) => {
        let messageId: string | undefined = undefined
        if (this.mode === 'main') {
          messageId = config.parentId || config.id
        } else if (config.parentId) {
          messageId = config.id
        }
        if (messageId) {
          if (messageId === 'latest') {
            this.scrollToLatestMessage()
          } else {
            this.scrollMessageIntoView(messageId)
            this.highlightedMessageId = messageId
          }
        }
      })
    )
  }

  ngAfterViewChecked(): void {
    if (this.highlightedMessageId) {
      // Turn off programatic scroll adjustments while jump to message is in progress
      this.hasNewMessages = false
      this.olderMassagesLoaded = false
    }
    if (this.direction === 'top-to-bottom') {
      if (this.hasNewMessages && (this.isNewMessageSentByUser || !this.isUserScrolled)) {
        this.isLatestMessageInList ? this.scrollToTop() : this.jumpToLatestMessage()
        this.hasNewMessages = false
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight
      }
    } else {
      if (this.hasNewMessages) {
        if (!this.isUserScrolled || this.isNewMessageSentByUser) {
          this.isLatestMessageInList ? this.scrollToBottom() : this.jumpToLatestMessage()
        }
        this.hasNewMessages = false
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight
      } else if (this.olderMassagesLoaded) {
        this.preserveScrollbarPosition()
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight
        this.olderMassagesLoaded = false
      } else if (this.getScrollPosition() !== 'bottom' && !this.isUserScrolled && !this.highlightedMessageId) {
        this.isLatestMessageInList ? this.scrollToBottom() : this.jumpToLatestMessage()
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe())
    this.newMessageSubscription?.unsubscribe()
  }

  trackByMessageId(index: number, item: StreamMessage): string {
    return item.id
  }

  trackByUserId(index: number, user: UserResponse): string {
    return user.id
  }

  jumpToLatestMessage(): void {
    void this.channelService.jumpToMessage('latest', this.mode === 'thread' ? this.parentMessage?.id : undefined)
  }

  scrollToBottom(): void {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight
  }

  scrollToTop(): void {
    this.scrollContainer.nativeElement.scrollTop = 0
  }

  scrolled(): void {
    if (this.scrollContainer.nativeElement.scrollHeight === this.scrollContainer.nativeElement.clientHeight) {
      return
    }
    const scrollPosition = this.getScrollPosition()

    this.isUserScrolled =
      (this.direction === 'bottom-to-top' ? scrollPosition !== 'bottom' : scrollPosition !== 'top') ||
      !this.isLatestMessageInList
    if (!this.isUserScrolled) {
      this.unreadMessageCount = 0
    }
    if (this.shouldLoadMoreMessages(scrollPosition)) {
      this.containerHeight = this.scrollContainer.nativeElement.scrollHeight
      let direction: 'newer' | 'older'
      if (this.direction === 'top-to-bottom') {
        direction = scrollPosition === 'top' ? 'newer' : 'older'
      } else {
        direction = scrollPosition === 'top' ? 'older' : 'newer'
      }
      this.mode === 'main'
        ? void this.channelService.loadMoreMessages(direction)
        : void this.channelService.loadMoreThreadReplies(direction)
      this.isLoading = true
    }
    this.prevScrollTop = this.scrollContainer.nativeElement.scrollTop
  }

  getTypingIndicatorContext(): TypingIndicatorContext {
    return {
      usersTyping$: this.usersTyping$
    }
  }

  getMessageContext(message: StreamMessage): MessageContext {
    return {
      message,
      isLastSentMessage: !!(this.lastSentMessageId && message?.id === this.lastSentMessageId),
      enabledMessageActions: this.enabledMessageActions,
      mode: this.mode,
      isHighlighted: message?.id === this.highlightedMessageId
    }
  }

  getTypingIndicatorText(users: UserResponse[]): string {
    const text = listUsers(users)

    return text
  }

  private preserveScrollbarPosition(): void {
    this.scrollContainer.nativeElement.scrollTop =
      (this.prevScrollTop || 0) + (this.scrollContainer.nativeElement.scrollHeight - this.containerHeight!)
  }

  private getScrollPosition(): 'top' | 'bottom' | 'middle' {
    let position: 'top' | 'bottom' | 'middle' = 'middle'
    if (
      Math.floor(this.scrollContainer.nativeElement.scrollTop) <=
        (this.parentMessageElement?.nativeElement.clientHeight || 0) &&
      (this.prevScrollTop === undefined ||
        this.prevScrollTop > (this.parentMessageElement?.nativeElement.clientHeight || 0))
    ) {
      position = 'top'
    } else if (
      Math.ceil(this.scrollContainer.nativeElement.scrollTop) + this.scrollContainer.nativeElement.clientHeight >=
      this.scrollContainer.nativeElement.scrollHeight
    ) {
      position = 'bottom'
    }

    return position
  }

  private shouldLoadMoreMessages(scrollPosition: 'top' | 'bottom' | 'middle'): boolean {
    return scrollPosition !== 'middle' && !this.highlightedMessageId
  }

  private setMessages$(): void {
    this.messages$ = (
      this.mode === 'main' ? this.channelService.activeChannelMessages$ : this.channelService.activeThreadMessages$
    ).pipe(
      tap((messages) => {
        this.isLoading = false
        if (messages.length === 0) {
          return
        } else {
          this.messages = messages
        }
        const currentLatestMessage = messages[messages.length - 1]
        this.newMessageReceived(currentLatestMessage)
        const currentOldestMessage = messages[0]
        if (!this.oldestMessage || !messages.find((m) => m.id === this.oldestMessage!.id)) {
          this.oldestMessage = currentOldestMessage
        } else if (this.oldestMessage.created_at.getTime() > currentOldestMessage.created_at.getTime()) {
          this.oldestMessage = currentOldestMessage
          this.olderMassagesLoaded = true
        }
      }),
      tap(
        (messages) =>
          (this.lastSentMessageId = [...messages]
            .reverse()
            .find((m) => m.user?.id === this.chatClientService.chatClient?.user?.id && m.status !== 'sending')?.id)
      ),
      tap((messages) => {
        this.isLatestMessageInList =
          !this.latestMessage || messages.length === 0 || messages[messages.length - 1].id === this.latestMessage.id
        if (!this.isLatestMessageInList) {
          this.isUserScrolled = true
        }
      }),
      map((messages) => (this.direction === 'bottom-to-top' ? messages : [...messages].reverse())),
      tap((messages) => {
        this.groupStyles = messages.map((m, i) => getGroupStyles(m, messages[i - 1], messages[i + 1]))
      })
    )
  }

  private resetScrollState(): void {
    this.latestMessage = undefined
    this.hasNewMessages = true
    this.isUserScrolled = false
    this.containerHeight = undefined
    this.olderMassagesLoaded = false
    this.oldestMessage = undefined
    this.unreadMessageCount = 0
    this.prevScrollTop = undefined
    this.isNewMessageSentByUser = undefined
    this.isLatestMessageInList = true
  }

  private scrollMessageIntoView(messageId: string, withRetry = true): void {
    const element = document.getElementById(messageId)
    if (!element && withRetry) {
      // If the message was newly inserted into activeChannelMessages$, the message will be rendered after the current change detection cycle -> wait for this cycle to complete
      setTimeout(() => this.scrollMessageIntoView(messageId, false))
    } else if (element) {
      element.scrollIntoView({ block: 'center' })
      setTimeout(() => {
        this.highlightedMessageId = undefined
      }, 1000)
    }
  }

  private scrollToLatestMessage(withRetry = true): void {
    if (document.getElementById(this.latestMessage!.id)) {
      this.direction === 'bottom-to-top' ? this.scrollToBottom() : this.scrollToTop()
    } else if (withRetry) {
      // If the message was newly inserted into activeChannelMessages$, the message will be rendered after the current change detection cycle -> wait for this cycle to complete
      setTimeout(() => this.scrollToLatestMessage(false), 0)
    }
  }

  private newMessageReceived(message: { id: string; created_at: Date; user?: { id: string } | null }) {
    if (!this.latestMessage || this.latestMessage.created_at?.getTime() < message.created_at.getTime()) {
      this.latestMessage = message
      this.hasNewMessages = true
      this.isNewMessageSentByUser = message.user?.id === this.chatClientService.chatClient?.user?.id
      if (this.isUserScrolled) {
        this.unreadMessageCount++
      }
    }
  }

  shouldDisplayDateSeparator(message: any): boolean {
    const currentDate = new Date(message.created_at).toISOString().substr(0, 10)
    const lastIndex = this.messages.indexOf(message) - 1
    if (lastIndex < 0) {
      this.shouldParse = true
      return true // first message always gets a date separator
    }
    const lastMessage = this.messages[lastIndex]
    const lastDate = new Date(lastMessage.created_at).toISOString().substr(0, 10)
    this.shouldParse = currentDate !== lastDate
    return this.shouldParse
  }
}
