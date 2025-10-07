# Error Display Modes - Interactive Demo

## 📋 Product Requirements Document

### **Overview**

A comprehensive interactive demonstration of ngx-vest-forms error display modes using a realistic product feedback form. Users can dynamically switch between different error display modes to understand when and how validation errors appear.

---

## **🎯 Business Objectives**

### Primary Goals

1. **Educational Excellence**: Clearly demonstrate the three error display modes with immediate visual feedback
2. **Best Practice Advocacy**: Show the recommended WCAG 2.2 compliant form submission patterns
3. **Developer Experience**: Provide copy-paste examples of proper error handling implementation
4. **Library Feature Showcase**: Highlight the flexibility and power of ngx-vest-forms error display system

### Success Metrics

- Developers understand when to use each error display mode
- Clear demonstration of accessibility-compliant form patterns
- Reduced support questions about error timing behavior
- Increased adoption of recommended patterns

---

## **👥 User Stories**

### As a Frontend Developer

- **I want to** see how error display modes affect user experience **so that** I can choose the right mode for my forms
- **I want to** switch between modes instantly **so that** I can compare behaviors side-by-side
- **I want to** see WCAG 2.2 compliant submission handling **so that** I can implement accessible forms
- **I want to** copy working code examples **so that** I can implement these patterns quickly

### As a UX Designer

- **I want to** understand error timing implications **so that** I can design better form experiences
- **I want to** see how different modes affect form usability **so that** I can make informed design decisions

### As a Product Owner

- **I want to** ensure our forms are accessible **so that** we comply with WCAG 2.2 standards
- **I want to** reduce form abandonment **so that** we improve conversion rates

---

## **🏗️ Technical Requirements**

### **Form Context: Product Feedback**

**Scenario**: Users providing feedback about a software product they've used

### **Form Fields & Validation Rules**

#### **1. Personal Information Section**

```typescript
// Required fields with format validation
name: {
  rules: ['required', 'minLength:2', 'maxLength:50'],
  placeholder: 'Your full name',
  hint: 'We use this to personalize our response'
}

email: {
  rules: ['required', 'email'],
  placeholder: 'your.email@company.com',
  hint: 'For follow-up questions (we respect your privacy)'
}

company: {
  rules: ['maxLength:100'],  // Optional field
  placeholder: 'Your company (optional)',
  hint: 'Helps us understand your use case'
}
```

#### **2. Feedback Section**

```typescript
productUsed: {
  rules: ['required'],
  type: 'select',
  options: ['Web App', 'Mobile App', 'API', 'Documentation', 'Other'],
  hint: 'Which product are you providing feedback about?'
}

overallRating: {
  rules: ['required', 'min:1', 'max:5'],
  type: 'number',
  placeholder: 'Rate 1-5 stars',
  hint: '1 = Poor, 5 = Excellent'
}

// Conditional field - only shows when rating ≤ 3
improvementSuggestions: {
  rules: ['required_if:overallRating,<=,3', 'minLength:10', 'maxLength:500'],
  type: 'textarea',
  placeholder: 'What could we improve?',
  hint: 'Please help us understand what went wrong'
}

detailedFeedback: {
  rules: ['maxLength:1000'],  // Optional
  type: 'textarea',
  placeholder: 'Share your detailed experience...',
  hint: 'Any additional thoughts or suggestions'
}
```

#### **3. Preferences Section**

```typescript
allowFollowUp: {
  rules: [],  // Optional checkbox
  type: 'checkbox',
  label: 'Allow us to contact you for follow-up questions',
  hint: 'We promise not to spam you'
}

newsletter: {
  rules: [],  // Optional checkbox
  type: 'checkbox',
  label: 'Subscribe to product updates',
  hint: 'Monthly digest of new features and improvements'
}
```

### **Error Display Mode Selector**

