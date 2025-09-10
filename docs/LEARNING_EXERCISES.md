# Learning Exercises

This document contains practical exercises for learning design system concepts using the diagrammatic editor.

## Exercise 1: Token Cascade

**Objective**: Understand how design tokens cascade through component hierarchies.

**Steps**:
1. Create a Button component in the palette
2. Set base tokens: `--color-primary: #3b82f6`, `--spacing-md: 16px`
3. Create a Card component that contains buttons
4. Override button tokens within the card context
5. Observe how tokens cascade from parent to child components

**Expected Outcome**: Button appearance changes based on its container context.

---

## Exercise 2: Variants & Inheritance

**Objective**: Learn how components inherit and override design properties.

**Steps**:
1. Create a base Button component with default styling
2. Add variant tokens: `--variant: primary`, `--size: medium`
3. Create button variants by modifying tokens: `secondary`, `danger`, `large`, `small`
4. Test inheritance by nesting buttons in different containers
5. Document which properties inherit vs. which reset

**Expected Outcome**: Understanding of CSS inheritance vs. explicit token setting.

---

## Exercise 3: Responsive Tokens

**Objective**: Implement tokens that adapt to different screen sizes.

**Steps**:
1. Define breakpoint tokens: `--breakpoint-sm: 640px`, `--breakpoint-lg: 1024px`
2. Create responsive spacing tokens that change at breakpoints
3. Build a Card component that adjusts padding and typography at different sizes
4. Test the responsive behavior by resizing the canvas
5. Export and inspect the generated CSS custom properties

**Expected Outcome**: Components that adapt fluidly to different viewport sizes.

---

## Exercise 4: Composition & Scoping

**Objective**: Master token scoping and component composition patterns.

**Steps**:
1. Create a theme scope with tokens: `--theme: light`, `--surface: white`
2. Build nested components: Dashboard → Card → Button → Icon
3. Apply different themes at different nesting levels
4. Create isolated scopes that don't leak styles to siblings
5. Practice token overrides at each composition level

**Expected Outcome**: Clean, predictable styling with proper encapsulation.

---

## Advanced Challenges

- **Token Documentation**: Generate automatic documentation from your token usage
- **Dynamic Theming**: Implement runtime theme switching
- **Performance**: Optimize token usage for minimal CSS output
- **Accessibility**: Use tokens to ensure consistent contrast ratios and focus states
