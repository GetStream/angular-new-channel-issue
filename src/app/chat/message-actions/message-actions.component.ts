import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core'
import { Subscription } from 'rxjs'
import {
  ChannelService,
  ChatClientService,
  CustomTemplatesService,
  MessageActionBoxItemContext,
  MessageActionItem,
  MessageInputContext,
  ModalContext,
  NotificationService,
  StreamMessage
} from 'stream-chat-angular'
/**
 * The `MessageActionsBox` component displays a list of message actions (i.e edit), that can be opened or closed. You can find the [list of the supported actions](../concepts/message-interactions.mdx) in the message interaction guide.
 */
@Component({
  selector: 'app-message-actions',
  templateUrl: './message-actions.component.html',
  styles: []
})
export class MessageActionsComponent implements OnChanges, OnDestroy {
  @ViewChild('modalContent', { static: true })
  private modalContent!: TemplateRef<void>
  /**
   * Indicates if the list should be opened or closed. Adding a UI element to open and close the list is the parent's component responsibility.
   * @deprecated No need for this since [theme-v2](../theming/introduction.mdx)
   */
  @Input() isOpen: boolean = false
  /**
   * Indicates if the message actions are belonging to a message that was sent by the current user or not.
   */
  @Input() isMine: boolean = false
  /**
   * The message the actions will be executed on
   */
  @Input() message: StreamMessage | undefined
  /**
   * The list of [channel capabilities](https://getstream.io/chat/docs/javascript/channel_capabilities/?language=javascript) that are enabled for the current user, the list of [supported interactions](../concepts/message-interactions.mdx) can be found in our message interaction guide. Unathorized actions won't be displayed on the UI.
   */
  @Input() enabledActions: string[] = []
  /**
   * The number of authorized actions (it can be less or equal than the number of enabled actions)
   */
  @Output() readonly displayedActionsCount: EventEmitter<number> = new EventEmitter<number>()
  /**
   * An event which emits `true` if the edit message modal is open, and `false` when it is closed.
   */
  @Output() readonly isEditing: EventEmitter<boolean> = new EventEmitter<boolean>()

  isEditModalOpen: boolean = false
  messageInputTemplate: TemplateRef<MessageInputContext> | undefined
  messageActionItemTemplate: TemplateRef<MessageActionBoxItemContext> | undefined
  modalTemplate: TemplateRef<ModalContext> | undefined
  subscriptions: Subscription[] = []
  visibleMessageActionItems: MessageActionItem[] = []

  private readonly messageActionItems: MessageActionItem[]

  constructor(
    private chatClientService: ChatClientService,
    private notificationService: NotificationService,
    private channelService: ChannelService,
    private customTemplatesService: CustomTemplatesService
  ) {
    this.subscriptions.push(
      this.customTemplatesService.messageInputTemplate$.subscribe((template) => (this.messageInputTemplate = template))
    )
    this.subscriptions.push(
      this.customTemplatesService.messageActionsBoxItemTemplate$.subscribe(
        (template) => (this.messageActionItemTemplate = template)
      )
    )
    this.subscriptions.push(
      this.customTemplatesService.modalTemplate$.subscribe((template) => (this.modalTemplate = template))
    )
    this.messageActionItems = [
      {
        actionName: 'quote',
        actionLabelOrTranslationKey: 'streamChat.Reply',
        actionHandler: (message: StreamMessage) => this.channelService.selectMessageToQuote(message),
        isVisible: (enabledActions: string[]) => enabledActions.indexOf('quote-message') !== -1
      },
      // {
      //   actionName: 'pin',
      //   actionLabelOrTranslationKey: () => (this.message?.pinned ? 'streamChat.Unpin' : 'streamChat.Pin'),
      //   actionHandler: (message: StreamMessage) =>
      //     message.pinned ? this.channelService.unpinMessage(message) : this.channelService.pinMessage(message),
      //   isVisible: (enabledActions: string[]) => enabledActions.indexOf('pin-message') !== -1
      // },
      {
        actionName: 'flag',
        actionLabelOrTranslationKey: 'streamChat.Flag',
        actionHandler: async (message: StreamMessage) => {
          try {
            await this.chatClientService.flagMessage(message.id)
            this.notificationService.addTemporaryNotification(
              'streamChat.Message has been successfully flagged',
              'success'
            )
          } catch (err) {
            this.notificationService.addTemporaryNotification('streamChat.Error adding flag')
          }
        },
        isVisible: (enabledActions: string[], isMine: boolean) =>
          enabledActions.indexOf('flag-message') !== -1 && !isMine
      },
      {
        actionName: 'edit',
        actionLabelOrTranslationKey: 'streamChat.Edit Message',
        actionHandler: () => {
          this.isEditing.emit(true)
          // this.isEditModalOpen = true
        },
        isVisible: (enabledActions: string[], isMine: boolean) =>
          (enabledActions.indexOf('update-own-message') !== -1 && isMine) ||
          enabledActions.indexOf('update-any-message') !== -1
      },
      {
        actionName: 'delete',
        actionLabelOrTranslationKey: 'streamChat.Delete',
        actionHandler: async (message: StreamMessage) => {
          try {
            await this.channelService.deleteMessage(message)
          } catch (error) {
            this.notificationService.addTemporaryNotification('streamChat.Error deleting message')
          }
        },
        isVisible: (enabledActions: string[], isMine: boolean) =>
          ((enabledActions.indexOf('delete') !== -1 || enabledActions.indexOf('delete-own-message') !== -1) &&
            isMine) ||
          enabledActions.indexOf('delete-any') !== -1 ||
          enabledActions.indexOf('delete-any-message') !== -1
      }
    ]
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isMine || changes.enabledActions || changes.message) {
      this.visibleMessageActionItems = this.messageActionItems.filter((item) =>
        item.isVisible(this.enabledActions, this.isMine, this.message!)
      )
      this.displayedActionsCount.emit(this.visibleMessageActionItems.length)
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  getActionLabel(actionLabelOrTranslationKey: (() => string) | string): string {
    return typeof actionLabelOrTranslationKey === 'string' ? actionLabelOrTranslationKey : actionLabelOrTranslationKey()
  }

  modalClosed = () => {
    this.isEditModalOpen = false
    this.isEditing.emit(false)
  }

  getEditModalContext(): ModalContext {
    return {
      isOpen: this.isEditModalOpen,
      isOpenChangeHandler: (isOpen) => {
        this.isEditModalOpen = isOpen
        if (!this.isEditModalOpen) {
          this.modalClosed()
        }
      },
      content: this.modalContent
    }
  }

  trackByActionName(_: number, item: MessageActionItem): string {
    return item.actionName
  }
}
