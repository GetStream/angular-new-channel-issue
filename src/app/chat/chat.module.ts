import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'
import { NgxPopperModule } from 'ngx-popper'
import { StreamAutocompleteTextareaModule, StreamAvatarModule, StreamChatModule } from 'stream-chat-angular'

import { ChatComponent } from './chat.component'
import { CustomChannelPreviewComponent } from './channel-preview/channel-preview.component'
import { MessageActionsComponent } from './message-actions/message-actions.component'
import { AttachmentListComponent } from './attachment-list/attachment-list.component'
import { AttachmentPreviewListComponent } from './attachment-preview-list/attachment-preview-list.component'
import { ChannelComponent } from './channel/channel.component'
import { ChannelListComponent } from './channel-list/channel-list.component'
import { IconComponent } from './icon/icon.component'
import { IconPlaceholderComponent } from './icon-placeholder/icon-placeholder.component'
import { LoadingIndicatorComponent } from './loading-indicator/loading-indicator.component'
import { LoadingIndicatorPlaceholderComponent } from './loading-indicator-placeholder/loading-indicator-placeholder.component'
import { MessageComponent } from './message/message.component'
import { MessageInputComponent } from './message-input/message-input.component'
import { MessageListComponent } from './message-list/message-list.component'
import { MessageReactionsComponent } from './message-reactions/message-reactions.component'
import { ThreadComponent } from './thread/thread.component'
import { AvatarPlaceholderComponent } from './avatar-placeholder/avatar-placeholder.component'
import { AvatarComponent } from './avatar/avatar.component'
import { ChannelHeaderComponent } from './channel-header/channel-header.component'
import { DateSeparatorComponent } from './date-separator/date-separator.component'
import { TranslateModule } from '@ngx-translate/core'
import { TextareaDirective } from '../directives/textarea.directive'

const routes: Routes = [
  {
    path: '',
    component: ChatComponent
  }
]

const components = [
  AvatarPlaceholderComponent,
  AvatarComponent,
  AttachmentListComponent,
  AttachmentPreviewListComponent,
  ChannelComponent,
  ChannelListComponent,
  CustomChannelPreviewComponent,
  ChannelHeaderComponent,
  IconComponent,
  IconPlaceholderComponent,
  LoadingIndicatorComponent,
  LoadingIndicatorPlaceholderComponent,
  MessageComponent,
  MessageActionsComponent,
  MessageInputComponent,
  MessageListComponent,
  MessageReactionsComponent,
  ThreadComponent,
  DateSeparatorComponent,
  TextareaDirective
]

@NgModule({
  declarations: [...components, ChatComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    TranslateModule,
    StreamChatModule,
    StreamAutocompleteTextareaModule,
    StreamAvatarModule,
    StreamAvatarModule,
    NgxPopperModule.forRoot()
  ],
  exports: [...components]
})
export class ChatModule {}
