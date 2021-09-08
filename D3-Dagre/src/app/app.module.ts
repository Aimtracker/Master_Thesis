import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DirectedGraphComponent } from './components/directed-graph/directed-graph.component';

import { HttpClientModule } from '@angular/common/http';
import { HighlightService } from './services/highlight.service';

@NgModule({
  declarations: [
    AppComponent,
    DirectedGraphComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [HighlightService,],
  bootstrap: [AppComponent]
})
export class AppModule { }
