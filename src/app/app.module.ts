import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import {
  StreamChatModule,
  StreamAutocompleteTextareaModule,
} from 'stream-chat-angular';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    TranslateModule.forRoot(),
    StreamAutocompleteTextareaModule,
    StreamChatModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
