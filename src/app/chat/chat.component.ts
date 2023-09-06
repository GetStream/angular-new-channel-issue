import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core'
// import { SelectSnapshot } from '@ngxs-labs/select-snapshot'
import {
  ChatClientService,
  ChannelService,
  ChannelPreviewContext,
  CustomTemplatesService,
  AvatarContext,
  MessageActionsBoxContext
} from 'stream-chat-angular'
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, of, Subscription, switchMap, tap } from 'rxjs'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'

// import { AuthService, UtilsService } from '../../../../../core/services'
// import { DashboardState } from '../../../states/dashboard.state'
import { ChatEvent } from './models/chat.models'
import { ChatService } from '../services/chat.service'
import { AuthService } from '../services/auth.service'
// import { ChatService } from '../../../../../core/services/chat.service'
// import { UsersService } from '../../../../../core/api'
// import { SnackbarService } from '../../../../../shared/components/snackbar/snackbar.service'
// import { CurrentUserResponse } from '../../../../../core/interfaces/user/current-user-response'
// import { DatabaseUserSearchResponse } from '../../../../../core/interfaces/user/database-user-search-response'

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  host: { class: 'ns-page' }
})
export class ChatComponent implements OnInit, AfterViewInit {
  selectedUser = localStorage.getItem('selectedUser') ? JSON.parse(localStorage.getItem('selectedUser')!) : null

  @ViewChild('channelPreview')
  private channelPreview: TemplateRef<ChannelPreviewContext>

  // @SelectSnapshot(DashboardState.user) currentUser: CurrentUserResponse
  @ViewChild('avatarTemplate')
  private avatarTemplate: TemplateRef<AvatarContext>

  @ViewChild('messageActions')
  private messageActions: TemplateRef<MessageActionsBoxContext>

  isLoading: BehaviorSubject<boolean>
  // searchForm: FormGroup<{ name: FormControl<string | null> }>
  // searchChatForm: FormGroup
  // userList: any[] = []
  // selectedUser: any | null
  // noUserFound: boolean = false
  // searchLoading: boolean = false
  // isStartNewChannelModal: boolean = false

  private subscriptions: Subscription[] = []

  get isEmptyState(): boolean {
    return !this.chatService.channels && !this.isLoading.value
  }

  constructor(
    private chatService: ChatService,
    private chatClientService: ChatClientService,
    public channelService: ChannelService,
    private authService: AuthService,
    private customTemplateService: CustomTemplatesService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.initChat()
    // this.searchForm = this.formBuilder.group({
    //   name: ['', Validators.minLength(3)]
    // })
    // this.searchChatForm = this.formBuilder.group({
    //   channelName: ['', Validators.minLength(3)]
    // })
    // this.initSearchByName()
    // this.initSearchByChatName()
  }

  ngAfterViewInit(): void {
    this.customTemplateService.channelPreviewTemplate$.next(this.channelPreview)
    this.customTemplateService.avatarTemplate$.next(this.avatarTemplate)
    this.customTemplateService.messageActionsBoxTemplate$.next(this.messageActions)
  }

  private initChat(): void {
    this.isLoading = this.chatService.isLoading
    this.chatClientService.chatClient?.on((event) => {
      if (event.type === ChatEvent.ConnectionChanged && !event.online) {
        this.authService.getStreamToken().subscribe((token) => {
          const userToken = token
          this.chatClientService.chatClient.connectUser({ id: this.selectedUser.uuid }, userToken)
        })
      }
    })
  }

  // private initSearchByName(): void {
  //   this.searchForm
  //     .get('name')!
  //     .valueChanges.pipe(
  //       debounceTime(500),
  //       distinctUntilChanged(),
  //       switchMap((value) => {
  //         this.selectedUser = null
  //         this.noUserFound = false
  //         const nameList = value?.split(' ')

  //         if (value && nameList) {
  //           const firstName = this.utils.getFirstNameFromListOfStrings(nameList)
  //           const lastName = this.utils.getLastNameFromListOfStrings(nameList)
  //           this.searchLoading = true
  //           return this.usersService.searchUsers(firstName, lastName).pipe(catchError(() => of([])))
  //         } else {
  //           return of([])
  //         }
  //       }),
  //       tap((userList: DatabaseUserSearchResponse[]) => {
  //         this.searchLoading = false
  //         this.userList = userList

  //         if (!this.searchForm.value.name) {
  //           this.noUserFound = false
  //         } else if (!userList.length) {
  //           this.noUserFound = true
  //         }
  //       })
  //     )
  //     .subscribe()
  // }

  // selectUser(user: any): void {
  //   this.selectedUser = user
  // }

  // startChat(): void {
  //   this.chatService
  //     .createChannel(this.selectedUser!.uuid)
  //     .then(
  //       (result) => {
  //         this.chatService.setActiveChannel(result.channel.id)
  //       },
  //       (error) => console.log(error.message)
  //     )
  //     .finally(() => {
  //       this.isStartNewChannelModal = false
  //       this.searchForm.get('name')!.reset('')
  //     })
  // }

  // initSearchByChatName(): void {
  //   const channelNameField = this.searchChatForm.get('channelName')

  //   channelNameField!.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
  //     if (channelNameField!.valid) {
  //       this.chatService.searchByChatName(value)
  //     }
  //   })
  // }
}
