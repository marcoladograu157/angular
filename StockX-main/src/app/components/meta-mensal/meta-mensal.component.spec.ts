import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaMensalComponent } from './meta-mensal.component';

describe('MetaMensalComponent', () => {
  let component: MetaMensalComponent;
  let fixture: ComponentFixture<MetaMensalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetaMensalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetaMensalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
