import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from "@angular/forms";

import { DirectedGraphComponent } from './components/directed-graph/directed-graph.component';
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
    HttpClientModule,
    FormsModule,
  ],
  providers: [HighlightService,],
  bootstrap: [AppComponent]
})
export class AppModule { }
