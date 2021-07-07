import { Component, OnDestroy, OnInit } from '@angular/core';
import { GraphStore } from 'src/app/domain/stores/graph.store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'code-view',
  templateUrl: './code-view.component.html',
  styleUrls: ['./code-view.component.css']
})
export class CodeViewComponent implements OnInit, OnDestroy {
  linesToHighlight: string = "";
  pathToVueFile: string = 'assets/test.vue/test.vue';

  private ngUnsubscribe = new Subject();

  constructor(private graphStore: GraphStore) { }


  ngOnInit(): void {
    this.graphStore.state$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(state => {
        this.linesToHighlight = state.linesToHighlight;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
