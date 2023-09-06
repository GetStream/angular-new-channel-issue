import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core'
import { MentionConfig, Mentions } from 'angular-mentions'
import { BehaviorSubject, Subscription } from 'rxjs'
import { UserResponse } from 'stream-chat'
import {
  ChannelService,
  ChatClientService,
  CommandAutocompleteListItemContext,
  CustomTemplatesService,
  MentionAutcompleteListItem,
  MentionAutcompleteListItemContext,
  ThemeService,
  TransliterationService
} from 'stream-chat-angular'

import { TextareaInterface } from '../../models/textarea.interface'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { EmojiInputService } from '../../services/emoji-input.service'

/**
 * The `AutocompleteTextarea` component is used by the [`MessageInput`](./MessageInputComponent.mdx) component to display the input HTML element where users can type their message.
 */
@Component({
  selector: 'app-autocomplete-textarea',
  templateUrl: './autocomplete-textarea.component.html',
  styles: []
})
export class AutocompleteTextareaComponent implements TextareaInterface, OnChanges, AfterViewInit {
  @HostBinding() class = 'str-chat__textarea str-chat__message-textarea-angular-host'
  @ViewChild('input') private messageInput!: ElementRef<HTMLInputElement>
  /**
   * The value of the input HTML element.
   */
  @Input() value: string = ''
  /**
   * Placeholder of the textarea
   */
  @Input() placeholder: string = ''
  /**
   * If true, users can mention other users in messages. You can also set this input on the [`MessageInput`](./MessageInputComponent.mdx/#inputs-and-outputs) component.
   */
  @Input() areMentionsEnabled: boolean | undefined = true
  /**
   * See [`MessageInputConfigService`](../services/MessageInputConfigService.mdx) for more information
   */
  @Input() inputMode!: 'desktop' | 'mobile'
  /**
   * The scope for user mentions, either members of the current channel of members of the application. You can also set this input on the [`MessageInput`](./MessageInputComponent.mdx/#inputs-and-outputs) component.
   */
  @Input() mentionScope: 'channel' | 'application' = 'channel'
  /**
   * Emits the current value of the input element when a user types.
   */
  @Output() readonly valueChange: EventEmitter<string> = new EventEmitter<string>()
  /**
   * Emits when a user triggers a message send event (this happens when they hit the `Enter` key).
   */
  @Output() readonly send: EventEmitter<void> = new EventEmitter<void>()
  /**
   * Emits the array of users that are mentioned in the message, it is updated when a user mentions a new user or deletes a mention.
   */
  @Output() readonly userMentions: EventEmitter<UserResponse[]> = new EventEmitter<UserResponse[]>()

  mentionAutocompleteItemTemplate: TemplateRef<MentionAutcompleteListItemContext> | undefined
  commandAutocompleteItemTemplate: TemplateRef<CommandAutocompleteListItemContext> | undefined
  themeVersion: string
  autocompleteConfig: MentionConfig = {
    mentions: []
  }

  private readonly autocompleteKey = 'autocompleteLabel'
  private readonly mentionTriggerChar = '@'
  private readonly commandTriggerChar = '/'
  private subscriptions: Subscription[] = []
  private mentionedUsers: UserResponse[] = []
  private userMentionConfig: Mentions = {
    triggerChar: this.mentionTriggerChar,
    dropUp: true,
    labelKey: this.autocompleteKey,
    returnTrigger: true,
    mentionFilter: (searchString: string, items: { autocompleteLabel: string }[]) => this.filter(searchString, items),
    mentionSelect: (item, triggerChar) => this.itemSelectedFromAutocompleteList(item, triggerChar)
  }
  private slashCommandConfig: Mentions = {
    triggerChar: this.commandTriggerChar,
    dropUp: true,
    labelKey: 'name',
    returnTrigger: true,
    mentionFilter: (searchString: string, items: { autocompleteLabel: string }[]) => this.filter(searchString, items),
    mentionSelect: (item, triggerChar) => this.itemSelectedFromAutocompleteList(item, triggerChar)
  }
  private searchTerm$ = new BehaviorSubject<string>('')

