import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from './debounce.token';

describe('NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN', () => {
  it('should have default value from constant', () => {
    @Component({ template: '' })
    class TestComponent {
      debounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
    }

    TestBed.configureTestingModule({});

    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;

    expect(component.debounceTime).toBe(100);
  });

  it('should allow global configuration via providers', () => {
    @Component({ template: '' })
    class TestComponent {
      debounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
    }

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
          useValue: 250,
        },
      ],
    });

    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;

    expect(component.debounceTime).toBe(250);
  });

  it('should allow component-level override', () => {
    @Component({
      template: '',
      providers: [
        {
          provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
          useValue: 0,
        },
      ],
    })
    class TestComponent {
      debounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
    }

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
          useValue: 200,
        },
      ],
    });

    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;

    // Component-level provider should override TestBed provider
    expect(component.debounceTime).toBe(0);
  });

  it('should support zero debounce for testing', () => {
    @Component({
      template: '',
      providers: [
        {
          provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
          useValue: 0,
        },
      ],
    })
    class TestComponent {
      debounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
    }

    TestBed.configureTestingModule({});

    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;

    expect(component.debounceTime).toBe(0);
  });

  it('should support custom values for performance tuning', () => {
    @Component({
      selector: 'ngx-slow-network-component',
      template: '',
      providers: [
        {
          provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
          useValue: 300,
        },
      ],
    })
    class SlowNetworkComponent {
      debounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
    }

    @Component({
      selector: 'ngx-fast-network-component',
      template: '',
      providers: [
        {
          provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
          useValue: 50,
        },
      ],
    })
    class FastNetworkComponent {
      debounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
    }

    TestBed.configureTestingModule({});

    const slowFixture = TestBed.createComponent(SlowNetworkComponent);
    const fastFixture = TestBed.createComponent(FastNetworkComponent);

    expect(slowFixture.componentInstance.debounceTime).toBe(300);
    expect(fastFixture.componentInstance.debounceTime).toBe(50);
  });
});
