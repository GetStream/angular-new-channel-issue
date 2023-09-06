import { Component, EventEmitter, Input, Output } from '@angular/core'
import { Observable } from 'rxjs'
import { AttachmentUpload, ThemeService } from 'stream-chat-angular'

/**
 * The `AttachmentPreviewList` component displays a preview of the attachments uploaded to a message. Users can delete attachments using the preview component, or retry upload if it failed previously.
 */
@Component({
  selector: 'app-attachment-preview-list',
  templateUrl: './attachment-preview-list.component.html',
  styles: []
})
export class AttachmentPreviewListComponent {
  /**
   * A stream that emits the current file uploads and their states
   */
  @Input() attachmentUploads$: Observable<AttachmentUpload[]> | undefined
  /**
   * An output to notify the parent component if the user tries to retry a failed upload
   */
  @Output() readonly retryAttachmentUpload = new EventEmitter<File>()
  /**
   * An output to notify the parent component if the user wants to delete a file
   */
  @Output() readonly deleteAttachment = new EventEmitter<AttachmentUpload>()
  themeVersion: string

  constructor(themeService: ThemeService) {
    this.themeVersion = themeService.themeVersion
  }

  attachmentUploadRetried(file: File): void {
    this.retryAttachmentUpload.emit(file)
  }

  attachmentDeleted(upload: AttachmentUpload): void {
    this.deleteAttachment.emit(upload)
  }

  trackByFile(_: number, item: AttachmentUpload): File {
    return item.file
  }
}