  constructor(
    private channelService: ChannelService,
    private chatClientService: ChatClientService,
    private transliterationService: TransliterationService,
    private emojiInputService: EmojiInputService,
    private customTemplatesService: CustomTemplatesService,
    private themeService: ThemeService
  ) {
    this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((searchTerm) => {
      if (searchTerm.startsWith(this.mentionTriggerChar)) {
        void this.updateMentionOptions(searchTerm)
      }
    })
    this.subscriptions.push(
      this.channelService.activeChannel$.subscribe((channel) => {
        const commands = channel?.getConfig()?.commands || []
        this.slashCommandConfig.items = commands.map((c) => ({
          ...c,
          [this.autocompleteKey]: c.name,
          type: 'command'
        }))
        this.mentionedUsers = []
        this.userMentions.next([...this.mentionedUsers])
        void this.updateMentionOptions(this.searchTerm$.getValue())
      })
    )
    this.subscriptions.push(
      this.emojiInputService.emojiInput$.subscribe((emoji) => {
        this.messageInput.nativeElement.focus()
        const { selectionStart } = this.messageInput.nativeElement
        this.messageInput.nativeElement.setRangeText(emoji)
        this.messageInput.nativeElement.selectionStart = selectionStart! + emoji.length
        this.messageInput.nativeElement.selectionEnd = selectionStart! + emoji.length
        this.inputChanged()
      })
    )
    this.subscriptions.push(
      this.customTemplatesService.mentionAutocompleteItemTemplate$.subscribe(
        (template) => (this.mentionAutocompleteItemTemplate = template)
      )
    )
    this.subscriptions.push(
      this.customTemplatesService.commandAutocompleteItemTemplate$.subscribe(
        (template) => (this.commandAutocompleteItemTemplate = template)
      )
    )
    this.autocompleteConfig.mentions = [this.userMentionConfig, this.slashCommandConfig]
    this.themeVersion = this.themeService.themeVersion
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.areMentionsEnabled) {
      if (this.areMentionsEnabled) {
        this.autocompleteConfig.mentions = [this.userMentionConfig, this.slashCommandConfig]
        this.autocompleteConfig = { ...this.autocompleteConfig }
      } else {
        this.autocompleteConfig.mentions = [this.slashCommandConfig]
        this.autocompleteConfig = { ...this.autocompleteConfig }
      }
    }
    if (changes.mentionScope) {
      void this.updateMentionOptions(this.searchTerm$.getValue())
    }
    if (changes.value && !this.value && this.messageInput) {
      this.messageInput.nativeElement.style.height = 'auto'
    }
  }

  ngAfterViewInit(): void {
    if (this.messageInput.nativeElement.scrollHeight > 0) {
      this.adjustTextareaHeight()
    }
  }

  filter(searchString: string, items: { autocompleteLabel: string }[]): { autocompleteLabel: string }[] {
    return items.filter((item) =>
      this.transliterate(item.autocompleteLabel.toLowerCase()).includes(this.transliterate(searchString.toLowerCase()))
    )
  }

  itemSelectedFromAutocompleteList(item: MentionAutcompleteListItem, triggerChar = ''): string {
    if (triggerChar === this.mentionTriggerChar) {
      this.mentionedUsers.push((item.user ? item.user : item) as UserResponse)
      this.userMentions.next([...this.mentionedUsers])
    }
    return triggerChar + item.autocompleteLabel + (triggerChar === this.commandTriggerChar ? ' ' : '')
  }

  autcompleteSearchTermChanged(searchTerm: string): void {
    if (searchTerm === this.mentionTriggerChar) {
      void this.updateMentionOptions()
    } else {
      this.searchTerm$.next(searchTerm)
    }
  }

  inputChanged(): void {
    this.valueChange.emit(this.messageInput.nativeElement.value)
    this.adjustTextareaHeight()
  }

  inputLeft(): void {
    this.updateMentionedUsersFromText()
  }

  enterHit(event: Event): void {
    if (this.inputMode === 'desktop') {
      event.preventDefault()
      this.updateMentionedUsersFromText()
      this.send.next()
    }
  }

  private adjustTextareaHeight(): void {
    if (this.themeVersion === '2') {
      this.messageInput.nativeElement.style.height = ''
      this.messageInput.nativeElement.style.height = `${this.messageInput.nativeElement.scrollHeight}px`
    }
  }

  private transliterate(s: string): string {
    if (this.transliterationService) {
      return this.transliterationService.transliterate(s)
    } else {
      return s
    }
  }

  private async updateMentionOptions(searchTerm?: string): Promise<void> {
    if (!this.areMentionsEnabled) {
      return
    }
    searchTerm = searchTerm?.replace(this.mentionTriggerChar, '')
    const request =
      this.mentionScope === 'application'
        ? (s: string) => this.chatClientService.autocompleteUsers(s)
        : (s: string) => this.channelService.autocompleteMembers(s)
    const result = await request(searchTerm || '')
    const items = this.filter(
      searchTerm || '',
      result.map((i) => {
        const user = (i.user ? i.user : i) as UserResponse
        return {
          ...i,
          autocompleteLabel: user.name || user.id,
          type: 'mention'
        }
      })
    )
    this.userMentionConfig.items = items
    this.autocompleteConfig.mentions = [this.userMentionConfig, this.slashCommandConfig]
    this.autocompleteConfig = { ...this.autocompleteConfig }
  }

  private updateMentionedUsersFromText(): void {
    const updatedMentionedUsers: UserResponse[] = []
    this.mentionedUsers.forEach((u) => {
      const key = u.name || u.id
      if (this.value.includes(`${this.mentionTriggerChar}${key}`)) {
        updatedMentionedUsers.push(u)
      }
    })
    if (updatedMentionedUsers.length !== this.mentionedUsers.length) {
      this.userMentions.next([...updatedMentionedUsers])
      this.mentionedUsers = updatedMentionedUsers
    }
  }
}
