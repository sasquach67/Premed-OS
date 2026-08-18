# UNC dining and food access: live service and support routing

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC owner routes. This is dining wayfinding and basic-needs routing, not nutrition, allergy, medical, or food-safety advice.

## Decision in one screen

Atlas can direct a student to Carolina Dining’s current meal-plan, location, and menu information; to the owner for dietary/allergen questions; and to UNC basic-needs/food-assistance routes when food access is difficult. It must not show a static menu/hours as live, promise a meal-plan outcome, judge nutrition, or assert that a food is safe for a particular allergy.

| Student need | Official route | Safe Atlas response | Must not claim |
|---|---|---|---|
| Compare or manage a meal plan | [Carolina Dining](https://dining.unc.edu/) | Check the current plan terms, locations, and account instructions directly with the owner. | That a plan is the best value, will cover a term, or is still available to change. |
| Find food on campus today | [Carolina Dining](https://dining.unc.edu/) | Use the owner’s live location/menu/hours surface. | A static menu, location hours, stock availability, or wait time. |
| Dietary preference or allergen question | Carolina Dining’s current dietary/allergen contact and [Campus Health](https://campushealth.unc.edu/) when health care is needed | Contact the dining owner before relying on an item; use health-care owner routes for medical needs. | That an item is safe, allergen-free, nutritionally appropriate, or medically suitable. |
| Food insecurity or hygiene-item need | [Dean of Students Basic Needs Support](https://dos.unc.edu/student-support/basic-needs-support/) and the current Carolina Cupboard owner route | Use the official support/intake information; check current access/availability. | Guaranteed food, eligibility, privacy terms, or a particular pickup schedule. |
| Emergency/basic-needs crisis | [Dean of Students](https://dos.unc.edu/) | Use the current support route; immediate safety emergency goes to 911/UNC Police. | That dining services or an online form are emergency response. |
| Dining employment | [UNC Handshake](https://careers.unc.edu/students/handshake/) and owner job page | Inspect a current listing for duties, pay, hours, and eligibility. | That a role is open or compatible with a student’s schedule. |

## Meal-plan and dining-service boundaries

Meal-plan rules, locations, menus, hours, dietary information, and account processes are maintained by Carolina Dining and can change by term, break period, event, or service disruption. Atlas should retain the owner link and a `source_checked_at` date—not a permanent copy of the menu or an assumption that last semester’s plan applies now. [Carolina Dining](https://dining.unc.edu/)

Use the phrase **“Check current dining information”** rather than “You can eat at…” unless the owner’s live page is being shown at that moment.

## Dietary and health routing

Dietary preferences, allergens, religious/ethical choices, and medical dietary needs are not interchangeable. Atlas may help a student locate the current Carolina Dining contact/process and Campus Health when appropriate; it must not give a clearance, infer ingredients from a menu title, or substitute for a clinician/dietitian or the dining operator’s live ingredient/allergen information.

## Food access and stigma-safe language

UNC identifies food and basic needs support through its Dean of Students support routes, and UNC materials identify Carolina Cupboard as an on-campus food-assistance resource for members of the UNC community. Atlas should present these as ordinary resource options, not as an assessment of a student’s finances or wellbeing. [Dean of Students Basic Needs Support](https://dos.unc.edu/student-support/basic-needs-support/) · [UNC Housing first-year guide, Carolina Cupboard context](https://housing.unc.edu/wp-content/uploads/2024/02/FYE-CH-2024revised.pdf)

Eligibility, pickup process, inventory, hygiene items, privacy, and current location are owner-determined. Check the current route before displaying operational details.

## Product rules

1. **Menus/hours are live data.** Do not cache them as permanent facts or promise availability.
2. **No dietary safety claims.** The product can route to owner information; it cannot say “safe for you.”
3. **Treat food support as private.** Do not collect a reason for need, financial documentation, medical history, or pantry use for the corpus.
4. **Separate dining from basic needs.** A meal plan is a campus service; food assistance is a support route. Neither is proof of the other.
5. **Avoid value judgments.** “Best meal plan,” “healthy option,” and “cheap food” need user-specific context and live pricing; don’t present them as universal facts.
6. **Use owner job listings.** A dining employment card is only a pointer to the current job source.

## Minimal data contract

```text
FoodAccessRoute
  owner: Carolina_Dining | Dean_of_Students | Carolina_Cupboard | Campus_Health | Handshake
  source_url
  source_checked_at
  route_kind: live_dining | dietary_contact | basic_needs | health | job_listing
  current_check_required: true
  claims_not_supported: [menu_availability, dietary_safety, aid_guarantee, best_value]
```

## Source register and refresh rules

1. [Carolina Dining](https://dining.unc.edu/) — current meal-plan/dining owner; verify menus, hours, policies, and contacts live.
2. [Dean of Students Basic Needs Support](https://dos.unc.edu/student-support/basic-needs-support/) — current basic-needs navigation owner; verify access/eligibility currentness live.
3. [Campus Health](https://campushealth.unc.edu/) — health-care owner; Atlas provides no clinical advice.
4. [UNC Handshake](https://careers.unc.edu/students/handshake/) — dynamic student-employment source; do not mirror openings.

## Evidence limits

- This packet does not state meal-plan prices, dining schedules, menu ingredients, dietary safety, food-pantry availability, or job openings.
- It does not establish financial need, eligibility, food access, or a medical recommendation for any individual.
