import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DirectedGraphComponent } from './components/directed-graph/directed-graph.component';

import { HttpClientModule } from '@angular/common/http';
import { HighlightService } from './services/highlight.service';
import { CodeViewComponent } from './components/code-view/code-view.component';

@NgModule({
  declarations: [
    AppComponent,
    DirectedGraphComponent,
    CodeViewComponent
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
