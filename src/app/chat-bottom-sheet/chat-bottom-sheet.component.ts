import { Component } from '@angular/core'
import { MatBottomSheetRef } from '@angular/material/bottom-sheet'
// import { SharedModule } from '../../../../../shared/modules/shared.module'
import { ChatModule } from '../chat/chat.module'

@Component({
  standalone: true,
  imports: [ChatModule],
  selector: 'app-chat-bottom-sheet',
  templateUrl: './chat-bottom-sheet.component.html',
  styleUrls: ['./chat-bottom-sheet.component.scss']
})
export class ChatBottomSheetComponent {
  constructor(private bottomSheetRef: MatBottomSheetRef<ChatBottomSheetComponent>) {}

  openLink(event: MouseEvent): void {
    this.bottomSheetRef.dismiss()
    event.preventDefault()
  }
}
