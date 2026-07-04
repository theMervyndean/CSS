# Corner Streams Applet Conventions & Design Guidelines

This file records the validated design paradigms and functional constraints established for the Corner Streams web platform. Respect these specifications and state variables during all future enhancement cycles.

## 🎨 Visual System & Branding Tokens
* **Typography**: Utilize **Montserrat** or high-contrast modern **sans-serif** display headings pairing elegantly with bold helper hierarchies.
* **Palette**: 
  - Standard Canvas: Deep Indigo (`indigo-950`), Vivid Emerald (`emerald-600`), and Royal Violet-Indigo gradients (`from-indigo-700 via-indigo-600 to-emerald-600`).
  - Active Element States: Carets, active tick indicators, and border highlights must conform to `emerald-600` or corporate `indigo-600` gradients.
* **Theme Structure**:
  - The Landing, Onboard, and Sign In experiences default to a crisp, high-contrast **Light Theme** (`bg-slate-50` with elegant `bg-white` cards framed by soft Slate borders `border-slate-200` and delicate inner shadows).

## 🛠️ Specialized UI Solutions
* **No Native Dropdown Selects**: Always prefer custom-drawn React select containers (with state tracking toggles such as `isStateOpen` or `isSegmentOpen`) rather than native `<select>` tags. 
  - *Reasoning*: Standard browser selects draw native operating-system option containers with un-overrideable mouseover styles (standard plain blue selections). Creating absolute-positioned, custom options allows full hover-state control (`hover:bg-emerald-600 hover:text-white` or `bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600` for active items), matching the platform's custom branding palette.

## 📝 Text Copy Standards
- **Onboard School Header**: *"Onboard Your School"*
  - **Subtitle Paragraph**: *"Fill in your details to configure your school's database"*
- **Sign In Header**: *"Sign In to Dashboard"*
  - **Subtitle Paragraph**: *"Enter your login details to stream in your dashboard"*
- **Logo Input Label**: *"Upload School's Logo"*
- **Footer Copyright Label**: *"© 2026 Corner Streams. All rights reserved."*