```typescript
interface ErrorDisplayModeConfig {
  mode: 'on-blur' | 'on-submit' | 'on-blur-or-submit';
  description: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
}

const ERROR_DISPLAY_MODES: ErrorDisplayModeConfig[] = [
  {
    mode: 'on-blur',
    description: 'Show errors immediately when user leaves a field',
    whenToUse:
      'Forms where immediate feedback helps (e.g., complex validation)',
    pros: [
      'Immediate feedback',
      'Prevents error accumulation',
      'Good for expert users',
    ],
    cons: [
      'Can be overwhelming',
      'May interrupt user flow',
      'Anxiety-inducing for some users',
    ],
  },
  {
    mode: 'on-submit',
    description: 'Show errors only when user attempts to submit',
    whenToUse: 'Simple forms or when you want to minimize interruptions',
    pros: [
      'Non-intrusive',
      'Allows completion without interruption',
      'Good for simple forms',
    ],
    cons: [
      'Delayed feedback',
      'May surprise users',
      'Potentially longer error correction time',
    ],
  },
  {
    mode: 'on-blur-or-submit',
    description:
      'Show errors on field blur OR form submit (recommended default)',
    whenToUse: 'Most forms - balances immediacy with user flow',
    pros: [
      'Balanced approach',
      'Flexible timing',
      'Good user experience',
      'WCAG 2.2 friendly',
    ],
    cons: ['Slight complexity in implementation'],
  },
];
```

---

## **🎨 User Experience Requirements**

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Error Display Modes - Interactive Demo               │
├─────────────────────────────────────────────────────────┤
│ 🎛️ Mode Selector                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Error Display Mode: [on-blur-or-submit ▼]          │ │
│ │ 💡 Show errors on field blur OR form submit        │ │
│ │    (Recommended for most forms)                     │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📝 Product Feedback Form                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Form fields with real-time mode switching]        │ │
│ │ • Personal info section                             │ │
│ │ • Feedback section                                  │ │
│ │ • Preferences section                               │ │
│ │ [Submit Button - Always Enabled]                    │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📊 Live Demo Information                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Current Mode: on-blur-or-submit                     │ │
│ │ Form State: [JSON display]                          │ │
│ │ Testing Tips: [Interactive guidance]                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Interactive Behavior**

1. **Mode Switching**: Changing the dropdown immediately applies the new error display mode to all fields
2. **Visual Feedback**: Current mode is clearly highlighted with description and recommendations
3. **Testing Guidance**: Dynamic instructions on how to test the current mode
4. **Form State Visibility**: Real-time display of form validation state for educational purposes

---

## **⚡ Technical Implementation Requirements**

### **Core Features**

- ✅ **Dynamic Mode Switching**: Change `errorDisplayMode` input reactively
- ✅ **WCAG 2.2 Compliance**: No disabled submit buttons, proper error announcements
- ✅ **Real-time Validation**: Immediate validation feedback based on current mode
- ✅ **Conditional Fields**: Show/hide fields based on form state
- ✅ **Accessibility**: Full keyboard navigation, screen reader support, proper ARIA attributes

### **Form Submission Behavior**

```typescript
save() {
  const formState = this.vestForm.formState();

  // WCAG 2.2 Compliant: Never disable submit button
  if (!formState.valid) {
    this.showSubmissionError.set(true);
    this.focusFirstInvalidField();
    return;
  }

  if (formState.pending) {
    this.showPendingMessage.set(true);
    return;
  }

  // Valid submission
  this.submitFeedback(this.model());
}
```

### **Error Display Integration**

```html
<!-- Each field uses ngxFormErrorDisplay with dynamic mode -->
<div
  ngxFormErrorDisplay
  [errorDisplayMode]="currentMode()"
  #fieldDisplay="formErrorDisplay"
>
  <input
    [attr.aria-invalid]="fieldDisplay.shouldShowErrors() ? 'true' : null"
    [attr.aria-describedby]="fieldDisplay.shouldShowErrors() ? 'field-error' : null"
  />

  @if (fieldDisplay.shouldShowErrors()) {
  <div id="field-error" role="alert">
    @for (error of fieldDisplay.errors(); track error) {
    <div>{{ error }}</div>
    }
  </div>
  }
</div>
```

