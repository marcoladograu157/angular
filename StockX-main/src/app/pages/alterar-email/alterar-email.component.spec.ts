import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlterarEmailComponent } from './alterar-email.component';

describe('AlterarEmailComponent', () => {
  let component: AlterarEmailComponent;
  let fixture: ComponentFixture<AlterarEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlterarEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlterarEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
