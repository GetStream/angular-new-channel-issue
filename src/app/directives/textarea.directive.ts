import { ComponentRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewContainerRef } from '@angular/core'
import { Directive } from '@angular/core'
import { Subscription } from 'rxjs'
import { UserResponse } from 'stream-chat'
import { TextareaInterface } from 'stream-chat-angular'

@Directive({
  selector: '[appChatTextarea]'
})
export class TextareaDirective implements OnChanges {
  @Input() componentRef: ComponentRef<TextareaInterface> | undefined
  @Input() areMentionsEnabled: boolean | undefined
  @Input() mentionScope?: 'channel' | 'application'
  @Input() inputMode!: 'mobile' | 'desktop'
  @Input() value = ''
  @Input() rows = 5
  @Input() placeholder: string | undefined
  @Output() readonly valueChange = new EventEmitter<string>()
  @Output() readonly send = new EventEmitter<void>()
  @Output() readonly userMentions = new EventEmitter<UserResponse[]>()
  private subscriptions: Subscription[] = []
  private unpropagatedChanges: SimpleChanges[] = []
  constructor(public viewContainerRef: ViewContainerRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.unpropagatedChanges.push(changes)
    if (!this.componentRef) {
      return
    }
    if (changes.componentRef) {
      this.subscriptions.forEach((s) => s.unsubscribe())
      if (this.componentRef) {
        this.subscriptions.push(
          this.componentRef.instance.valueChange.subscribe((value) => this.valueChange.next(value))
        )
        this.subscriptions.push(this.componentRef.instance.send.subscribe((value) => this.send.next(value)))
        if (this.componentRef.instance.userMentions) {
          this.subscriptions.push(
            this.componentRef.instance.userMentions.subscribe((value) => this.userMentions.next(value))
          )
        }
        this.componentRef.instance.areMentionsEnabled = this.areMentionsEnabled
        this.componentRef.instance.mentionScope = this.mentionScope
        this.componentRef.instance.value = this.value
        this.componentRef.instance.placeholder = this.placeholder
        this.componentRef.instance.inputMode = this.inputMode
      }
    }
    if (changes.areMentionsEnabled) {
      this.componentRef.instance.areMentionsEnabled = this.areMentionsEnabled
    }
    if (changes.mentionScope) {
      this.componentRef.instance.mentionScope = this.mentionScope
    }
    if (changes.value) {
      this.componentRef.instance.value = this.value
    }
    if (changes.placeholder) {
      this.componentRef.instance.placeholder = this.placeholder
    }
    if (changes.inputMode) {
      this.componentRef.instance.inputMode = this.inputMode
    }
    // ngOnChanges not called for dynamic components since we don't use template binding
    let changesToPropagate = {}
    this.unpropagatedChanges.forEach((c) => (changesToPropagate = { ...changesToPropagate, ...c }))
    // eslint-disable-next-line @angular-eslint/no-lifecycle-call
    this.componentRef.instance.ngOnChanges(changesToPropagate)
    this.unpropagatedChanges = []
  }
}