---

## **🧪 Testing Scenarios**

### **Mode Comparison Tests**

1. **Fill form partially → Switch modes → Observe error timing**
2. **Invalid email → Tab away → Compare immediate vs delayed feedback**
3. **Submit with errors → See how each mode handles submission**
4. **Conditional field validation → Test rating-based field visibility**

### **Accessibility Tests**

1. **Keyboard-only navigation** through all modes
2. **Screen reader announcements** for each error display mode
3. **Focus management** when switching between modes
4. **Color contrast** and visual feedback requirements

### **Edge Cases**

1. **Rapid mode switching** while validation is pending
2. **Form reset** behavior across different modes
3. **Browser back/forward** state preservation
4. **Mobile touch interactions** with different error timings

---

## **📚 Educational Content**

### **Mode Descriptions**

Each mode includes:

- 📖 **When to use it**
- ✅ **Advantages**
- ⚠️ **Considerations**
- 🎯 **Best practices**
- 📋 **Code examples**

### **Testing Instructions**

Dynamic guidance that changes based on selected mode:

```
Current Mode: on-blur
🧪 Try this:
1. Click in the "Name" field
2. Type one character
3. Click away (tab or click elsewhere)
4. Notice the error appears immediately

💡 This mode gives instant feedback but can feel overwhelming for some users.
```

---

## **🚀 Implementation Phases**

### **Phase 1: Core Form** (MVP)

- Basic form structure with all field types
- Working validation with static mode
- WCAG 2.2 compliant submission handling

### **Phase 2: Dynamic Mode Switching**

- Mode selector with real-time switching
- Educational content and descriptions
- Testing guidance

### **Phase 3: Enhanced UX**

- Smooth transitions between modes
- Advanced form state visualization
- Mobile-optimized experience

### **Phase 4: Advanced Features**

- Performance optimization
- Extensive testing scenarios
- Copy-paste code examples

---

## **📋 Acceptance Criteria**

### **Functional Requirements**

- [ ] Form validates according to defined rules
- [ ] Error display mode can be changed dynamically
- [ ] All three modes work correctly
- [ ] Submit button is never disabled (WCAG 2.2)
- [ ] Proper error messaging and focus management
- [ ] Conditional field logic works correctly

### **Accessibility Requirements**

- [ ] Full keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Proper ARIA attributes and announcements
- [ ] Color contrast meets WCAG 2.2 AA standards
- [ ] Focus indicators are clearly visible
- [ ] Error messages are programmatically associated

### **Educational Requirements**

- [ ] Clear explanation of each mode
- [ ] Interactive testing guidance
- [ ] Code examples are accurate and copyable
- [ ] Performance implications are explained
- [ ] Best practice recommendations are clear

---

## **🔮 Future Enhancements**

### **Advanced Features**

- [ ] **Custom Error Display Timing**: Configurable delay/debounce settings
- [ ] **Animation Modes**: Different error appearance animations
- [ ] **Multi-language Support**: Error display in different languages
- [ ] **Integration Examples**: Show integration with popular UI libraries
- [ ] **Performance Metrics**: Measure and display validation performance
- [ ] **A/B Testing Setup**: Compare user behavior across modes

### **Developer Tools**

- [ ] **Code Generator**: Generate forms with selected error display mode
- [ ] **Testing Helpers**: Automated testing utilities for different modes
- [ ] **Debug Panel**: Advanced form state inspection tools
- [ ] **Performance Profiler**: Analyze validation performance impact

---

This PRD provides a comprehensive foundation for building an educational, interactive, and accessible demonstration of ngx-vest-forms error display modes while showcasing WCAG 2.2 compliant form submission patterns.
